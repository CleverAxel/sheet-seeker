import ExcelJS from 'exceljs';
import "./../extensions/string.extension"
import { Setter } from "solid-js";
import { EnumAssignmentOrder, EnumInfringementsWithComments, EnumSheetField } from "../enums/sheetField";


export interface IAuditVisitReport {
    filename: string,
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
    private workBook = new ExcelJS.Workbook();
    private files: File[] = [];
    private fileCount = 0;
    private processedFileCount = 0;
    private processedSheetCount = 0;
    private referenceFoundCount = 0;
    private cabRefToSearch: string = "";

    private data: IAuditVisitReport[] = [];
    private unCommonCabNumbers: IUncommonCabNumber[] = [];

    private webWorkers: Worker[] = new Array(10);


    private setProcessedFileCount!: Setter<number>;
    private setProcessedSheetCount!: Setter<number>;
    private setReferenceFoundCount!: Setter<number>;

    constructor(files: File[], sheetNamesToSkip: string[] = []) {
        this.sheetNamesToSkip = sheetNamesToSkip.map((name) => this.normalizeString(name));
        this.files = files;
        this.fileCount = files.length;

        this.webWorkers.forEach((worker) => {
            worker = new Worker(new URL("./WebWorkerExcel.ts", import.meta.url));
        });

    }

    public setSetters(fileCount: Setter<number>, sheetCount: Setter<number>, referenceFound: Setter<number>) {
        this.setProcessedFileCount = fileCount;
        this.setProcessedSheetCount = sheetCount;
        this.setReferenceFoundCount = referenceFound;

        this.setProcessedFileCount(0);
        this.setProcessedSheetCount(0);
        this.setReferenceFoundCount(0);
    }

    public async startSeeking(cabRef: string) {

        this.cabRefToSearch = this.normalizeString(cabRef);

        let i = 0;

        const bytesPerBatch = 1000000 * 10; // ~ 10 MB
        while (i < this.fileCount) {
            let currentBytesToParse = 0;
            let nbrWorkersAssignedTask = 0;
            let promisesToResolve: Promise<void>[] = [];

            while (currentBytesToParse < bytesPerBatch && i < this.fileCount && nbrWorkersAssignedTask < this.webWorkers.length) {                
                promisesToResolve.push(this.seekCabReference(this.files[i]));
                currentBytesToParse += this.files[i].size;
                nbrWorkersAssignedTask++;
                if (currentBytesToParse < bytesPerBatch && nbrWorkersAssignedTask < this.webWorkers.length) {
                    i++;
                }
            }

            console.log(`Batch of ${promisesToResolve.length} files`);
            await Promise.all(promisesToResolve);

            i++;
        }
    }

    public getData() {
        return this.data;
    }

    //cet array aura des valeurs si le champs contenant la référence du numéro de cabine n'est pas une chaine de charactère.
    //ceci est peut-être dû que ça ne soit pas une fiche cabine
    public getUncommonCabNumbers() {
        return this.unCommonCabNumbers;
    }

    private async seekCabReference(file: File): Promise<void> {
        return new Promise((resolve, reject) => {
            const fileReader = new FileReader();

            fileReader.onload = async () => {
                try {
                    const buffer = fileReader.result;
                    const workbook = await this.workBook.xlsx.load(buffer as ArrayBuffer);


                    workbook.eachSheet((sheet) => {
                        if (this.sheetNamesToSkip.includes(this.normalizeString(sheet.name))) {
                            return;
                        }

                        if (this.getCellValue(sheet.getCell(EnumSheetField.cabNumber)) && this.normalizeString(this.getCellValue(sheet.getCell(EnumSheetField.cabNumber)) as string, file, sheet.name) == this.cabRefToSearch) {

                            let infringements: IInfringementAndComments[] = [];

                            EnumInfringementsWithComments.forEach((i) => {
                                if (this.getCellValue(sheet.getCell(i.infringement)) != null) {
                                    infringements.push({ infringement: this.getCellValue(sheet.getCell(i.infringement)), comments: this.getCellValue(sheet.getCell(i.comment)) });
                                }
                            })

                            let dataSheet: IAuditVisitReport = {
                                filename: file.name,
                                assignmentOrder: this.getCellValue(sheet.getCell(EnumAssignmentOrder.first)) + " " + this.getCellValue(sheet.getCell(EnumAssignmentOrder.second)) + " " + this.getCellValue(sheet.getCell(EnumAssignmentOrder.third)) + " " + this.getCellValue(sheet.getCell(EnumAssignmentOrder.forth)) + " " + this.getCellValue(sheet.getCell(EnumAssignmentOrder.fifth)),
                                cabNumber: this.getCellValue(sheet.getCell(EnumSheetField.cabNumber)),
                                date: this.getCellValue(sheet.getCell(EnumSheetField.date)) instanceof Date ? this.formatDateToString(this.getCellValue(sheet.getCell(EnumSheetField.date))) : this.getCellValue(sheet.getCell(EnumSheetField.date)),
                                address: this.getCellValue(sheet.getCell(EnumSheetField.address)),
                                technician: this.getCellValue(sheet.getCell(EnumSheetField.technician)),
                                baseOfReview: this.getCellValue(sheet.getCell(EnumSheetField.baseOfReview)),
                                referenceArticle: this.getCellValue(sheet.getCell(EnumSheetField.referenceArticle)),
                                operatingVoltage: this.getCellValue(sheet.getCell(EnumSheetField.operatingVoltage)),
                                groundingDevice: this.getCellValue(sheet.getCell(EnumSheetField.groundingDevice)),
                                groundDiagram: this.getCellValue(sheet.getCell(EnumSheetField.groundDiagram)),
                                disconnectedGroundMeasurement: this.getCellValue(sheet.getCell(EnumSheetField.disconnectedGroundMeasurement)),
                                conclusion: this.getCellValue(sheet.getCell(EnumSheetField.conclusion)),
                                infringementsAndComments: infringements
                            }

                            this.data.push(dataSheet);

                            this.referenceFoundCount++;
                            this.setReferenceFoundCount(this.referenceFoundCount);
                        }

                        this.processedSheetCount++;
                        this.setProcessedSheetCount(this.processedSheetCount);
                    });

                    this.processedFileCount++;
                    this.setProcessedFileCount(this.processedFileCount);
                    resolve();
                } catch (error) {
                    reject(error);
                }
            };

            fileReader.onerror = () => reject(new Error("File reading error"));

            fileReader.readAsArrayBuffer(file);
        });
    }

    private normalizeString(str: string): string;
    private normalizeString(str: string, file: File, sheetName: string): string | null;
    private normalizeString(str: string, file?: File, sheetName?: string): string | null {
        try {
            return str._removeUselessBlanks()._toAscii().toUpperCase();
        } catch (e) {
            if (!file && !sheetName) {
                throw e;
            }

            this.unCommonCabNumbers.push({ fileName: file!.name, sheetName: sheetName! });

            return null;
        }
    }

    private getCellValue(cell: ExcelJS.Cell): any {
        if (cell.value && typeof cell.value === 'object' && 'formula' in cell.value) {
            const formulaValue = cell.value as ExcelJS.CellFormulaValue;
            return formulaValue.result;
        }

        return cell.value;
    }

    private formatDateToString(date: Date) {
        return new Intl.DateTimeFormat('fr-FR', {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        }).format(date);
    }


}