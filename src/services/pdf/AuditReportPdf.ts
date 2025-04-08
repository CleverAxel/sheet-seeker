import { IAuditVisitReport } from "@/types/workbook";
import jsPDF from "jspdf"
import { autoTable, RowInput } from 'jspdf-autotable'
export class AuditReportPdf {

    public static generate(report: IAuditVisitReport) {
        let offsetY = 20;
        const offsetX = 10;
        const doc = new jsPDF();

        //title
        doc.setFontSize(22);
        doc.setFont("Helvetica", "Bold");
        doc.text(report.cabNumber ?? "-", offsetX, offsetY);
        offsetY += doc.getTextDimensions(report.cabNumber ?? "-", { fontSize: 22 }).h;

        autoTable(doc, {
            startY: offsetY - 5,
            theme: "plain",
            body: [
                this.formatRowPropriety("Ordre de mission", report.assignmentOrder, true),
                this.formatRowPropriety("Numéro de cabine", report.cabNumber),
                this.formatRowPropriety("Adresse", report.address),
                this.formatRowPropriety("Date de visite", report.date),
                this.formatRowPropriety("Effectué par", report.technician),
                this.formatRowPropriety("Base d'examen", report.baseOfReview),
                this.formatRowPropriety("Article de référence", report.referenceArticle),
                this.formatRowPropriety("Schéma de mise à la terre", report.groundDiagram),
                this.formatRowPropriety("Tension de service", report.operatingVoltage),
                this.formatRowPropriety("Dispositif de mise à la terre", report.groundingDevice),
                this.formatRowPropriety("Mesure de terre déconnectée", report.disconnectedGroundMeasurement),
                this.formatRowPropriety("Conclusion", report.conclusion),
            ],
            styles: {
                valign: "top",
            },
        });

        if (report.infringementsAndComments.length != 0) {
            // offsetY += (doc as any).lastAutoTable.finalY;
            // doc.setFontSize(22);
            // doc.setFont("Helvetica", "Oblique");
            // doc.text("Infractions/Remarques :", offsetX, offsetY);
            // offsetY += doc.getTextDimensions("Infractions/Remarques", { fontSize: 22 }).h;

            autoTable(doc, {
                // startY: offsetY - 5,
                theme: 'striped',
                head: [
                    [
                        { content: "Infractions/Remarques", styles: { lineWidth: { right: 0.3 }, lineColor: [255, 255, 255], fontStyle: "bold", textColor: [255, 255, 255], halign: "center", fontSize: 14 } },
                        { content: "Commentaires", styles: { fontStyle: "bold", textColor: [255, 255, 255], halign: "center", fontSize: 14 } },
                    ]
                ],
                body: this.formatInfringementsAndComments(report),
                headStyles: { fillColor: [31, 41, 55], lineColor: [0, 0, 0], fontStyle: "bold", textColor: [255, 255, 255], halign: "center", fontSize: 14 },
                bodyStyles: { fillColor: [255, 255, 255], halign: "left", valign: "top" }
            });
        }
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        doc.save(`${year}${month}${day}_${report.cabNumber ?? "undefined"}`);
    }

    private static formatRowPropriety(title: string, value: string | null, topLine = false): RowInput {
        if (topLine)
            return [
                { content: title ?? "-", styles: { lineColor: [255, 255, 255], lineWidth: { bottom: 0.5, top: 0.5 }, fillColor: [31, 41, 55], fontStyle: "bold", textColor: [255, 255, 255], cellWidth: 50, halign: "center", fontSize: 14 } },
                { content: value ?? "-", styles: { lineColor: [31, 41, 55], lineWidth: { bottom: 0.5, top: 0.5 } } },
            ];
        return [
            { content: title ?? "-", styles: { lineColor: [255, 255, 255], lineWidth: { bottom: 0.5 }, fillColor: [31, 41, 55], fontStyle: "bold", textColor: [255, 255, 255], cellWidth: 50, halign: "center", fontSize: 14 } },
            { content: value ?? "-", styles: { lineColor: [31, 41, 55], lineWidth: { bottom: 0.5 } } },
        ];
    }

    private static formatInfringementsAndComments(report: IAuditVisitReport): RowInput[] {
        return report.infringementsAndComments.map((inf) => {
            return [
                { content: inf.infringement, styles: { lineColor: [31, 41, 55], lineWidth: { right: 0.5 } } },
                { content: inf.comments ?? "-", styles: { cellWidth: 75 } },
            ]
        });
    }
}