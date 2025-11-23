import React from 'react';
import { IncidentReport } from '../../src/types';
import SgaLogo from './SgaLogo.js';

const Detail: React.FC<{ label: string; value?: React.ReactNode; colSpan?: number }> = ({ label, value, colSpan = 1 }) => (
    React.createElement('div', { className: "detail-item", style: { gridColumn: `span ${colSpan}` } },
        React.createElement('p', { className: "detail-label" }, label),
        React.createElement('div', { className: "detail-value" }, value || '---')
    )
);

const PageHeader: React.FC<{ report: IncidentReport }> = ({ report }) => (
    React.createElement('header', { className: "page-header" },
        React.createElement(SgaLogo, { style: { height: '1.5cm', width: 'auto' } }),
        React.createElement('table', { className: "header-table" },
            React.createElement('tbody', null,
                React.createElement('tr', null,
                    React.createElement('td', { className: "header-label" }, 'Report ID:'),
                    React.createElement('td', { className: "header-value" }, report.reportId)
                ),
                React.createElement('tr', null,
                    React.createElement('td', { className: "header-label" }, 'Report Type:'),
                    React.createElement('td', { className: "header-value" }, report.type)
                ),
                React.createElement('tr', null,
                    React.createElement('td', { className: "header-label" }, 'Job No:'),
                    React.createElement('td', { className: "header-value" }, report.jobNo || 'N/A')
                )
            )
        )
    )
);

const IncidentReportPrintView: React.FC<{ report: IncidentReport }> = ({ report }) => {
    return (
        React.createElement('div', { className: "report-container" },
            React.createElement('style', null, `
              body { -webkit-print-color-adjust: exact; }
              .report-container { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #111827; font-size: 10pt; }
              .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; border-bottom: 1px solid #d1d5db; padding-bottom: 10px; }
              .header-table { font-size: 9pt; text-align: right; }
              .header-label { font-weight: 700; padding-right: 8px; }
              .header-value { font-weight: 400; }
              h2 { font-size: 18pt; font-weight: 700; color: white; background-color: #b45309; padding: 8px 12px; margin-bottom: 20px; }
              h3 { font-size: 12pt; font-weight: 700; color: #1f2937; margin-top: 20px; margin-bottom: 10px; padding-bottom: 4px; border-bottom: 1px solid #d1d5db;}
              .detail-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px 16px; margin-bottom: 16px; }
              .detail-item { break-inside: avoid; }
              .detail-label { font-size: 8pt; font-weight: 700; color: #6b7280; text-transform: uppercase; margin-bottom: 2px; }
              .detail-value { font-size: 10pt; color: #111827; white-space: pre-wrap; word-break: break-word; padding: 8px; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 4px; min-height: 40px; }
              .photo-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 16px; }
              .photo-item img { border: 1px solid #d1d5db; width: 100%; height: auto; border-radius: 4px; }
            `),
            
            React.createElement(PageHeader, { report: report }),
            React.createElement('h2', null, `${report.type} Report`),

            React.createElement('h3', null, 'Initial Report Details'),
            React.createElement('div', { className: "detail-grid" },
                React.createElement(Detail, { label: "Report ID", value: report.reportId }),
                React.createElement(Detail, { label: "Date of Event", value: new Date(report.dateOfIncident).toLocaleDateString('en-AU') }),
                React.createElement(Detail, { label: "Time of Event", value: report.timeOfIncident }),
                React.createElement(Detail, { label: "Status", value: report.status }),
                React.createElement(Detail, { label: "Location", value: report.location, colSpan: 2 }),
                React.createElement(Detail, { label: "Reported By", value: report.reportedBy }),
                React.createElement(Detail, { label: "Job No.", value: report.jobNo }),
                React.createElement(Detail, { label: "Personnel Involved", value: report.involvedPersonnel, colSpan: 2 }),
                React.createElement(Detail, { label: "Witnesses", value: report.witnesses, colSpan: 2 }),
                React.createElement(Detail, { label: "Description", value: React.createElement('p', { className: "whitespace-pre-wrap" }, report.description), colSpan: 4 }),
                React.createElement(Detail, { label: "Immediate Action Taken", value: React.createElement('p', { className: "whitespace-pre-wrap" }, report.immediateActionTaken), colSpan: 4 })
            ),

            report.photoUrls && report.photoUrls.length > 0 && (
                React.createElement(React.Fragment, null,
                    React.createElement('h3', null, 'Attached Photos'),
                    React.createElement('div', { className: "photo-grid" },
                        report.photoUrls.map((url, i) => (
                            React.createElement('div', { key: i, className: "photo-item" }, React.createElement('img', { src: url, alt: `Incident Photo ${i+1}` }))
                        ))
                    )
                )
            ),

            React.createElement('h3', null, 'Investigation & Close-out'),
            React.createElement('div', { className: "detail-grid" },
                 React.createElement(Detail, { label: "Investigation Findings", value: report.investigationFindings, colSpan: 4 }),
                 React.createElement(Detail, { label: "Corrective & Preventative Actions", value: report.correctiveActions, colSpan: 4 }),
                 React.createElement(Detail, { label: "HSEQ Sign-off", value: report.hseqSignOff?.isSigned ? `Signed by ${report.hseqSignOff.signedBy} on ${new Date(report.hseqSignOff.timestamp!).toLocaleDateString('en-AU')}` : 'Pending', colSpan: 2 }),
                 React.createElement(Detail, { label: "Division Admin Sign-off", value: report.adminSignOff?.isSigned ? `Signed by ${report.adminSignOff.signedBy} on ${new Date(report.adminSignOff.timestamp!).toLocaleDateString('en-AU')}` : 'Pending', colSpan: 2 }),
                 React.createElement(Detail, { label: "Closed By", value: report.closedBy }),
                 React.createElement(Detail, { label: "Close-out Date", value: report.closeOutDate ? new Date(report.closeOutDate).toLocaleDateString('en-AU') : '' })
            )
        )
    );
};

export default IncidentReportPrintView;