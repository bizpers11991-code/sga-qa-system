// api/_lib/teams.ts
/**
 * Microsoft Teams Notifications via Power Automate
 *
 * Sends formatted HTML messages to Teams channels via Power Automate HTTP triggers.
 * Power Automate flows use "Post message in a chat or channel" action.
 */
import { FinalQaPack, Job, IncidentReport } from '../../src/types.js';

// Environment variables for Power Automate webhook URLs
const WEBHOOK_URL_SUMMARY = process.env.TEAMS_WEBHOOK_URL_SUMMARY;
const WEBHOOK_URL_QA_PACK = process.env.TEAMS_WEBHOOK_URL_QA_PACK;
const WEBHOOK_URL_BIOSECURITY = process.env.TEAMS_WEBHOOK_URL_BIOSECURITY;
const WEBHOOK_URL_ERROR = process.env.TEAMS_WEBHOOK_URL_ERROR;
const WEBHOOK_URL_ASPHALT_JOBS = process.env.TEAMS_WEBHOOK_URL_ASPHALT_JOBS;
const WEBHOOK_URL_PROFILING_JOBS = process.env.TEAMS_WEBHOOK_URL_PROFILING_JOBS;
const WEBHOOK_URL_SPRAY_JOBS = process.env.TEAMS_WEBHOOK_URL_SPRAY_JOBS;
const WEBHOOK_URL_INCIDENTS = process.env.TEAMS_WEBHOOK_URL_INCIDENTS;
const WEBHOOK_URL_MANAGEMENT = process.env.TEAMS_WEBHOOK_URL_MANAGEMENT;
const WEBHOOK_URL_ASPHALT_QAPACK = process.env.TEAMS_WEBHOOK_URL_ASPHALT_QAPACK;
const WEBHOOK_URL_PROFILING_QAPACK = process.env.TEAMS_WEBHOOK_URL_PROFILING_QAPACK;
const WEBHOOK_URL_SPRAY_QAPACK = process.env.TEAMS_WEBHOOK_URL_SPRAY_QAPACK;

/**
 * Division colors for visual consistency
 */
const DIVISION_COLORS: Record<string, string> = {
    'Asphalt': '#F59E0B',    // Orange
    'Profiling': '#3B82F6',  // Blue
    'Spray': '#8B5CF6',      // Violet
};

/**
 * Send notification to Teams via Power Automate
 * Payload is sent as JSON, Power Automate extracts the 'message' field
 */
const sendTeamsNotification = async (webhookUrl: string | undefined, message: string, title?: string) => {
    if (!webhookUrl) {
        console.warn('MS Teams webhook URL is not set. Skipping notification.');
        return;
    }
    try {
        // Send as JSON with message field - Power Automate will use triggerBody()
        const payload = {
            title: title || 'SGA QA System Notification',
            message: message,
            timestamp: new Date().toISOString(),
        };

        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const responseText = await response.text();
            console.error(`MS Teams notification failed with status ${response.status}:`, responseText);
        } else {
            console.log(`Teams notification sent successfully to ${title || 'channel'}`);
        }
    } catch (error) {
        console.error('Error sending MS Teams notification:', error);
    }
};

/**
 * Format facts as HTML table rows
 */
const formatFacts = (facts: { name: string; value: string }[]): string => {
    return facts
        .map(f => `<b>${f.name}:</b> ${f.value}`)
        .join('<br>');
};

/**
 * Create a formatted HTML message
 */
const createHtmlMessage = (
    title: string,
    subtitle: string,
    facts: { name: string; value: string }[],
    color?: string,
    actionUrl?: string,
    actionLabel?: string
): string => {
    const colorBar = color ? `<span style="color:${color}">■</span> ` : '';
    const factsList = formatFacts(facts);
    const actionLink = actionUrl && actionLabel
        ? `<br><br><a href="${actionUrl}">${actionLabel}</a>`
        : '';

    return `${colorBar}<b>${title}</b><br><br>${subtitle}<br><br>${factsList}${actionLink}`;
};

// --- Notification Functions ---

export const sendSummaryNotification = async (report: FinalQaPack, summary: string) => {
    const message = createHtmlMessage(
        `📊 Executive Summary: ${report.job.jobNo}`,
        summary,
        [
            { name: "Client", value: report.job.client },
            { name: "Foreman", value: report.submittedBy },
            { name: "Date", value: new Date(report.timestamp).toLocaleDateString('en-AU') },
        ]
    );
    await sendTeamsNotification(WEBHOOK_URL_SUMMARY, message, 'Executive Summary');
};

export const sendQAPackNotification = async (report: FinalQaPack) => {
    let webhookUrl;
    let color;
    switch (report.job.division) {
        case 'Asphalt':
            webhookUrl = WEBHOOK_URL_ASPHALT_QAPACK || WEBHOOK_URL_ASPHALT_JOBS;
            color = DIVISION_COLORS['Asphalt'];
            break;
        case 'Profiling':
            webhookUrl = WEBHOOK_URL_PROFILING_QAPACK || WEBHOOK_URL_PROFILING_JOBS;
            color = DIVISION_COLORS['Profiling'];
            break;
        case 'Spray':
            webhookUrl = WEBHOOK_URL_SPRAY_QAPACK || WEBHOOK_URL_SPRAY_JOBS;
            color = DIVISION_COLORS['Spray'];
            break;
        default:
            webhookUrl = WEBHOOK_URL_QA_PACK;
            color = '#16A34A'; // Green
    }

    const totalTonnes = report.sgaDailyReport.works
        .reduce((acc, w) => acc + (parseFloat(w.tonnes) || 0), 0)
        .toFixed(2);

    const message = createHtmlMessage(
        `✅ QA Pack Submitted: ${report.job.jobNo}`,
        `A new <b>${report.job.division}</b> QA Pack has been submitted by <b>${report.submittedBy}</b>.`,
        [
            { name: "Client", value: report.job.client },
            { name: "Location", value: report.job.location },
            { name: "Total Tonnes", value: totalTonnes },
        ],
        color,
        report.pdfUrl,
        '📄 View PDF'
    );
    await sendTeamsNotification(webhookUrl, message, 'QA Pack Submitted');
};

export const sendJobSheetNotification = async (job: Job, pdfUrl: string) => {
    let webhookUrl;
    let color;
    switch (job.division) {
        case 'Asphalt':
            webhookUrl = WEBHOOK_URL_ASPHALT_JOBS;
            color = DIVISION_COLORS['Asphalt'];
            break;
        case 'Profiling':
            webhookUrl = WEBHOOK_URL_PROFILING_JOBS;
            color = DIVISION_COLORS['Profiling'];
            break;
        case 'Spray':
            webhookUrl = WEBHOOK_URL_SPRAY_JOBS;
            color = DIVISION_COLORS['Spray'];
            break;
        default:
            console.warn(`No specific Teams webhook for division: ${job.division}. Skipping job sheet notification.`);
            return;
    }

    const message = createHtmlMessage(
        `📋 New Job Sheet: ${job.jobNo}`,
        `A new <b>${job.division}</b> job has been created and is ready for review.`,
        [
            { name: "Client", value: job.client },
            { name: "Project", value: job.projectName },
            { name: "Location", value: job.location },
            { name: "Job Date", value: new Date(job.jobDate).toLocaleDateString('en-AU', { timeZone: 'Australia/Perth' }) },
        ],
        color,
        pdfUrl,
        '📄 View Job Sheet PDF'
    );
    await sendTeamsNotification(webhookUrl, message, 'New Job Sheet');
};

export const sendBiosecurityNotification = async (report: FinalQaPack) => {
    if (!report.foremanPhotoUrl) return;

    const message = createHtmlMessage(
        `🌿 Biosecurity Check-in: ${report.submittedBy}`,
        `Foreman verification for job <b>${report.job.jobNo}</b>.`,
        [
            { name: "Client", value: report.job.client },
            { name: "Location", value: report.job.location },
        ],
        '#FBBF24' // Yellow
    );
    await sendTeamsNotification(WEBHOOK_URL_BIOSECURITY, message, 'Biosecurity Check-in');
};

export const sendErrorNotification = async (title: string, error: Error, context: Record<string, any> = {}) => {
    const contextFacts = Object.entries(context).map(([key, value]) => {
        let stringValue: string;
        if (value === null || value === undefined) {
            stringValue = String(value);
        } else if (typeof value === 'object') {
            try {
                stringValue = JSON.stringify(value);
            } catch {
                stringValue = '[Object]';
            }
        } else {
            stringValue = String(value);
        }
        return { name: key, value: stringValue };
    });

    const stackPreview = error.stack ? error.stack.substring(0, 500) : 'Not available';

    const message = `🚨 <b>Application Error: ${title}</b><br><br>` +
        `<b>Error Message:</b> ${error.message}<br><br>` +
        formatFacts(contextFacts) +
        `<br><br><b>Stack Trace:</b><br><code>${stackPreview}</code>`;

    await sendTeamsNotification(WEBHOOK_URL_ERROR, message, 'Application Error');
};

export const sendIncidentNotification = async (incident: IncidentReport) => {
    const message = createHtmlMessage(
        `⚠️ New ${incident.type} Reported`,
        `A new <b>${incident.type}</b> report (<b>${incident.reportId}</b>) has been submitted by <b>${incident.reportedBy}</b>.`,
        [
            { name: "Date", value: new Date(incident.dateOfIncident).toLocaleDateString('en-AU') },
            { name: "Location", value: incident.location },
            { name: "Job No.", value: incident.jobNo || 'N/A' },
        ],
        '#F97316' // Orange
    );

    const fullMessage = message + `<br><br><b>Description:</b><br>${incident.description}`;
    await sendTeamsNotification(WEBHOOK_URL_INCIDENTS, fullMessage, 'Incident Report');
};

export const sendDailySummaryNotification = async (summary: string, reportCount: number, date: string) => {
    const message = createHtmlMessage(
        `📈 End of Day Summary for ${date}`,
        summary,
        [{ name: "Total Reports Summarized", value: String(reportCount) }]
    );
    await sendTeamsNotification(WEBHOOK_URL_MANAGEMENT, message, 'Daily Summary');
};

export const sendManagementUpdate = async (title: string, summary: string, facts: { name: string; value: string }[]) => {
    const message = createHtmlMessage(
        `📢 ${title}`,
        summary,
        facts
    );
    await sendTeamsNotification(WEBHOOK_URL_MANAGEMENT, message, title);
};
