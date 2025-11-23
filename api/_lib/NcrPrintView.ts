import React from 'react';
import { NonConformanceReport } from '../../src/types';
import SgaLogo from './SgaLogo.js';

const Detail: React.FC<{ label: string; value?: React.ReactNode; colSpan?: number }> = ({ label, value, colSpan = 1 }) => (
    React.createElement('div', { className: "detail-item", style: { gridColumn: `span ${colSpan}` } },
        React.createElement('p', { className: "detail-label" }, label),
        React.createElement('div', { className: "detail-value" }, value || '---')
    )
);

const PageHeader: React.FC<{ report: NonConformanceReport }> = ({ report }) => (
    React.createElement('header', { className: "page-header" },
        React.createElement(SgaLogo, { style: { height: '1.5cm', width: 'auto' } }),
        React.createElement('table', { className: "header-table" },
            React.createElement('tbody', null,
                React.createElement('tr', null,
                    React.createElement('td', { className: "header-label" }, 'NCR ID:'),
                    React.createElement('td', { className: "header-value" }, report.ncrId)
                ),
                React.createElement('tr', null,
                    React.createElement('td', { className: "header-label" }, 'Job No:'),
                    React.createElement('td', { className: "header-value" }, report.jobNo)
                ),
                React.createElement('tr', null,
                    React.createElement('td', { className: "header-label" }, 'Date Issued:'),
                    React.createElement('td', { className: "header-value" }, new Date(report.dateIssued).toLocaleDateString('en-AU'))
                )
            )
        )
    )
);

const NcrPrintView: React.FC<{ report: NonConformanceReport }> = ({ report }) => {
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
              .detail-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px 16px; margin-bottom: 16px; }
              .detail-item { break-inside: avoid; }
              .detail-label { font-size: 8pt; font-weight: 700; color: #6b7280; text-transform: uppercase; margin-bottom: 2px; }
              .detail-value { font-size: 10pt; color: #111827; white-space: pre-wrap; word-break: break-word; padding: 8px; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 4px; min-height: 40px; }
            `),
            
            React.createElement(PageHeader, { report: report }),
            React.createElement('h2', null, 'Non-Conformance Report'),

            React.createElement('div', { className: "detail-grid" },
                React.createElement(Detail, { label: "NCR ID", value: report.ncrId }),
                React.createElement(Detail, { label: "Job Number", value: report.jobNo }),
                React.createElement(Detail, { label: "Date Issued", value: new Date(report.dateIssued).toLocaleDateString('en-AU') }),
                React.createElement(Detail, { label: "Status", value: report.status }),
                React.createElement(Detail, { label: "Issued By", value: report.issuedBy, colSpan: 2 }),
                React.createElement(Detail, { label: "Specification Clause", value: report.specificationClause, colSpan: 2 }),
                React.createElement(Detail, { label: "Description of Non-Conformance", value: report.descriptionOfNonConformance, colSpan: 4 }),
                React.createElement(Detail, { label: "Proposed Corrective Action", value: report.proposedCorrectiveAction, colSpan: 4 }),
                React.createElement(Detail, { label: "Root Cause Analysis", value: report.rootCauseAnalysis, colSpan: 4 }),
                React.createElement(Detail, { label: "Preventative Action", value: report.preventativeAction, colSpan: 4 })
            )
        )
    );
};

export default NcrPrintView;