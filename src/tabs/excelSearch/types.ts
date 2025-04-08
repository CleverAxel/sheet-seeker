import { IAuditVisitReport } from "@/types/workbook";
import { JSX, Setter } from "solid-js";

export interface IPropsExcelSearch {
    callbackGetFiles: () => File[];
}

export interface IPropsInfringementsDisplay {
    setToggleInfringementsDisplay: Setter<boolean>,
    data: IAuditVisitReport | undefined,
}

export interface IPropsDataRow {
    title: string,
    children?: string | JSX.Element,
}