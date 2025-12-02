import React from 'react';
import { ScopeReport } from '../../src/types/project-management.js';
import SgaLogo from './SgaLogo.js';

const Watermark: React.FC = () => (
    React.createElement('div', {
        style: {
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%) rotate(-45deg)',
            fontSize: '120px',
            fontWeight: 'bold',
            color: '#e0e0e0',
            opacity: 0.15,
            zIndex: -1,
            userSelect: 'none',
            pointerEvents: 'none'
        }
    }, 'SGA')
);

const Detail: React.FC<{ label: string; value?: React.ReactNode; colSpan?: number }> = ({ label, value, colSpan = 1 }) => (
    React.createElement('div', { className: "detail-item", style: { gridColumn: `span ${colSpan}` } },
        React.createElement('p', { className: "detail-label" }, label),
        React.createElement('div', { className: "detail-value" }, value || '---')
    )
);

const PageHeader: React.FC<{ report: ScopeReport }> = ({ report }) => (
    React.createElement('header', { className: "page-header" },
        React.createElement(SgaLogo, { style: { height: '1.5cm', width: 'auto' } }),
        React.createElement('table', { className: "header-table" },
            React.createElement('tbody', null,
                React.createElement('tr', null,
                    React.createElement('td', { className: "header-label" }, 'Report No:'),
                    React.createElement('td', { className: "header-value" }, report.reportNumber)
                ),
                React.createElement('tr', null,
                    React.createElement('td', { className: "header-label" }, 'Visit Type:'),
                    React.createElement('td', { className: "header-value" }, report.visitType)
                ),
                React.createElement('tr', null,
                    React.createElement('td', { className: "header-label" }, 'Date:'),
                    React.createElement('td', { className: "header-value" }, new Date(report.actualDate).toLocaleDateString('en-AU'))
                )
            )
        )
    )
);

const ScopeReportPrintView: React.FC<{ report: ScopeReport }> = ({ report }) => {
    return (
        React.createElement('div', { className: "report-container" },
            React.createElement('style', null, `
              body { -webkit-print-color-adjust: exact; }
              .report-container { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #111827; font-size: 10pt; }
              .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; border-bottom: 1px solid #d1d5db; padding-bottom: 10px; }
              .header-table { font-size: 9pt; text-align: right; }
              .header-label { font-weight: 700; padding-right: 8px; }
              .header-value { font-weight: 400; }
              h2 { font-size: 18pt; font-weight: 700; color: white; background-color: #059669; padding: 8px 12px; margin-bottom: 20px; }
              h3 { font-size: 12pt; font-weight: 700; color: #1f2937; margin-top: 20px; margin-bottom: 10px; padding-bottom: 4px; border-bottom: 1px solid #d1d5db;}
              .detail-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px 16px; margin-bottom: 16px; }
              .detail-item { break-inside: avoid; }
              .detail-label { font-size: 8pt; font-weight: 700; color: #6b7280; text-transform: uppercase; margin-bottom: 2px; }
              .detail-value { font-size: 10pt; color: #111827; white-space: pre-wrap; word-break: break-word; padding: 8px; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 4px; min-height: 40px; }
              .photo-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-top: 16px; }
              .photo-item img { border: 1px solid #d1d5db; width: 100%; height: auto; border-radius: 4px; }
              .photo-caption { font-size: 8pt; color: #6b7280; margin-top: 4px; }
              .status-badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 9pt; font-weight: 600; }
              .status-good { background-color: #d1fae5; color: #065f46; }
              .status-fair { background-color: #fef3c7; color: #92400e; }
              .status-poor { background-color: #fee2e2; color: #991b1b; }
              .status-critical { background-color: #f3e8ff; color: #6b21a8; }
              .hazard-table { width: 100%; border-collapse: collapse; margin-top: 8px; }
              .hazard-table th, .hazard-table td { border: 1px solid #e5e7eb; padding: 8px; text-align: left; font-size: 9pt; }
              .hazard-table th { background-color: #f3f4f6; font-weight: 600; }
            `),

            React.createElement(Watermark),
            React.createElement(PageHeader, { report: report }),
            React.createElement('h2', null, `Scope Report - Visit ${report.visitNumber}`),

            // Visit Details
            React.createElement('h3', null, 'Visit Details'),
            React.createElement('div', { className: "detail-grid" },
                React.createElement(Detail, { label: "Report Number", value: report.reportNumber }),
                React.createElement(Detail, { label: "Visit Type", value: report.visitType }),
                React.createElement(Detail, { label: "Scheduled Date", value: new Date(report.scheduledDate).toLocaleDateString('en-AU') }),
                React.createElement(Detail, { label: "Actual Date", value: new Date(report.actualDate).toLocaleDateString('en-AU') }),
                React.createElement(Detail, { label: "Completed By", value: report.completedBy }),
                React.createElement(Detail, { label: "Status", value: report.status }),
                React.createElement(Detail, { label: "Est. Duration", value: `${report.estimatedDuration} days` }),
                React.createElement(Detail, { label: "Visit #", value: report.visitNumber.toString() })
            ),

            // Site Accessibility
            React.createElement('h3', null, 'Site Accessibility'),
            React.createElement('div', { className: "detail-grid" },
                React.createElement(Detail, { label: "Accessible", value: report.siteAccessibility.accessible ? 'Yes' : 'No' }),
                React.createElement(Detail, { label: "Access Notes", value: report.siteAccessibility.accessNotes, colSpan: 3 }),
                React.createElement(Detail, { label: "Restrictions", value: report.siteAccessibility.restrictions.join(', ') || 'None', colSpan: 4 })
            ),

            // Surface Condition
            React.createElement('h3', null, 'Surface Condition'),
            React.createElement('div', { className: "detail-grid" },
                React.createElement(Detail, {
                    label: "Current Condition",
                    value: React.createElement('span', {
                        className: `status-badge status-${report.surfaceCondition.currentCondition.toLowerCase()}`
                    }, report.surfaceCondition.currentCondition)
                }),
                React.createElement(Detail, { label: "Defects Identified", value: report.surfaceCondition.defects.join(', ') || 'None', colSpan: 3 })
            ),

            // Measurements
            React.createElement('h3', null, 'Site Measurements'),
            React.createElement('div', { className: "detail-grid" },
                React.createElement(Detail, { label: "Area (m²)", value: report.measurements.area.toString() }),
                React.createElement(Detail, { label: "Depth (mm)", value: report.measurements.depth.toString() }),
                React.createElement(Detail, {
                    label: "Chainages",
                    value: report.measurements.chainages.map(c => `CH ${c.start}m - CH ${c.end}m`).join(', '),
                    colSpan: 2
                })
            ),

            // Traffic Management
            React.createElement('h3', null, 'Traffic Management'),
            React.createElement('div', { className: "detail-grid" },
                React.createElement(Detail, { label: "TM Required", value: report.trafficManagement.required ? 'Yes' : 'No' }),
                React.createElement(Detail, { label: "TMP Required", value: report.trafficManagement.tmpRequired ? 'Yes' : 'No' }),
                React.createElement(Detail, { label: "Restrictions", value: report.trafficManagement.restrictions.join(', ') || 'None', colSpan: 2 }),
                React.createElement(Detail, { label: "Notes", value: report.trafficManagement.notes, colSpan: 4 })
            ),

            // Utilities Assessment
            React.createElement('h3', null, 'Utilities Assessment'),
            React.createElement('div', { className: "detail-grid" },
                React.createElement(Detail, { label: "Utilities Identified", value: report.utilities.identified ? 'Yes' : 'No' }),
                React.createElement(Detail, { label: "Services Present", value: report.utilities.services.join(', ') || 'None identified', colSpan: 3 })
            ),

            // Hazard Assessment
            report.hazards.identified && report.hazards.hazardList.length > 0 && (
                React.createElement(React.Fragment, null,
                    React.createElement('h3', null, 'Hazard Assessment'),
                    React.createElement('table', { className: "hazard-table" },
                        React.createElement('thead', null,
                            React.createElement('tr', null,
                                React.createElement('th', null, 'Hazard'),
                                React.createElement('th', null, 'Control Measure')
                            )
                        ),
                        React.createElement('tbody', null,
                            report.hazards.hazardList.map((h, i) => (
                                React.createElement('tr', { key: i },
                                    React.createElement('td', null, h.hazard),
                                    React.createElement('td', null, h.control)
                                )
                            ))
                        )
                    )
                )
            ),

            // Recommendations
            React.createElement('h3', null, 'Recommendations'),
            React.createElement('div', { className: "detail-grid" },
                React.createElement(Detail, { label: "Recommendations", value: report.recommendations, colSpan: 4 })
            ),

            // Photos
            report.photos && report.photos.length > 0 && (
                React.createElement(React.Fragment, null,
                    React.createElement('h3', null, 'Site Photos'),
                    React.createElement('div', { className: "photo-grid" },
                        report.photos.map((photo, i) => (
                            React.createElement('div', { key: i, className: "photo-item" },
                                React.createElement('img', { src: photo.data, alt: photo.name }),
                                React.createElement('p', { className: "photo-caption" }, photo.description || photo.name)
                            )
                        ))
                    )
                )
            ),

            // Sign-off
            React.createElement('h3', null, 'Sign-off'),
            React.createElement('div', { className: "detail-grid" },
                React.createElement(Detail, { label: "Signature", value: report.signature ? 'Signed' : 'Pending' }),
                React.createElement(Detail, { label: "Signed At", value: report.signedAt ? new Date(report.signedAt).toLocaleString('en-AU') : '---' })
            )
        )
    );
};

export default ScopeReportPrintView;
