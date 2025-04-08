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

export interface IAuditVisitReportWithDuplicates {
    report : IAuditVisitReport,
    duplicates: { filename: string, sheetName: string }[]
}