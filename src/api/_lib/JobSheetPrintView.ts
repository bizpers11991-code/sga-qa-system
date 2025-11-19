// api/_lib/JobSheetPrintView.ts
import React from 'react';
import { Job, DailyJobSheetData } from '../../types';
import SgaLogo from './SgaLogo.js';

// Helper to check for meaningful data
const hasValue = (value: any): boolean => {
    if (value === null || typeof value === 'undefined') return false;
    if (typeof value === 'string' && value.trim() === '') return false;
    if (typeof value === 'boolean') return true;
    if (Array.isArray(value) && value.length === 0) return false;
    if (typeof value === 'object' && !Array.isArray(value)) {
        if (Object.keys(value).length === 0) return false;
        return Object.values(value).some(v => hasValue(v));
    }
    return true;
};

const Detail: React.FC<{ label: string; value?: React.ReactNode; colSpan?: number }> = ({ label, value, colSpan = 1 }) => (
    React.createElement('div', { className: "detail-item", style: { gridColumn: `span ${colSpan}` } },
        React.createElement('p', { className: "detail-label" }, label),
        React.createElement('p', { className: "detail-value" }, value || '---')
    )
);

const PageHeader: React.FC<{ job: Job }> = ({ job }) => (
    React.createElement('header', { className: "page-header" },
        React.createElement(SgaLogo, { style: { height: '1.5cm', width: 'auto' } }),
        React.createElement('table', { className: "header-table" },
            React.createElement('tbody', null,
                React.createElement('tr', null,
                    React.createElement('td', { className: "header-label" }, 'Job Number:'),
                    React.createElement('td', { className: "header-value" }, job.jobNo || '(Not Set)')
                ),
                React.createElement('tr', null,
                    React.createElement('td', { className: "header-label" }, 'Client:'),
                    React.createElement('td', { className: "header-value" }, job.client)
                ),
                React.createElement('tr', null,
                    React.createElement('td', { className: "header-label" }, 'Project:'),
                    React.createElement('td', { className: "header-value" }, job.projectName)
                )
            )
        )
    )
);

const ProfilingJobSheet: React.FC<{ jobSheet: DailyJobSheetData }> = ({ jobSheet }) => (
    React.createElement(React.Fragment, null,
        React.createElement('h2', null, 'Profiling Job Sheet'),
        React.createElement('div', { className: "detail-grid" },
            hasValue(jobSheet.date) && React.createElement(Detail, { label: "Date Required", value: jobSheet.date }),
            hasValue(jobSheet.crewLeader) && React.createElement(Detail, { label: "Crew Leader", value: jobSheet.crewLeader }),
            hasValue(jobSheet.crew) && React.createElement(Detail, { label: "Crew", value: jobSheet.crew, colSpan: 2 })
        ),
        (hasValue(jobSheet.workArea) || hasValue(jobSheet.depth) || hasValue(jobSheet.tons) || hasValue(jobSheet.trucksDescription) || hasValue(jobSheet.descriptionOfWorks)) && (
            React.createElement(React.Fragment, null,
                React.createElement('h3', null, 'Description of Works'),
                React.createElement('div', { className: "detail-grid" },
                    hasValue(jobSheet.workArea) && React.createElement(Detail, { label: "Area", value: jobSheet.workArea }),
                    hasValue(jobSheet.depth) && React.createElement(Detail, { label: "Depth", value: jobSheet.depth }),
                    hasValue(jobSheet.tons) && React.createElement(Detail, { label: "Tons", value: jobSheet.tons }),
                    hasValue(jobSheet.trucksDescription) && React.createElement(Detail, { label: "Trucks", value: jobSheet.trucksDescription }),
                    hasValue(jobSheet.descriptionOfWorks) && React.createElement(Detail, { label: "Description", value: jobSheet.descriptionOfWorks, colSpan: 4 }),
                    hasValue(jobSheet.rapDumpsite) && React.createElement(Detail, { label: "Rap Dumpsite", value: jobSheet.rapDumpsite, colSpan: 2 })
                )
            )
        ),
        hasValue(jobSheet.profilers) && (
            React.createElement(React.Fragment, null,
                React.createElement('h3', { className: "avoid-break" }, 'Profilers & Equipment Required'),
                React.createElement('table', { className: "table" },
                    React.createElement('thead', null, React.createElement('tr', null, React.createElement('th', { className: "th" }, 'Machine'), React.createElement('th', { className: "th" }, 'Start Time'), React.createElement('th', { className: "th" }, 'Supplier'), React.createElement('th', { className: "th" }, 'Notes'))),
                    React.createElement('tbody', null, (jobSheet.profilers || []).map((r, i) => React.createElement('tr', { key: `prof-${i}` }, React.createElement('td', { className: "td" }, r.machine), React.createElement('td', { className: "td" }, r.startTime), React.createElement('td', { className: "td" }, r.supplier), React.createElement('td', { className: "td" }, r.notes))))
                )
            )
        ),
        hasValue(jobSheet.trucks) && (
            React.createElement(React.Fragment, null,
                React.createElement('h3', { className: "avoid-break" }, 'Trucks Required'),
                React.createElement('table', { className: "table" },
                    React.createElement('thead', null, React.createElement('tr', null, React.createElement('th', { className: "th" }, 'Machine'), React.createElement('th', { className: "th" }, 'Start Time'), React.createElement('th', { className: "th" }, 'Supplier'), React.createElement('th', { className: "th" }, 'Notes'))),
                    React.createElement('tbody', null, (jobSheet.trucks || []).map((r, i) => React.createElement('tr', { key: `truck-${i}` }, React.createElement('td', { className: "td" }, r.machine), React.createElement('td', { className: "td" }, r.startTime), React.createElement('td', { className: "td" }, r.supplier), React.createElement('td', { className: "td" }, r.notes))))
                )
            )
        )
    )
);

const AsphaltJobSheet: React.FC<{ jobSheet: DailyJobSheetData }> = ({ jobSheet }) => (
     React.createElement(React.Fragment, null,
        React.createElement('h2', null, 'Asphalt Job Sheet'),
        React.createElement('div', { className: "detail-grid" },
            hasValue(jobSheet.asphaltPlant) && React.createElement(Detail, { label: "Asphalt Plant", value: jobSheet.asphaltPlant }),
            React.createElement(Detail, { label: "Shift", value: jobSheet.dayShift ? 'Day Shift' : 'Night Shift' }),
            hasValue(jobSheet.startTimeInYard) && React.createElement(Detail, { label: "Start Time (Yard)", value: jobSheet.startTimeInYard }),
            hasValue(jobSheet.estimatedFinishTime) && React.createElement(Detail, { label: "Est. Finish Time", value: jobSheet.estimatedFinishTime }),
            hasValue(jobSheet.asphaltForeman) && React.createElement(Detail, { label: "Asphalt Foreman", value: jobSheet.asphaltForeman, colSpan: 2 })
        ),
        hasValue(jobSheet.jobMaterials) && (
            React.createElement(React.Fragment, null,
                React.createElement('h3', { className: "avoid-break" }, 'Job Materials'),
                React.createElement('table', { className: "table" },
                    React.createElement('thead', null, React.createElement('tr', null, React.createElement('th', { className: "th" }, 'Mix Code'), React.createElement('th', { className: "th" }, 'Tonnes'), React.createElement('th', { className: "th" }, 'Area m²'), React.createElement('th', { className: "th" }, 'Depth mm'), React.createElement('th', { className: "th" }, 'Lot #'))),
                    React.createElement('tbody', null, (jobSheet.jobMaterials || []).map((m, i) => React.createElement('tr', { key: i }, React.createElement('td', { className: "td" }, m.mixCode), React.createElement('td', { className: "td" }, m.tonnes), React.createElement('td', { className: "td" }, m.area), React.createElement('td', { className: "td" }, m.aveDepth), React.createElement('td', { className: "td" }, m.lotNumber))))
                )
            )
        ),
        hasValue(jobSheet.jobDetails) && (
            React.createElement(React.Fragment, null,
                React.createElement('h3', { className: "avoid-break" }, 'Job Instructions'),
                React.createElement('div', { className: "p-2 border bg-gray-50 text-xs break-words" },
                    (jobSheet.jobDetails || []).map((line, i) => React.createElement('p', { key: i }, line))
                )
            )
        )
    )
);

const SprayJobSheet: React.FC<{ jobSheet: DailyJobSheetData }> = ({ jobSheet }) => (
    React.createElement(React.Fragment, null,
        React.createElement('h2', null, 'Spray Job Sheet'),
        React.createElement('div', { className: "detail-grid" },
            hasValue(jobSheet.asphaltPlant) && React.createElement(Detail, { label: "Product Source", value: jobSheet.asphaltPlant }),
            React.createElement(Detail, { label: "Shift", value: jobSheet.dayShift ? 'Day Shift' : 'Night Shift' }),
            hasValue(jobSheet.startTimeInYard) && React.createElement(Detail, { label: "Start Time (Yard)", value: jobSheet.startTimeInYard }),
            hasValue(jobSheet.asphaltForeman) && React.createElement(Detail, { label: "Crew Leader", value: jobSheet.asphaltForeman })
        ),
        hasValue(jobSheet.jobMaterials) && (
             React.createElement('div', { className: "detail-grid" },
                React.createElement(Detail, { label: "Product / Material", value: (jobSheet.jobMaterials || [])[0]?.mixCode }),
                React.createElement(Detail, { label: "Target Litres / Quantity", value: (jobSheet.jobMaterials || [])[0]?.tonnes })
            )
        ),
        hasValue(jobSheet.jobDetails) && (
            React.createElement(React.Fragment, null,
                React.createElement('h3', { className: "avoid-break" }, 'Job Instructions'),
                React.createElement('div', { className: "p-2 border bg-gray-50 text-xs break-words" },
                    (jobSheet.jobDetails || []).map((line, i) => React.createElement('p', { key: i }, line))
                )
            )
        )
    )
);

const JobSheetPrintView: React.FC<{ job: Job }> = ({ job }) => {
    const { jobSheetData } = job;
    if (!jobSheetData) return React.createElement('div', null, 'No Job Sheet Data Available');

    const renderDivisionSheet = () => {
        switch (job.division) {
            case 'Profiling': return React.createElement(ProfilingJobSheet, { jobSheet: jobSheetData });
            case 'Asphalt': return React.createElement(AsphaltJobSheet, { jobSheet: jobSheetData });
            case 'Spray': return React.createElement(SprayJobSheet, { jobSheet: jobSheetData });
            default: return React.createElement('h2', null, 'Job Sheet Details');
        }
    };

    return (
        React.createElement('div', { className: "report-container" },
            React.createElement('style', null, `
              body { -webkit-print-color-adjust: exact; }
              .report-container { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #111827; font-size: 9pt; }
              .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; border-bottom: 1px solid #d1d5db; padding-bottom: 10px; }
              .header-table { font-size: 9pt; text-align: right; }
              .header-label { font-weight: 700; padding-right: 8px; }
              .header-value { font-weight: 400; }
              h2 { font-size: 16pt; font-weight: 700; color: white; background-color: #b45309; padding: 8px 12px; margin-bottom: 16px; margin-top: 20px; }
              h3 { font-size: 11pt; font-weight: 700; color: #1f2937; margin-top: 16px; margin-bottom: 8px; padding-bottom: 2px; border-bottom: 1px solid #d1d5db;}
              .table { width: 100%; border-collapse: collapse; font-size: 8pt; margin-top: 8px; }
              .th { background-color: #e5e7eb; text-align: left; padding: 6px 8px; border: 1px solid #d1d5db; font-weight: 700; }
              .td { padding: 6px 8px; border: 1px solid #e5e7eb; vertical-align: top; word-break: break-word; }
              .detail-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px 16px; margin-bottom: 16px; }
              .detail-item { break-inside: avoid; }
              .detail-label { font-size: 7pt; font-weight: 700; color: #6b7280; text-transform: uppercase; }
              .detail-value { font-size: 9pt; color: #111827; white-space: pre-wrap; word-break: break-word; }
              .avoid-break { break-inside: avoid; }
            `),
            
            React.createElement(PageHeader, { job: job }),

            renderDivisionSheet()
            // NOTE: Image rendering is intentionally omitted from this specific export
            // to prevent issues with large base64 strings causing PDF corruption.
            // Images will be included in the final QA Pack PDF.
        )
    );
};

export default JobSheetPrintView;