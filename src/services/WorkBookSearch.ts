import "./../extensions/string.extension"
import { Setter } from "solid-js";


export interface IAuditVisitReport {
    filename: string,
    sheetName: string,
    assignmentOrder: string | null,
    cabNumber: string | null,
    address: string | null,
    date: string | null,
    technician: string | null,
    baseOfReview: string | null,
    referenceArticle: string | null,
    groundDiagram: string | null,
    operatingVoltage: string | null,
    groundingDevice: string | null,
    disconnectedGroundMeasurement: string | null,
    conclusion: string | null,
    infringementsAndComments: IInfringementAndComments[],
}

export interface IInfringementAndComments {
    infringement: string, comments: string | null
}

export interface IUncommonCabNumber {
    fileName: string,
    sheetName: string,
}

export class WorkBookSearch {
    private sheetNamesToSkip: string[] = [];
    private files: File[] = [];

    private cabRefToSearch: string = "";

    private auditVisitReports: IAuditVisitReport[] = [];

    private webWorkers: Worker[] = new Array(10);


    private setProcessedFilesCount!: Setter<number>;
    private setProcessedSheetsCount!: Setter<number>;
    private setReferenceFoundCount!: Setter<number>;

    constructor(files: File[], sheetNamesToSkip: string[] = []) {
        this.sheetNamesToSkip = sheetNamesToSkip.map((name) => this.normalizeString(name));
        this.files = files;

        for (let i = 0; i < this.webWorkers.length; i++) {
            this.webWorkers[i] = new Worker(new URL("./WebWorkerExcel.ts", import.meta.url), { type: "module" });
        }
    }

    public setSetters(fileCount: Setter<number>, sheetCount: Setter<number>, referenceFound: Setter<number>) {
        this.setProcessedFilesCount = fileCount;
        this.setProcessedSheetsCount = sheetCount;
        this.setReferenceFoundCount = referenceFound;

        this.setProcessedFilesCount(0);
        this.setProcessedSheetsCount(0);
        this.setReferenceFoundCount(0);
    }

    public startSeeking(cabRef: string): Promise<IAuditVisitReport[]> {
        return new Promise((resolve) => {
            this.cabRefToSearch = this.normalizeString(cabRef);
            let activeWorkers = this.webWorkers.length;

            const tryDispatchFile = (worker: Worker) => {
                const nextFile = this.files.pop();
                if (nextFile) {
                    worker.postMessage({
                        file: nextFile,
                        search: this.cabRefToSearch,
                        sheetNamesToSkip: this.sheetNamesToSkip
                    });
                } else {
                    worker.terminate();
                    activeWorkers--;
                    if (activeWorkers == 0) {
                        resolve(this.auditVisitReports);
                    }
                }
            };

            for (let i = 0; i < this.webWorkers.length; i++) {
                const worker = this.webWorkers[i];

                worker.onmessage = (e) => {
                    this.auditVisitReports.push(...e.data.reports);
                    this.setProcessedFilesCount((prev: number) => prev + 1);
                    this.setProcessedSheetsCount((prev: number) => prev + e.data.processedSheetsCount);
                    this.setReferenceFoundCount((prev: number) => prev + e.data.reports.length);

                    tryDispatchFile(worker);
                };

                tryDispatchFile(worker);
            }
        });
        
    }

    private normalizeString(str: string): string {
        try {
            return str._removeUselessBlanks()._toAscii().toUpperCase();
        } catch (e) {
            return "";
        }
    }


}