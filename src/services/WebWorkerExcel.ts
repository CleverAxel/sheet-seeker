/// <reference lib="webworker" />

import ExcelJS from 'exceljs';
import { IInfringementAndComments, IAuditVisitReport } from "./WorkBookSearch";
import "./../extensions/string.extension"
import { EnumAssignmentOrder, EnumInfringementsWithComments, EnumSheetField } from "../enums/sheetField";

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

                if (getCellValue(sheet.getCell(EnumSheetField.cabNumber)) && normalizeString(getCellValue(sheet.getCell(EnumSheetField.cabNumber)) as string) == search) {

                    let infringements: IInfringementAndComments[] = [];

                    EnumInfringementsWithComments.forEach((i) => {
                        if (getCellValue(sheet.getCell(i.infringement)) != null) {
                            infringements.push({ infringement: getCellValue(sheet.getCell(i.infringement)), comments: getCellValue(sheet.getCell(i.comment)) });
                        }
                    })

                    let report: IAuditVisitReport = {
                        filename: file.name,
                        sheetName : sheet.name,
                        assignmentOrder: getCellValue(sheet.getCell(EnumAssignmentOrder.first)) + " " + getCellValue(sheet.getCell(EnumAssignmentOrder.second)) + " " + getCellValue(sheet.getCell(EnumAssignmentOrder.third)) + " " + getCellValue(sheet.getCell(EnumAssignmentOrder.forth)) + " " + getCellValue(sheet.getCell(EnumAssignmentOrder.fifth)),
                        cabNumber: getCellValue(sheet.getCell(EnumSheetField.cabNumber)),
                        date: getCellValue(sheet.getCell(EnumSheetField.date)) instanceof Date ? formatDateToString(getCellValue(sheet.getCell(EnumSheetField.date))) : getCellValue(sheet.getCell(EnumSheetField.date)),
                        address: getCellValue(sheet.getCell(EnumSheetField.address)),
                        technician: getCellValue(sheet.getCell(EnumSheetField.technician)),
                        baseOfReview: getCellValue(sheet.getCell(EnumSheetField.baseOfReview)),
                        referenceArticle: getCellValue(sheet.getCell(EnumSheetField.referenceArticle)),
                        operatingVoltage: getCellValue(sheet.getCell(EnumSheetField.operatingVoltage)),
                        groundingDevice: getCellValue(sheet.getCell(EnumSheetField.groundingDevice)),
                        groundDiagram: getCellValue(sheet.getCell(EnumSheetField.groundDiagram)),
                        disconnectedGroundMeasurement: getCellValue(sheet.getCell(EnumSheetField.disconnectedGroundMeasurement)),
                        conclusion: getCellValue(sheet.getCell(EnumSheetField.conclusion)),
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