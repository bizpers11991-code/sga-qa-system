// api/_lib/ReportPrintView.ts
import React, { forwardRef } from 'react';
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
        React.createElement(SgaLogo, { style: { height: '1.5cm', width: 'auto' } }),
        React.createElement('table', { className: "header-table" },
            React.createElement('tbody', null,
                React.createElement('tr', null,
                    React.createElement('td', { className: "header-label" }, 'Job Number:'),
                    React.createElement('td', { className: "header-value" }, report.job.jobNo)
                ),
                React.createElement('tr', null,
                    React.createElement('td', { className: "header-label" }, 'Client:'),
                    React.createElement('td', { className: "header-value" }, report.job.client)
                ),
                React.createElement('tr', null,
                    React.createElement('td', { className: "header-label" }, 'Project:'),
                    React.createElement('td', { className: "header-value" }, report.job.projectName)
                )
            )
        )
    )
);


const ReportPrintView = forwardRef<HTMLDivElement, ReportPrintViewProps>(({ report }, ref) => {
    const { job, jobSheet, sgaDailyReport, siteRecord, itpChecklist, asphaltPlacement, straightEdge, sprayReport, timestamp, foremanSignature } = report;
    
    return (
        React.createElement('div', { ref: ref, className: "report-container" },
            React.createElement('style', null, `
              body { -webkit-print-color-adjust: exact; }
              .report-container { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #111827; font-size: 9pt; }
              .page { page-break-before: always; break-before: page; }
              .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; border-bottom: 1px solid #d1d5db; padding-bottom: 10px; }
              .header-table { font-size: 9pt; text-align: right; }
              .header-label { font-weight: 700; padding-right: 8px; }
              .cover-page { height: 257mm; display: flex; flex-direction: column; }
              h1 { font-size: 24pt; font-weight: 700; color: #1f2937; }
              h2 { font-size: 16pt; font-weight: 700; color: white; background-color: #b45309; padding: 8px 12px; margin-bottom: 16px; margin-top: 20px; }
              h3 { font-size: 11pt; font-weight: 700; color: #1f2937; margin-top: 16px; margin-bottom: 8px; padding-bottom: 2px; border-bottom: 1px solid #d1d5db;}
              .table { width: 100%; border-collapse: collapse; font-size: 8pt; margin-top: 8px; }
              .th { background-color: #e5e7eb; text-align: left; padding: 6px 8px; border: 1px solid #d1d5db; font-weight: 700; }
              .td { padding: 6px 8px; border: 1px solid #e5e7eb; vertical-align: top; word-break: break-word; }
              .detail-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px 16px; margin-bottom: 16px; }
              .detail-item { break-inside: avoid; }
              .detail-label { font-size: 7pt; font-weight: 700; color: #6b7280; text-transform: uppercase; }
              .detail-value { font-size: 9pt; color: #111827; white-space: pre-wrap; word-break: break-word; }
              .photo-grid-2 { display: grid; grid-template-columns: repeat(1, 1fr); gap: 16px; }
              .photo-item img { border: 1px solid #d1d5db; width: 100%; height: auto; max-height: 105mm; object-fit: contain; margin-bottom: 8px; }
              .photo-item p { font-size: 8pt; color: #4b5563; text-align: left; margin-top: 4px; padding: 4px; background-color: #f9fafb; border-radius: 4px;}
              .signature-box { text-align: center; }
              .signature-box img { border: 1px solid #d1d5db; background-color: #f3f4f6; margin-top: 4px; }
              .avoid-break { break-inside: avoid; }
            `),
            
            React.createElement('div', { className: "cover-page" },
                 React.createElement('div', { style: { display: 'flex', alignItems: 'center', borderBottom: '2px solid #111827', paddingBottom: '16px' } },
                    React.createElement(SgaLogo, { style: { height: '1.8cm', width: 'auto' } }),
                    React.createElement('h1', { style: { marginLeft: '20px', fontSize: '28pt' } }, "Quality Assurance Pack")
                ),
                React.createElement('div', { style: { paddingTop: '40px', flexGrow: 1 } },
                    React.createElement('table', { className: "w-full", style: { fontSize: '12pt', border: 'none' } },
                        React.createElement('tbody', null,
                            React.createElement('tr', { className: "border-b" }, React.createElement('td', { className: "p-3 font-bold w-1/3" }, "Job Number"), React.createElement('td', { className: "p-3" }, job.jobNo)),
                            React.createElement('tr', { className: "border-b" }, React.createElement('td', { className: "p-3 font-bold" }, "Client"), React.createElement('td', { className: "p-3" }, job.client)),
                            React.createElement('tr', { className: "border-b" }, React.createElement('td', { className: "p-3 font-bold" }, "Project"), React.createElement('td', { className: "p-3" }, job.projectName)),
                            React.createElement('tr', { className: "border-b" }, React.createElement('td', { className: "p-3 font-bold" }, "Location"), React.createElement('td', { className: "p-3" }, job.location)),
                            React.createElement('tr', { className: "border-b" }, React.createElement('td', { className: "p-3 font-bold" }, "Job Date"), React.createElement('td', { className: "p-3" }, new Date(job.jobDate).toLocaleDateString('en-AU', { timeZone: 'Australia/Perth' }))),
                            React.createElement('tr', { className: "border-b" }, React.createElement('td', { className: "p-3 font-bold" }, "Foreman"), React.createElement('td', { className: "p-3" }, sgaDailyReport.completedBy))
                        )
                    )
                ),
                React.createElement('footer', { className: "text-xs text-gray-500" },
                    React.createElement('p', null, `Submission Time: ${new Date(timestamp).toLocaleString('en-AU', { timeZone: 'Australia/Perth' })}`),
                    React.createElement('p', null, `QA Spec: ${job.qaSpec || 'Standard'}`)
                )
            ),

            jobSheet && Object.keys(jobSheet).length > 0 && (
                React.createElement('div', { className: "page" },
                    React.createElement(PageHeader, { report: report }),
                    React.createElement('h2', null, 'Job Sheet Details'),
                    React.createElement('div', { className: "detail-grid" },
                        React.createElement(Detail, { label: "Project Name", value: jobSheet.projectName, colSpan: 4 }),
                        job.division === 'Asphalt' && React.createElement(Detail, { label: "Asphalt Plant", value: jobSheet.asphaltPlant }),
                        React.createElement(Detail, { label: "Shift", value: jobSheet.dayShift ? 'Day Shift' : 'Night Shift' }),
                        job.division === 'Asphalt' && React.createElement(Detail, { label: "Start Time (Yard)", value: jobSheet.startTimeInYard }),
                        job.division === 'Asphalt' && React.createElement(Detail, { label: "Est. Finish Time", value: jobSheet.estimatedFinishTime }),
                        job.division === 'Profiling' && React.createElement(Detail, { label: "Depot Start Time", value: jobSheet.depotStartTime }),
                        job.division === 'Profiling' && React.createElement(Detail, { label: "Start Cut Time", value: jobSheet.startCutTime }),
                        job.division === 'Asphalt' ? React.createElement(Detail, { label: "Asphalt Foreman", value: jobSheet.asphaltForeman }) : React.createElement(Detail, { label: "Crew Leader", value: jobSheet.crewLeader }),
                        React.createElement(Detail, { label: "Client Engineer", value: `${jobSheet.clientSiteEngineerContact?.name || ''} ${jobSheet.clientSiteEngineerContact?.phone || ''}` }),
                        React.createElement(Detail, { label: "Client Supervisor", value: `${jobSheet.clientSiteSupervisorContact?.name || ''} ${jobSheet.clientSiteSupervisorContact?.phone || ''}` })
                    ),
                    jobSheet.jobMaterials && jobSheet.jobMaterials.length > 0 && React.createElement(React.Fragment, null, React.createElement('h3', { className: "avoid-break" }, 'Job Materials'), React.createElement('table', { className: "table" }, React.createElement('thead', null, React.createElement('tr', null, React.createElement('th', { className: "th" }, 'Mix Code'), React.createElement('th', { className: "th" }, 'Tonnes'), React.createElement('th', { className: "th" }, 'Area m²'), React.createElement('th', { className: "th" }, 'Depth mm'), React.createElement('th', { className: "th" }, 'Lot #'))), React.createElement('tbody', null, jobSheet.jobMaterials.map((m, i) => {
                        return (React.createElement('tr', { key: i }, React.createElement('td', { className: "td" }, m.mixCode), React.createElement('td', { className: "td" }, m.tonnes), React.createElement('td', { className: "td" }, m.area), React.createElement('td', { className: "td" }, m.aveDepth), React.createElement('td', { className: "td" }, m.lotNumber)))
                    })))),
                    jobSheet.jobDetails && jobSheet.jobDetails.length > 0 && React.createElement(React.Fragment, null, React.createElement('h3', { className: "avoid-break" }, 'Job Instructions'), React.createElement('div', { className: "p-2 border bg-gray-50 text-xs break-words" }, jobSheet.jobDetails.map((line, i) => {
                        return (React.createElement('p', { key: i }, line));
                    })))
                )
            ),
            
            React.createElement('div', { className: "page" },
                React.createElement(PageHeader, { report: report }),
                React.createElement('h2', null, 'SGA Daily Report'),
                React.createElement('div', { className: "detail-grid" },
                    React.createElement(Detail, { label: "Date", value: sgaDailyReport.date }),
                    React.createElement(Detail, { label: "Completed By", value: sgaDailyReport.completedBy }),
                    React.createElement(Detail, { label: "Start Time", value: sgaDailyReport.startTime }),
                    React.createElement(Detail, { label: "Finish Time", value: sgaDailyReport.finishTime })
                ),

                sgaDailyReport.weatherConditions?.length > 0 && React.createElement(React.Fragment, null, React.createElement('h3', { className: "avoid-break" }, 'Weather Conditions'), React.createElement('table', { className: "table avoid-break" }, React.createElement('thead', null, React.createElement('tr', null, React.createElement('th', { className: "th" }, 'Time'), React.createElement('th', { className: "th" }, 'Air °C'), React.createElement('th', { className: "th" }, 'Road °C'), React.createElement('th', { className: "th" }, 'Wind'), React.createElement('th', { className: "th" }, 'Comments'))), React.createElement('tbody', null, sgaDailyReport.weatherConditions.map((r, i) => {
                    return (React.createElement('tr', { key: i }, React.createElement('td', { className: "td" }, r.time), React.createElement('td', { className: "td" }, r.airTemp), React.createElement('td', { className: "td" }, r.roadTemp), React.createElement('td', { className: "td" }, r.windSpeed), React.createElement('td', { className: "td" }, r.chillFactor)));
                })))),
                
                sgaDailyReport.works?.length > 0 && React.createElement(React.Fragment, null, React.createElement('h3', { className: "avoid-break" }, 'Assigned Works'), React.createElement('table', { className: "table avoid-break" }, React.createElement('thead', null, React.createElement('tr', null, job.division !== 'Profiling' ? React.createElement(React.Fragment, null, React.createElement('th', { className: "th" }, 'Mix Type'), React.createElement('th', { className: "th" }, 'Spec')) : null, React.createElement('th', { className: "th" }, 'Area m²'), React.createElement('th', { className: "th" }, 'Depth mm'), React.createElement('th', { className: "th" }, 'Tonnes'), React.createElement('th', { className: "th" }, 'Comments'))), React.createElement('tbody', null, sgaDailyReport.works.map((r,i) => {
                    return (React.createElement('tr', { key: i }, job.division !== 'Profiling' ? React.createElement(React.Fragment, null, React.createElement('td', { className: "td" }, r.mixType), React.createElement('td', { className: "td" }, r.spec)) : null, React.createElement('td', { className: "td" }, r.area), React.createElement('td', { className: "td" }, r.depth), React.createElement('td', { className: "td" }, r.tonnes), React.createElement('td', { className: "td" }, r.comments)));
                })))),

                sgaDailyReport.actualWorks && sgaDailyReport.actualWorks.length > 0 && React.createElement(React.Fragment, null, React.createElement('h3', { className: "avoid-break" }, 'Actual Work Performed'), React.createElement('table', { className: "table avoid-break" }, React.createElement('thead', null, React.createElement('tr', null, React.createElement('th', { className: "th" }, 'Description'), React.createElement('th', { className: "th" }, 'Area m²'), React.createElement('th', { className: "th" }, 'Depth mm'), React.createElement('th', { className: "th" }, 'Tonnes'), React.createElement('th', { className: "th" }, 'Comments'))), React.createElement('tbody', null, sgaDailyReport.actualWorks.map((r,i) => {
                    return (React.createElement('tr', { key: i }, React.createElement('td', { className: "td" }, r.description), React.createElement('td', { className: "td" }, r.area), React.createElement('td', { className: "td" }, r.depth), React.createElement('td', { className: "td" }, r.tonnes), React.createElement('td', { className: "td" }, r.comments)));
                })))),
                
                sgaDailyReport.siteInstructions && React.createElement('div', { className: "avoid-break" }, React.createElement(Detail, { label: "Site Instructions", value: sgaDailyReport.siteInstructions, colSpan: 4 })),
                sgaDailyReport.additionalComments && React.createElement('div', { className: "avoid-break" }, React.createElement(Detail, { label: "Additional Comments", value: sgaDailyReport.additionalComments, colSpan: 4 })),
                sgaDailyReport.teethUsage && React.createElement('div', { className: "avoid-break" }, React.createElement(Detail, { label: "Teeth Usage", value: sgaDailyReport.teethUsage, colSpan: 4 })),
                
                sgaDailyReport.plantEquipment?.length > 0 && React.createElement(React.Fragment, null, React.createElement('h3', { className: "avoid-break" }, 'Plant / Equipment'), React.createElement('table', { className: "table avoid-break" }, React.createElement('thead', null, React.createElement('tr', null, React.createElement('th', { className: "th" }, 'Type'), React.createElement('th', { className: "th" }, 'Plant ID'), React.createElement('th', { className: "th" }, 'Prestart'), React.createElement('th', { className: "th" }, 'Start Time'), React.createElement('th', { className: "th" }, 'End Time'), React.createElement('th', { className: "th" }, 'Total Hours'), React.createElement('th', { className: "th" }, 'Comments'))), React.createElement('tbody', null, sgaDailyReport.plantEquipment.map((r,i) => {
                    return (React.createElement('tr', { key: i }, React.createElement('td', { className: "td" }, r.type), React.createElement('td', { className: "td" }, r.plantId), React.createElement('td', { className: "td" }, r.prestart), React.createElement('td', { className: "td" }, r.startTime), React.createElement('td', { className: "td" }, r.endTime), React.createElement('td', { className: "td" }, r.hours), React.createElement('td', { className: "td" }, r.comments)));
                })))),

                sgaDailyReport.trucks?.length > 0 && React.createElement(React.Fragment, null, React.createElement('h3', { className: "avoid-break" }, 'Trucks'), React.createElement('table', { className: "table avoid-break" }, React.createElement('thead', null, React.createElement('tr', null, React.createElement('th', { className: "th" }, 'Truck ID'), React.createElement('th', { className: "th" }, 'Contractor'), React.createElement('th', { className: "th" }, 'Start Time'), React.createElement('th', { className: "th" }, 'End Time'), React.createElement('th', { className: "th" }, 'Total Hours'), React.createElement('th', { className: "th" }, '6 Wheeler?'))), React.createElement('tbody', null, sgaDailyReport.trucks.map((r,i) => {
                    return (React.createElement('tr', { key: i }, React.createElement('td', { className: "td" }, r.truckId), React.createElement('td', { className: "td" }, r.contractor), React.createElement('td', { className: "td" }, r.startTime), React.createElement('td', { className: "td" }, r.endTime), React.createElement('td', { className: "td" }, r.hours), React.createElement('td', { className: "td" }, r.isSixWheeler ? 'Yes' : 'No')));
                })))),
                
                sgaDailyReport.labour?.length > 0 && React.createElement(React.Fragment, null, React.createElement('h3', { className: "avoid-break" }, 'Crew'), React.createElement('table', { className: "table avoid-break" }, React.createElement('thead', null, React.createElement('tr', null, React.createElement('th', { className: "th" }, 'Full Name'), React.createElement('th', { className: "th" }, 'Start Time'), React.createElement('th', { className: "th" }, 'End Time'), React.createElement('th', { className: "th" }, 'Total Hours'), React.createElement('th', { className: "th" }, 'Comments'))), React.createElement('tbody', null, sgaDailyReport.labour.map((r,i) => {
                    return (React.createElement('tr', { key: i }, React.createElement('td', { className: "td" }, r.fullName), React.createElement('td', { className: "td" }, r.startTime), React.createElement('td', { className: "td" }, r.endTime), React.createElement('td', { className: "td" }, r.hours), React.createElement('td', { className: "td" }, r.comments)));
                })))),
                
                sgaDailyReport.onSiteTests?.length > 0 && React.createElement(React.Fragment, null, React.createElement('h3', { className: "avoid-break" }, 'On-Site Testing'), React.createElement('table', { className: "table avoid-break" }, React.createElement('thead', null, React.createElement('tr', null, React.createElement('th', { className: "th" }, 'Test Type'), React.createElement('th', { className: "th" }, 'Location'), React.createElement('th', { className: "th" }, 'Result'), React.createElement('th', { className: "th" }, 'Pass/Fail'), React.createElement('th', { className: "th" }, 'Comments'))), React.createElement('tbody', null, sgaDailyReport.onSiteTests.map((r,i) => {
                    return (React.createElement('tr', { key: i }, React.createElement('td', { className: "td" }, r.testType), React.createElement('td', { className: "td" }, r.location), React.createElement('td', { className: "td" }, r.result), React.createElement('td', { className: "td" }, r.passFail), React.createElement('td', { className: "td" }, r.comments)));
                })))),

                sgaDailyReport.otherComments && React.createElement('div', { className: "avoid-break" }, React.createElement(Detail, { label: "Other Comments (Delays, etc)", value: sgaDailyReport.otherComments, colSpan: 4 })),
                
                (sgaDailyReport.clientSignName || sgaDailyReport.clientSignature) && React.createElement('div', { className: "avoid-break" }, React.createElement('h3', null, 'Client Approval'), React.createElement('div', { style: {display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'flex-start'} }, React.createElement(Detail, { label: "Client Name", value: sgaDailyReport.clientSignName }), sgaDailyReport.clientSignature && React.createElement('div', null, React.createElement('p', { className: "detail-label" }, 'Client Signature'), React.createElement('img', { src: sgaDailyReport.clientSignature, alt: "Client Signature", style: {width: '200px', height: '100px', backgroundColor: '#f3f4f6', border: '1px solid #d1d5db'} }))))
            ),

            siteRecord && (siteRecord.hazardLog?.length > 0 || siteRecord.siteVisitors?.length > 0) && React.createElement('div', { className: "page" }, React.createElement(PageHeader, { report: report }), React.createElement('h2', null, 'Site Record'), siteRecord.hazardLog?.length > 0 && React.createElement(React.Fragment, null, React.createElement('h3', null, 'Hazard Log'), React.createElement('table', { className: "table" }, React.createElement('thead', null, React.createElement('tr', null, React.createElement('th', { className: "th" }, 'Hazard Description'), React.createElement('th', { className: "th" }, 'Control Measures'))), React.createElement('tbody', null, siteRecord.hazardLog.map((r,i) => {
                return (React.createElement('tr', { key: i }, React.createElement('td', { className: "td" }, r.hazardDescription), React.createElement('td', { className: "td" }, r.controlMeasures)));
            })))), siteRecord.siteVisitors?.length > 0 && React.createElement(React.Fragment, null, React.createElement('h3', null, 'Site Visitors'), React.createElement('table', { className: "table" }, React.createElement('thead', null, React.createElement('tr', null, React.createElement('th', { className: "th" }, 'Name'), React.createElement('th', { className: "th" }, 'Company'), React.createElement('th', { className: "th" }, 'Time In'), React.createElement('th', { className: "th" }, 'Time Out'))), React.createElement('tbody', null, siteRecord.siteVisitors.map((r,i) => {
                return (React.createElement('tr', { key: i }, React.createElement('td', { className: "td" }, r.name), React.createElement('td', { className: "td" }, r.company), React.createElement('td', { className: "td" }, r.timeIn), React.createElement('td', { className: "td" }, r.timeOut)));
            }))))),
            itpChecklist && itpChecklist.sections?.length > 0 && React.createElement('div', { className: "page" }, React.createElement(PageHeader, { report: report }), React.createElement('h2', null, `ITP Checklist: ${itpChecklist.name || itpChecklist.documentId}`), itpChecklist.sections.map((section: ItpChecklistSection, i: number) => {
                return (React.createElement('div', { key: i, className: "avoid-break mb-4" }, React.createElement('h3', null, section.title), React.createElement('table', { className: "table" }, React.createElement('thead', null, React.createElement('tr', null, React.createElement('th', { className: "th w-2/5" }, 'Description'), React.createElement('th', { className: "th" }, 'Compliance'), React.createElement('th', { className: "th w-2/5" }, 'Comments'), React.createElement('th', { className: "th" }, 'Witness'))), React.createElement('tbody', null, section.items.map((item: ItpChecklistItem) => {
                    return (React.createElement('tr', { key: item.id }, React.createElement('td', { className: "td" }, item.description), React.createElement('td', { className: "td" }, item.compliant), React.createElement('td', { className: "td" }, item.comments), React.createElement('td', { className: "td" }, item.isWitnessPoint ? item.witnessName : 'N/A')));
                })))))
            })),
            asphaltPlacement && asphaltPlacement.placements?.length > 0 && React.createElement('div', { className: "page" }, React.createElement(PageHeader, { report: report }), React.createElement('h2', null, 'Asphalt Placement'), React.createElement('table', { className: "table", style:{fontSize: '7pt'} }, React.createElement('thead', null, React.createElement('tr', null, React.createElement('th', { className: "th" }, 'Docket#'), React.createElement('th', { className: "th" }, 'Time'), React.createElement('th', { className: "th" }, 'Tonnes'), React.createElement('th', { className: "th" }, 'Start-End CH'), React.createElement('th', { className: "th" }, 'L/W/D'), React.createElement('th', { className: "th" }, 'Area m²'), React.createElement('th', { className: "th" }, 'In/Place °C'), React.createElement('th', { className: "th" }, 'Temps OK?'))), React.createElement('tbody', null, asphaltPlacement.placements.map((r, i) => {
                return (React.createElement('tr', { key: i }, React.createElement('td', { className: "td" }, r.docketNumber), React.createElement('td', { className: "td" }, r.time), React.createElement('td', { className: "td" }, r.tonnes), React.createElement('td', { className: "td" }, `${r.startChainage}-${r.endChainage}`), React.createElement('td', { className: "td" }, `${r.length}m / ${r.runWidth}m / ${r.depth}mm`), React.createElement('td', { className: "td" }, r.area), React.createElement('td', { className: "td" }, `${r.incomingTemp}°/${r.placementTemp}°`), React.createElement('td', { className: "td" }, r.tempsCompliant)));
            })))),
            straightEdge && straightEdge.tests?.length > 0 && React.createElement('div', { className: "page" }, React.createElement(PageHeader, { report: report }), React.createElement('h2', null, 'Straight Edge Testing'), React.createElement('table', { className: "table" }, React.createElement('thead', null, React.createElement('tr', null, React.createElement('th', { className: "th" }, 'Run/Lane'), React.createElement('th', { className: "th" }, 'Chainage'), React.createElement('th', { className: "th" }, 'Transverse'), React.createElement('th', { className: "th" }, 'Join'), React.createElement('th', { className: "th" }, 'Longitudinal'))), React.createElement('tbody', null, straightEdge.tests.map((r,i) => {
                return (React.createElement('tr', { key: i }, React.createElement('td', { className: "td" }, r.runLane), React.createElement('td', { className: "td" }, r.chainage), React.createElement('td', { className: "td" }, r.transverse), React.createElement('td', { className: "td" }, r.join), React.createElement('td', { className: "td" }, r.longitudinal)));
            })))),
            sprayReport && sprayReport.runs?.length > 0 && React.createElement('div', { className: "page" }, React.createElement(PageHeader, { report: report }), React.createElement('h2', null, 'Spray Seal Report'), React.createElement('table', { className: "table" }, React.createElement('thead', null, React.createElement('tr', null, React.createElement('th', { className: "th" }, 'Run #'), React.createElement('th', { className: "th" }, 'Chainage'), React.createElement('th', { className: "th" }, 'Area m²'), React.createElement('th', { className: "th" }, 'Volume (L)'))), React.createElement('tbody', null, sprayReport.runs.map((r,i) => {
                return (React.createElement('tr', { key: i }, React.createElement('td', { className: "td" }, r.runNo), React.createElement('td', { className: "td" }, `${r.startChainage}-${r.endChainage}`), React.createElement('td', { className: "td" }, r.area), React.createElement('td', { className: "td" }, r.volumeSprayedLitres)));
            })))),

            React.createElement('div', { className: "page" },
                React.createElement(PageHeader, { report: report }),
                React.createElement('h2', null, 'Verification & Signatures'),
                React.createElement('div', { style: {display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'flex-start', marginTop: '20px'} },
                    React.createElement('div', { className: "signature-box" }, React.createElement('p', { className: "detail-label" }, 'Foreman Signature'), foremanSignature && React.createElement('img', { src: foremanSignature, alt: "Signature", style: {width: '200px', height: '100px', margin: 'auto', backgroundColor: '#f3f4f6'} })),
                    React.createElement('div', { className: "signature-box" }, React.createElement('p', { className: "detail-label" }, 'Client Signature'), React.createElement('p', { className: "detail-value", style:{marginBottom: '4px'} }, sgaDailyReport.clientSignName), sgaDailyReport.clientSignature && React.createElement('img', { src: sgaDailyReport.clientSignature, alt: "Client Signature", style: {width: '200px', height: '100px', margin: 'auto', backgroundColor: '#f3f4f6'} }))
                )
            ),

            report.jobSheetImageUrls && report.jobSheetImageUrls.length > 0 && chunk(report.jobSheetImageUrls, 2).map((pageImages, pageIndex) => (
                React.createElement('div', { key: `js-page-${pageIndex}`, className: "page" },
                    React.createElement(PageHeader, { report: report }),
                    React.createElement('h2', null, `Job Sheet Images (Page ${pageIndex + 1})`),
                    React.createElement('div', { className: "photo-grid-2" }, pageImages.map((url, i) => (
                        React.createElement('div', { key: i, className: "photo-item" }, React.createElement('img', { src: url, alt: `Job Sheet Image` })))
                    ))
                )
            )),
            report.sitePhotoUrls && report.sitePhotoUrls.length > 0 && chunk(report.sitePhotoUrls, 2).map((pagePhotos, pageIndex) => (
                React.createElement('div', { key: `site-page-${pageIndex}`, className: "page" },
                    React.createElement(PageHeader, { report: report }),
                    React.createElement('h2', null, `Site Photos (Page ${pageIndex + 1})`),
                    React.createElement('div', { className: "photo-grid-2" }, pagePhotos.map((url, i) => {
                        const originalPhotoIndex = pageIndex * 2 + i;
                        return (React.createElement('div', { key: i, className: "photo-item" },
                            React.createElement('img', { src: url, alt: `Site Photo` }),
                            report.sitePhotos?.[originalPhotoIndex]?.description && React.createElement('p', null, report.sitePhotos[originalPhotoIndex].description)
                        ));
                    }))
                )
            )),
            report.damagePhotoUrls && report.damagePhotoUrls.length > 0 && chunk(report.damagePhotoUrls, 2).map((pagePhotos, pageIndex) => (
                 React.createElement('div', { key: `damage-page-${pageIndex}`, className: "page" },
                    React.createElement(PageHeader, { report: report }),
                    React.createElement('h2', null, `Damage Photos (Page ${pageIndex + 1})`),
                    React.createElement('div', { className: "photo-grid-2" }, pagePhotos.map((url, i) => {
                         const originalPhotoIndex = pageIndex * 2 + i;
                        return (React.createElement('div', { key: i, className: "photo-item" },
                            React.createElement('img', { src: url, alt: `Damage Photo` }),
                            report.damagePhotos?.[originalPhotoIndex]?.description && React.createElement('p', null, report.damagePhotos[originalPhotoIndex].description)
                        ));
                    }))
                )
            ))
        )
    );
});

export default ReportPrintView;