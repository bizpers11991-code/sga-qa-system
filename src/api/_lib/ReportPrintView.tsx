// api/_lib/ReportPrintView.tsx
import React from 'react';
import { FinalQaPack, ItpChecklistItem, ItpChecklistSection } from '../../types';
import SgaLogo from './SgaLogo.js';

interface ReportPrintViewProps {
  report: FinalQaPack;
}

// Helper function to chunk arrays for photo layout
const chunk = (arr: any[], size: number) => Array.from({ length: Math.ceil(arr.length / size) }, (v, i) => arr.slice(i * size, i * size + size));

const Detail: React.FC<{ label: string; value?: React.ReactNode; colSpan?: number }> = ({ label, value, colSpan = 1 }) => (
    React.createElement('div', { className: "detail-item", style: { gridColumn: `span ${colSpan}` } },
        React.createElement('p', { className: "detail-label" }, label),
        React.createElement('p', { className: "detail-value" }, value || '---')
    )
);

const PageHeader: React.FC<{ report: FinalQaPack }> = ({ report }) => (
    React.createElement('header', { className: "page-header" },
        React.createElement(SgaLogo, { style: { height: '40px', width: 'auto' } }),
        React.createElement('div', { className: "header-info" },
            React.createElement('div', null,
                React.createElement('strong', null, 'Job Number: '),
                report.job.jobNo
            ),
            React.createElement('div', null,
                React.createElement('strong', null, 'Client: '),
                report.job.client
            ),
            React.createElement('div', null,
                React.createElement('strong', null, 'Project: '),
                report.job.projectName
            )
        )
    )
);

const ReportPrintView: React.FC<ReportPrintViewProps> = ({ report }) => {
    const { job, jobSheet, sgaDailyReport, siteRecord, itpChecklist, asphaltPlacement, straightEdge, sprayReport, timestamp, foremanSignature } = report;

    return (
        React.createElement('div', { className: "report-container" },
            React.createElement('style', null, `
              @page { size: A4; margin: 0; }
              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
                margin: 0;
                padding: 0;
              }
              .report-container {
                font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif;
                color: #111827;
                font-size: 10pt;
                line-height: 1.4;
              }
              .page {
                page-break-after: always;
                page-break-inside: avoid;
                padding: 20mm 15mm 25mm 15mm;
                min-height: 257mm;
                position: relative;
                box-sizing: border-box;
              }
              .page-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 15px;
                padding-bottom: 8px;
                border-bottom: 2px solid #d1d5db;
              }
              .header-info {
                text-align: right;
                font-size: 9pt;
                line-height: 1.6;
              }
              .cover-page {
                padding: 20mm 15mm 25mm 15mm;
                page-break-after: always;
                min-height: 257mm;
                position: relative;
              }
              .cover-title {
                font-size: 32pt;
                font-weight: 700;
                color: #d97706;
                margin: 30px 0 40px 0;
                text-align: left;
              }
              .cover-table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
                font-size: 11pt;
              }
              .cover-table tr {
                border-bottom: 1px solid #e5e7eb;
              }
              .cover-table td {
                padding: 12px 8px;
              }
              .cover-table td:first-child {
                font-weight: 700;
                width: 35%;
              }
              .cover-footer {
                position: absolute;
                bottom: 20mm;
                left: 15mm;
                right: 15mm;
                font-size: 9pt;
                color: #6b7280;
              }
              h1 {
                font-size: 24pt;
                font-weight: 700;
                color: #1f2937;
                margin: 0 0 20px 0;
              }
              h2 {
                font-size: 14pt;
                font-weight: 700;
                color: white;
                background-color: #d97706;
                padding: 10px 14px;
                margin: 20px 0 16px 0;
                page-break-after: avoid;
              }
              h3 {
                font-size: 11pt;
                font-weight: 700;
                color: #1f2937;
                margin: 16px 0 10px 0;
                padding-bottom: 4px;
                border-bottom: 1px solid #d1d5db;
                page-break-after: avoid;
              }
              .table {
                width: 100%;
                border-collapse: collapse;
                font-size: 9pt;
                margin-top: 10px;
                page-break-inside: avoid;
              }
              .th {
                background-color: #f3f4f6;
                text-align: left;
                padding: 8px 8px;
                border: 1px solid #d1d5db;
                font-weight: 700;
                font-size: 9pt;
              }
              .td {
                padding: 8px 8px;
                border: 1px solid #e5e7eb;
                vertical-align: top;
                word-break: break-word;
                font-size: 9pt;
              }
              .detail-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 8px 16px;
                margin-bottom: 16px;
              }
              .detail-item {
                break-inside: avoid;
              }
              .detail-label {
                font-size: 8pt;
                font-weight: 700;
                color: #6b7280;
                text-transform: uppercase;
                margin: 0 0 3px 0;
              }
              .detail-value {
                font-size: 10pt;
                color: #111827;
                white-space: pre-wrap;
                word-break: break-word;
                margin: 0;
              }
              .photo-grid {
                display: grid;
                grid-template-columns: repeat(1, 1fr);
                gap: 20px;
                margin-top: 20px;
              }
              .photo-item {
                page-break-inside: avoid;
                margin-bottom: 15px;
              }
              .photo-item img {
                border: 1px solid #d1d5db;
                width: 100%;
                height: auto;
                max-height: 500px;
                object-fit: contain;
                display: block;
              }
              .photo-item p {
                font-size: 9pt;
                color: #4b5563;
                font-style: italic;
                text-align: left;
                margin: 6px 0 0 0;
                padding: 6px;
                background-color: #f9fafb;
              }
              .signature-section {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 30px;
                margin-top: 30px;
              }
              .signature-box {
                text-align: center;
                page-break-inside: avoid;
              }
              .signature-box-label {
                font-size: 9pt;
                font-weight: 700;
                color: #6b7280;
                text-transform: uppercase;
                margin-bottom: 8px;
              }
              .signature-box-name {
                font-size: 10pt;
                margin-bottom: 6px;
              }
              .signature-box img {
                border: 1px solid #d1d5db;
                background-color: #f9fafb;
                width: 250px;
                height: 100px;
                object-fit: contain;
                margin: 0 auto;
                display: block;
              }
              .avoid-break {
                break-inside: avoid;
                page-break-inside: avoid;
              }
              .text-content {
                padding: 10px;
                background-color: #f9fafb;
                border: 1px solid #e5e7eb;
                white-space: pre-wrap;
                word-break: break-word;
                font-size: 9pt;
                margin: 10px 0;
              }
              .page-footer {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                text-align: center;
                font-size: 8pt;
                color: #6b7280;
                padding: 8px 0;
                border-top: 1px solid #e5e7eb;
              }
            `),

            // COVER PAGE (Page 1)
            React.createElement('div', { className: "cover-page" },
                React.createElement('div', { style: { display: 'flex', alignItems: 'center', marginBottom: '10px' } },
                    React.createElement(SgaLogo, { style: { height: '50px', width: 'auto', marginRight: '20px' } }),
                    React.createElement('h1', { className: "cover-title" }, "Quality Assurance Pack")
                ),
                React.createElement('table', { className: "cover-table" },
                    React.createElement('tbody', null,
                        React.createElement('tr', null,
                            React.createElement('td', null, 'Job Number'),
                            React.createElement('td', null, job.jobNo)
                        ),
                        React.createElement('tr', null,
                            React.createElement('td', null, 'Client'),
                            React.createElement('td', null, job.client)
                        ),
                        React.createElement('tr', null,
                            React.createElement('td', null, 'Project'),
                            React.createElement('td', null, job.projectName)
                        ),
                        React.createElement('tr', null,
                            React.createElement('td', null, 'Location'),
                            React.createElement('td', null, job.location)
                        ),
                        React.createElement('tr', null,
                            React.createElement('td', null, 'Job Date'),
                            React.createElement('td', null, new Date(job.jobDate).toLocaleDateString('en-AU', { day: '2-digit', month: '2-digit', year: 'numeric' }))
                        ),
                        React.createElement('tr', null,
                            React.createElement('td', null, 'Foreman'),
                            React.createElement('td', null, sgaDailyReport?.completedBy || report.submittedBy || '---')
                        )
                    )
                ),
                React.createElement('div', { className: "cover-footer" },
                    React.createElement('p', null, `Submission Time: ${new Date(timestamp).toLocaleString('en-AU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}`),
                    React.createElement('p', null, `QA Spec: ${job.qaSpec || 'Standard'}`)
                )
            ),

            // JOB SHEET DETAILS PAGE (Page 2)
            jobSheet && Object.keys(jobSheet).length > 0 && (
                React.createElement('div', { className: "page" },
                    React.createElement(PageHeader, { report: report }),
                    React.createElement('h2', null, 'Job Sheet Details'),
                    React.createElement('div', { className: "detail-grid", style: { gridTemplateColumns: '1fr' } },
                        React.createElement(Detail, { label: "PROJECT NAME", value: jobSheet.projectName || '---' })
                    ),
                    React.createElement('div', { className: "detail-grid", style: { gridTemplateColumns: 'repeat(4, 1fr)' } },
                        React.createElement(Detail, { label: "SHIFT", value: jobSheet.dayShift ? 'Day Shift' : 'Night Shift' }),
                        job.division === 'Profiling' && React.createElement(Detail, { label: "DEPOT START TIME", value: jobSheet.depotStartTime }),
                        job.division === 'Profiling' && React.createElement(Detail, { label: "START CUT TIME", value: jobSheet.startCutTime }),
                        job.division === 'Asphalt' && React.createElement(Detail, { label: "START TIME (YARD)", value: jobSheet.startTimeInYard }),
                        job.division === 'Profiling' ?
                            React.createElement(Detail, { label: "CREW LEADER", value: jobSheet.crewLeader }) :
                            React.createElement(Detail, { label: "FOREMAN", value: jobSheet.asphaltForeman })
                    ),
                    React.createElement('div', { className: "detail-grid" },
                        React.createElement(Detail, { label: "CLIENT ENGINEER", value: jobSheet.clientSiteEngineerContact ? `${jobSheet.clientSiteEngineerContact.name || ''} ${jobSheet.clientSiteEngineerContact.phone || ''}`.trim() : '---' }),
                        React.createElement(Detail, { label: "CLIENT SUPERVISOR", value: jobSheet.clientSiteSupervisorContact ? `${jobSheet.clientSiteSupervisorContact.name || ''} ${jobSheet.clientSiteSupervisorContact.phone || ''}`.trim() : '---' })
                    )
                )
            ),

            // SGA DAILY REPORT PAGE (Page 3)
            sgaDailyReport && (
                React.createElement('div', { className: "page" },
                    React.createElement(PageHeader, { report: report }),
                    React.createElement('h2', null, 'SGA Daily Report'),
                    React.createElement('div', { className: "detail-grid", style: { gridTemplateColumns: 'repeat(4, 1fr)' } },
                        React.createElement(Detail, { label: "DATE", value: sgaDailyReport.date }),
                        React.createElement(Detail, { label: "COMPLETED BY", value: sgaDailyReport.completedBy }),
                        React.createElement(Detail, { label: "START TIME", value: sgaDailyReport.startTime }),
                        React.createElement(Detail, { label: "FINISH TIME", value: sgaDailyReport.finishTime })
                    ),

                    sgaDailyReport.works?.length > 0 && React.createElement('div', { className: "avoid-break" },
                        React.createElement('h3', null, 'Assigned Works'),
                        React.createElement('table', { className: "table" },
                            React.createElement('thead', null,
                                React.createElement('tr', null,
                                    job.division !== 'Profiling' && React.createElement('th', { className: "th" }, 'Mix Type'),
                                    job.division !== 'Profiling' && React.createElement('th', { className: "th" }, 'Spec'),
                                    React.createElement('th', { className: "th" }, 'Area m²'),
                                    React.createElement('th', { className: "th" }, 'Depth mm'),
                                    React.createElement('th', { className: "th" }, 'Tonnes'),
                                    React.createElement('th', { className: "th" }, 'Comments')
                                )
                            ),
                            React.createElement('tbody', null,
                                sgaDailyReport.works.map((r, i) => {
                                    return React.createElement('tr', { key: i },
                                        job.division !== 'Profiling' && React.createElement('td', { className: "td" }, r.mixType),
                                        job.division !== 'Profiling' && React.createElement('td', { className: "td" }, r.spec),
                                        React.createElement('td', { className: "td" }, r.area),
                                        React.createElement('td', { className: "td" }, r.depth),
                                        React.createElement('td', { className: "td" }, r.tonnes),
                                        React.createElement('td', { className: "td" }, r.comments)
                                    );
                                })
                            )
                        )
                    ),

                    sgaDailyReport.siteInstructions && React.createElement('div', { className: "avoid-break" },
                        React.createElement('h3', null, 'SITE INSTRUCTIONS'),
                        React.createElement('div', { className: "text-content" }, sgaDailyReport.siteInstructions)
                    ),

                    sgaDailyReport.teethUsage && React.createElement('div', { className: "avoid-break" },
                        React.createElement('h3', null, 'TEETH USAGE'),
                        React.createElement('div', { className: "text-content" }, sgaDailyReport.teethUsage)
                    ),

                    sgaDailyReport.plantEquipment?.length > 0 && React.createElement('div', { className: "avoid-break" },
                        React.createElement('h3', null, 'Plant / Equipment'),
                        React.createElement('table', { className: "table" },
                            React.createElement('thead', null,
                                React.createElement('tr', null,
                                    React.createElement('th', { className: "th" }, 'Type'),
                                    React.createElement('th', { className: "th" }, 'Plant ID'),
                                    React.createElement('th', { className: "th" }, 'Prestart'),
                                    React.createElement('th', { className: "th" }, 'Start Time'),
                                    React.createElement('th', { className: "th" }, 'End Time'),
                                    React.createElement('th', { className: "th" }, 'Total Hours'),
                                    React.createElement('th', { className: "th" }, 'Comments')
                                )
                            ),
                            React.createElement('tbody', null,
                                sgaDailyReport.plantEquipment.map((r, i) => {
                                    return React.createElement('tr', { key: i },
                                        React.createElement('td', { className: "td" }, r.type),
                                        React.createElement('td', { className: "td" }, r.plantId),
                                        React.createElement('td', { className: "td" }, r.prestart),
                                        React.createElement('td', { className: "td" }, r.startTime),
                                        React.createElement('td', { className: "td" }, r.endTime),
                                        React.createElement('td', { className: "td" }, r.hours),
                                        React.createElement('td', { className: "td" }, r.comments)
                                    );
                                })
                            )
                        )
                    ),

                    sgaDailyReport.labour?.length > 0 && React.createElement('div', { className: "avoid-break" },
                        React.createElement('h3', null, 'Crew'),
                        React.createElement('table', { className: "table" },
                            React.createElement('thead', null,
                                React.createElement('tr', null,
                                    React.createElement('th', { className: "th" }, 'Full Name'),
                                    React.createElement('th', { className: "th" }, 'Start Time'),
                                    React.createElement('th', { className: "th" }, 'End Time'),
                                    React.createElement('th', { className: "th" }, 'Total Hours'),
                                    React.createElement('th', { className: "th" }, 'Comments')
                                )
                            ),
                            React.createElement('tbody', null,
                                sgaDailyReport.labour.map((r, i) => {
                                    return React.createElement('tr', { key: i },
                                        React.createElement('td', { className: "td" }, r.fullName),
                                        React.createElement('td', { className: "td" }, r.startTime),
                                        React.createElement('td', { className: "td" }, r.endTime),
                                        React.createElement('td', { className: "td" }, r.hours),
                                        React.createElement('td', { className: "td" }, r.comments)
                                    );
                                })
                            )
                        )
                    ),

                    sgaDailyReport.otherComments && React.createElement('div', { className: "avoid-break" },
                        React.createElement('h3', null, 'OTHER COMMENTS (DELAYS, ETC)'),
                        React.createElement('div', { className: "text-content" }, sgaDailyReport.otherComments)
                    ),

                    (sgaDailyReport.clientSignName || sgaDailyReport.clientSignature) && React.createElement('div', { className: "avoid-break" },
                        React.createElement('h3', null, 'Client Approval'),
                        React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '15px' } },
                            React.createElement('div', null,
                                React.createElement('p', { className: "detail-label" }, 'CLIENT NAME'),
                                React.createElement('p', { className: "detail-value" }, sgaDailyReport.clientSignName)
                            ),
                            sgaDailyReport.clientSignature && React.createElement('div', null,
                                React.createElement('p', { className: "detail-label" }, 'CLIENT SIGNATURE'),
                                React.createElement('img', {
                                    src: sgaDailyReport.clientSignature,
                                    alt: "Client Signature",
                                    style: { width: '200px', height: '80px', backgroundColor: '#f3f4f6', border: '1px solid #d1d5db' }
                                })
                            )
                        )
                    )
                )
            ),

            // SITE RECORD PAGE (Page 4)
            siteRecord && (siteRecord.hazardLog?.length > 0 || siteRecord.siteVisitors?.length > 0) && React.createElement('div', { className: "page" },
                React.createElement(PageHeader, { report: report }),
                React.createElement('h2', null, 'Site Record'),
                siteRecord.hazardLog?.length > 0 && React.createElement('div', { className: "avoid-break" },
                    React.createElement('h3', null, 'Hazard Log'),
                    React.createElement('table', { className: "table" },
                        React.createElement('thead', null,
                            React.createElement('tr', null,
                                React.createElement('th', { className: "th" }, 'Hazard Description'),
                                React.createElement('th', { className: "th" }, 'Control Measures')
                            )
                        ),
                        React.createElement('tbody', null,
                            siteRecord.hazardLog.map((r, i) => {
                                return React.createElement('tr', { key: i },
                                    React.createElement('td', { className: "td" }, r.hazardDescription),
                                    React.createElement('td', { className: "td" }, r.controlMeasures)
                                );
                            })
                        )
                    )
                ),
                siteRecord.siteVisitors?.length > 0 && React.createElement('div', { className: "avoid-break" },
                    React.createElement('h3', null, 'Site Visitors'),
                    React.createElement('table', { className: "table" },
                        React.createElement('thead', null,
                            React.createElement('tr', null,
                                React.createElement('th', { className: "th" }, 'Name'),
                                React.createElement('th', { className: "th" }, 'Company'),
                                React.createElement('th', { className: "th" }, 'Time In'),
                                React.createElement('th', { className: "th" }, 'Time Out')
                            )
                        ),
                        React.createElement('tbody', null,
                            siteRecord.siteVisitors.map((r, i) => {
                                return React.createElement('tr', { key: i },
                                    React.createElement('td', { className: "td" }, r.name),
                                    React.createElement('td', { className: "td" }, r.company),
                                    React.createElement('td', { className: "td" }, r.timeIn),
                                    React.createElement('td', { className: "td" }, r.timeOut)
                                );
                            })
                        )
                    )
                )
            ),

            // ITP CHECKLIST PAGE (if exists)
            itpChecklist && itpChecklist.sections?.length > 0 && React.createElement('div', { className: "page" },
                React.createElement(PageHeader, { report: report }),
                React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
                    React.createElement('h2', { style: { margin: 0, flex: 1 } }, `Inspection and Test Plan (ITP) Checklist`),
                    React.createElement('div', { style: { fontSize: '9pt', color: '#6b7280' } }, itpChecklist.documentId || 'SGA-ITP-001')
                ),
                itpChecklist.sections.map((section: ItpChecklistSection, i: number) => {
                    return React.createElement('div', { key: i, className: "avoid-break", style: { marginBottom: '20px' } },
                        React.createElement('h3', null, section.title),
                        React.createElement('table', { className: "table" },
                            React.createElement('thead', null,
                                React.createElement('tr', null,
                                    React.createElement('th', { className: "th", style: { width: '40%' } }, 'Description'),
                                    React.createElement('th', { className: "th" }, 'Compliance'),
                                    React.createElement('th', { className: "th", style: { width: '40%' } }, 'Comments'),
                                    React.createElement('th', { className: "th" }, 'Witness')
                                )
                            ),
                            React.createElement('tbody', null,
                                section.items.map((item: ItpChecklistItem) => {
                                    return React.createElement('tr', { key: item.id },
                                        React.createElement('td', { className: "td" }, item.description),
                                        React.createElement('td', { className: "td" }, item.compliant),
                                        React.createElement('td', { className: "td" }, item.comments),
                                        React.createElement('td', { className: "td" }, item.isWitnessPoint ? item.witnessName : 'N/A')
                                    );
                                })
                            )
                        )
                    );
                })
            ),

            // ASPHALT PLACEMENT PAGE (Asphalt division only)
            asphaltPlacement && asphaltPlacement.placements?.length > 0 && React.createElement('div', { className: "page" },
                React.createElement(PageHeader, { report: report }),
                React.createElement('h2', null, 'Asphalt Placement Record'),
                React.createElement('div', { className: "detail-grid", style: { gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '15px' } },
                    React.createElement(Detail, { label: "DATE", value: asphaltPlacement.date }),
                    React.createElement(Detail, { label: "LOT NO", value: asphaltPlacement.lotNo }),
                    React.createElement(Detail, { label: "SHEET NO", value: asphaltPlacement.sheetNo })
                ),
                React.createElement('table', { className: "table", style: { fontSize: '7pt' } },
                    React.createElement('thead', null,
                        React.createElement('tr', null,
                            React.createElement('th', { className: "th" }, 'Docket#'),
                            React.createElement('th', { className: "th" }, 'Time'),
                            React.createElement('th', { className: "th" }, 'Tonnes'),
                            React.createElement('th', { className: "th" }, 'Start-End CH'),
                            React.createElement('th', { className: "th" }, 'L/W/D'),
                            React.createElement('th', { className: "th" }, 'Area m²'),
                            React.createElement('th', { className: "th" }, 'In/Place °C'),
                            React.createElement('th', { className: "th" }, 'Temps OK?')
                        )
                    ),
                    React.createElement('tbody', null,
                        asphaltPlacement.placements.map((r, i) => {
                            return React.createElement('tr', { key: i },
                                React.createElement('td', { className: "td" }, r.docketNumber),
                                React.createElement('td', { className: "td" }, r.time),
                                React.createElement('td', { className: "td" }, r.tonnes),
                                React.createElement('td', { className: "td" }, `${r.startChainage}-${r.endChainage}`),
                                React.createElement('td', { className: "td" }, `${r.length}m/${r.runWidth}m/${r.depth}mm`),
                                React.createElement('td', { className: "td" }, r.area),
                                React.createElement('td', { className: "td" }, `${r.incomingTemp}°/${r.placementTemp}°`),
                                React.createElement('td', { className: "td" }, r.tempsCompliant)
                            );
                        })
                    )
                )
            ),

            // STRAIGHT EDGE TESTING PAGE (Asphalt division only)
            straightEdge && straightEdge.tests?.length > 0 && React.createElement('div', { className: "page" },
                React.createElement(PageHeader, { report: report }),
                React.createElement('h2', null, 'Straight Edge Testing'),
                React.createElement('div', { className: "detail-grid", style: { gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '15px' } },
                    React.createElement(Detail, { label: "LOT NO", value: straightEdge.lotNo }),
                    React.createElement(Detail, { label: "MIX TYPE", value: straightEdge.mixType }),
                    React.createElement(Detail, { label: "TESTED BY", value: straightEdge.testedBy }),
                    React.createElement(Detail, { label: "STRAIGHT EDGE ID", value: straightEdge.straightEdgeId })
                ),
                React.createElement('h3', null, 'Test Results'),
                React.createElement('table', { className: "table" },
                    React.createElement('thead', null,
                        React.createElement('tr', null,
                            React.createElement('th', { className: "th" }, 'Run / Lane'),
                            React.createElement('th', { className: "th" }, 'Chainage'),
                            React.createElement('th', { className: "th" }, 'Transverse'),
                            React.createElement('th', { className: "th" }, 'Join'),
                            React.createElement('th', { className: "th" }, 'Longitudinal')
                        )
                    ),
                    React.createElement('tbody', null,
                        straightEdge.tests.map((r, i) => {
                            return React.createElement('tr', { key: i },
                                React.createElement('td', { className: "td" }, r.runLane),
                                React.createElement('td', { className: "td" }, r.chainage),
                                React.createElement('td', { className: "td" }, r.transverse),
                                React.createElement('td', { className: "td" }, r.join),
                                React.createElement('td', { className: "td" }, r.longitudinal)
                            );
                        })
                    )
                ),
                straightEdge.supervisor && React.createElement('div', { style: { marginTop: '20px' } },
                    React.createElement('p', { style: { fontSize: '9pt', fontWeight: 700 } }, 'Checked By (Supervisor):'),
                    React.createElement('p', { style: { fontSize: '10pt', marginTop: '5px' } }, straightEdge.supervisor)
                )
            ),

            // SPRAY REPORT PAGE (Spray division only)
            sprayReport && sprayReport.runs?.length > 0 && React.createElement('div', { className: "page" },
                React.createElement(PageHeader, { report: report }),
                React.createElement('h2', null, 'Spray Seal Report'),
                React.createElement('table', { className: "table" },
                    React.createElement('thead', null,
                        React.createElement('tr', null,
                            React.createElement('th', { className: "th" }, 'Run #'),
                            React.createElement('th', { className: "th" }, 'Chainage'),
                            React.createElement('th', { className: "th" }, 'Area m²'),
                            React.createElement('th', { className: "th" }, 'Volume (L)')
                        )
                    ),
                    React.createElement('tbody', null,
                        sprayReport.runs.map((r, i) => {
                            return React.createElement('tr', { key: i },
                                React.createElement('td', { className: "td" }, r.runNo),
                                React.createElement('td', { className: "td" }, `${r.startChainage}-${r.endChainage}`),
                                React.createElement('td', { className: "td" }, r.area),
                                React.createElement('td', { className: "td" }, r.volumeSprayedLitres)
                            );
                        })
                    )
                )
            ),

            // VERIFICATION & SIGNATURES PAGE
            React.createElement('div', { className: "page" },
                React.createElement(PageHeader, { report: report }),
                React.createElement('h2', null, 'Verification & Signatures'),
                React.createElement('div', { className: "signature-section" },
                    React.createElement('div', { className: "signature-box" },
                        React.createElement('p', { className: "signature-box-label" }, 'FOREMAN SIGNATURE'),
                        foremanSignature && React.createElement('img', {
                            src: foremanSignature,
                            alt: "Foreman Signature"
                        })
                    ),
                    React.createElement('div', { className: "signature-box" },
                        React.createElement('p', { className: "signature-box-label" }, 'CLIENT SIGNATURE'),
                        sgaDailyReport?.clientSignName && React.createElement('p', { className: "signature-box-name" }, sgaDailyReport.clientSignName),
                        sgaDailyReport?.clientSignature && React.createElement('img', {
                            src: sgaDailyReport.clientSignature,
                            alt: "Client Signature"
                        })
                    )
                )
            ),

            // JOB SHEET IMAGES PAGES (if any)
            report.jobSheetImageUrls && report.jobSheetImageUrls.length > 0 && chunk(report.jobSheetImageUrls, 2).map((pageImages, pageIndex) => (
                React.createElement('div', { key: `js-page-${pageIndex}`, className: "page" },
                    React.createElement(PageHeader, { report: report }),
                    React.createElement('h2', null, `Job Sheet Images (Page ${pageIndex + 1})`),
                    React.createElement('div', { className: "photo-grid" },
                        pageImages.map((url, i) => (
                            React.createElement('div', { key: i, className: "photo-item" },
                                React.createElement('img', { src: url, alt: `Job Sheet Image ${i + 1}` })
                            )
                        ))
                    )
                )
            )),

            // SITE PHOTOS PAGES
            report.sitePhotoUrls && report.sitePhotoUrls.length > 0 && chunk(report.sitePhotoUrls, 2).map((pagePhotos, pageIndex) => (
                React.createElement('div', { key: `site-page-${pageIndex}`, className: "page" },
                    React.createElement(PageHeader, { report: report }),
                    React.createElement('h2', null, `Site Photos (Page ${pageIndex + 1})`),
                    React.createElement('div', { className: "photo-grid" },
                        pagePhotos.map((url, i) => {
                            const originalPhotoIndex = pageIndex * 2 + i;
                            return React.createElement('div', { key: i, className: "photo-item" },
                                React.createElement('img', { src: url, alt: `Site Photo ${originalPhotoIndex + 1}` }),
                                report.sitePhotos?.[originalPhotoIndex]?.description && React.createElement('p', null, report.sitePhotos[originalPhotoIndex].description)
                            );
                        })
                    )
                )
            )),

            // DAMAGE PHOTOS PAGES (if any)
            report.damagePhotoUrls && report.damagePhotoUrls.length > 0 && chunk(report.damagePhotoUrls, 2).map((pagePhotos, pageIndex) => (
                 React.createElement('div', { key: `damage-page-${pageIndex}`, className: "page" },
                    React.createElement(PageHeader, { report: report }),
                    React.createElement('h2', null, `Damage Photos (Page ${pageIndex + 1})`),
                    React.createElement('div', { className: "photo-grid" },
                        pagePhotos.map((url, i) => {
                             const originalPhotoIndex = pageIndex * 2 + i;
                            return React.createElement('div', { key: i, className: "photo-item" },
                                React.createElement('img', { src: url, alt: `Damage Photo ${originalPhotoIndex + 1}` }),
                                report.damagePhotos?.[originalPhotoIndex]?.description && React.createElement('p', null, report.damagePhotos[originalPhotoIndex].description)
                            );
                        })
                    )
                )
            ))
        )
    );
};

export default ReportPrintView;
