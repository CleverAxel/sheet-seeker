/// <reference lib="webworker" />

import ExcelJS from 'exceljs';
import { IInfringementAndComments, IAuditVisitReport } from "@/types/workbook";
import "@/extensions/string.extension"
import { EnumAssignmentOrder, EnumInfringementsWithComments, EnumAuditReportField } from "@/enums/auditReportField";

const worker: DedicatedWorkerGlobalScope = self as any;
// const self = globalThis as unknown as DedicatedWorkerGlobalScope;

worker.onmessage = ({ data }) => {

    const file: File = data.file;
    const search: string = data.search;
    const sheetNamesToSkip: string = data.sheetNamesToSkip;

    const fileReader = new FileReader();
    const ExcelWorkBook = new ExcelJS.Workbook();

    let reports:IAuditVisitReport[] = [];

    fileReader.onload = async () => {
        try {
            const buffer = fileReader.result;
            const workbook = await ExcelWorkBook.xlsx.load(buffer as ArrayBuffer);


            workbook.eachSheet((sheet) => {
                if (sheetNamesToSkip.includes(sheet.name._toAscii()._removeUselessBlanks().toUpperCase())) {
                    return;
                }

                if (getCellValue(sheet.getCell(EnumAuditReportField.cabNumber)) && normalizeString(getCellValue(sheet.getCell(EnumAuditReportField.cabNumber)) as string) == search) {

                    let infringements: IInfringementAndComments[] = [];

                    EnumInfringementsWithComments.forEach((i) => {
                        if (getCellValue(sheet.getCell(i.infringement)) != null) {
                            infringements.push({ infringement: getCellValue(sheet.getCell(i.infringement)), comments: getCellValue(sheet.getCell(i.comment)) });
                        }
                    })

                    let assignementOrder:string[] = [];
                    EnumAssignmentOrder.forEach((field) => {
                        assignementOrder.push(getCellValue(sheet.getCell(field)));
                    })

                    let report: IAuditVisitReport = {
                        filename: file.name,
                        sheetName : sheet.name,
                        assignmentOrder: assignementOrder.join(" "),
                        cabNumber: getCellValue(sheet.getCell(EnumAuditReportField.cabNumber)),
                        date: getCellValue(sheet.getCell(EnumAuditReportField.date)) instanceof Date ? formatDateToString(getCellValue(sheet.getCell(EnumAuditReportField.date))) : getCellValue(sheet.getCell(EnumAuditReportField.date)),
                        address: getCellValue(sheet.getCell(EnumAuditReportField.address)),
                        technician: getCellValue(sheet.getCell(EnumAuditReportField.technician)),
                        baseOfReview: getCellValue(sheet.getCell(EnumAuditReportField.baseOfReview)),
                        referenceArticle: getCellValue(sheet.getCell(EnumAuditReportField.referenceArticle)),
                        operatingVoltage: getCellValue(sheet.getCell(EnumAuditReportField.operatingVoltage)),
                        groundingDevice: getCellValue(sheet.getCell(EnumAuditReportField.groundingDevice)),
                        groundDiagram: getCellValue(sheet.getCell(EnumAuditReportField.groundDiagram)),
                        disconnectedGroundMeasurement: getCellValue(sheet.getCell(EnumAuditReportField.disconnectedGroundMeasurement)),
                        conclusion: getCellValue(sheet.getCell(EnumAuditReportField.conclusion)),
                        infringementsAndComments: infringements
                    }
                    reports.push(report);
                }


            });

            worker.postMessage({reports, processedSheetsCount: workbook.worksheets.length});
        } catch (error) {
            throw Error("Failure web worker | ExcelJs");
        }
    };

    fileReader.onerror = () => {throw Error("Failure web worker | File Reader")};
    try{
        //lance une erreur disant qu'il n'y a pas accès what ever
        fileReader.readAsArrayBuffer(file);
    } catch {
    };
};


function normalizeString(str: string): string | null {
    try {
        return str._removeUselessBlanks()._toAscii().toUpperCase();
    } catch (e) {
        return null;
    }
}

function getCellValue(cell: ExcelJS.Cell): any {
    if (cell.value && typeof cell.value === 'object' && 'formula' in cell.value) {
        const formulaValue = cell.value as ExcelJS.CellFormulaValue;
        return formulaValue.result;
    }

    return cell.value;
}

function formatDateToString(date: Date) {
    return new Intl.DateTimeFormat('fr-FR', {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    }).format(date);
}