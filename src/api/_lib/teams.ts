// api/_lib/teams.ts
import { FinalQaPack, Job, IncidentReport, QaPack } from '../../types.js';

// Environment variables for MS Teams Incoming Webhooks
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


const sendTeamsNotification = async (webhookUrl: string | undefined, payload: object) => {
    if (!webhookUrl) {
        console.warn('MS Teams webhook URL is not set. Skipping notification.');
        return;
    }
    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            const responseText = await response.text();
            console.error(`MS Teams notification failed with status ${response.status}:`, responseText);
        }
    } catch (error) {
        console.error('Error sending MS Teams notification:', error);
    }
};

const createAdaptiveCard = (title: string, summary: string, facts: { name: string, value: string }[], theme: 'default' | 'emphasis' | 'good' | 'attention' | 'warning' = 'default') => {
    return {
        "type": "message",
        "attachments": [
            {
                "contentType": "application/vnd.microsoft.card.adaptive",
                "content": {
                    "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
                    "type": "AdaptiveCard",
                    "version": "1.4",
                    "style": theme,
                    "body": [
                        {
                            "type": "TextBlock",
                            "text": title,
                            "weight": "Bolder",
                            "size": "Medium"
                        },
                        {
                            "type": "TextBlock",
                            "text": summary,
                            "wrap": true
                        },
                        {
                            "type": "FactSet",
                            "facts": facts
                        }
                    ]
                }
            }
        ]
    };
};

// --- Notification Functions ---

export const sendSummaryNotification = async (report: FinalQaPack, summary: string) => {
    const payload = createAdaptiveCard(
        `Executive Summary: ${report.job.jobNo}`,
        summary,
        [
            { name: "Client", value: report.job.client },
            { name: "Foreman", value: report.submittedBy },
            { name: "Date", value: new Date(report.timestamp).toLocaleDateString('en-AU') },
        ],
        'emphasis'
    );
    await sendTeamsNotification(WEBHOOK_URL_SUMMARY, payload);
};

export const sendQAPackNotification = async (report: FinalQaPack) => {
    let webhookUrl;
    let color;
    switch (report.job.division) {
        case 'Asphalt':
            webhookUrl = WEBHOOK_URL_ASPHALT_QAPACK || WEBHOOK_URL_ASPHALT_JOBS;
            color = "F59E0B"; // Orange
            break;
        case 'Profiling':
            webhookUrl = WEBHOOK_URL_PROFILING_QAPACK || WEBHOOK_URL_PROFILING_JOBS;
            color = "3B82F6"; // Blue
            break;
        case 'Spray':
            webhookUrl = WEBHOOK_URL_SPRAY_QAPACK || WEBHOOK_URL_SPRAY_JOBS;
            color = "8B5CF6"; // Violet
            break;
        default:
            webhookUrl = WEBHOOK_URL_QA_PACK; // Fallback to the generic QA pack channel
            color = "16A34A"; // Green
    }
    
    const payload = {
        "@type": "MessageCard",
        "summary": `QA Pack Submitted for ${report.job.jobNo}`,
        "themeColor": color,
        "title": `QA Pack Submitted: ${report.job.jobNo} - ${report.job.client}`,
        "sections": [{
            "activityTitle": `A new **${report.job.division}** QA Pack has been submitted by **${report.submittedBy}**.`,
            "facts": [
                { "name": "Location", "value": report.job.location },
                { "name": "Total Tonnes", "value": report.sgaDailyReport.works.reduce((acc, w) => acc + (parseFloat(w.tonnes) || 0), 0).toFixed(2) }
            ],
            "markdown": true
        }],
        "potentialAction": [{
            "@type": "OpenUri",
            "name": "View PDF",
            "targets": [{ "os": "default", "uri": report.pdfUrl }]
        }]
    };
    await sendTeamsNotification(webhookUrl, payload);
};

export const sendJobSheetNotification = async (job: Job, pdfUrl: string) => {
    let webhookUrl;
    let color;
    switch (job.division) {
        case 'Asphalt':
            webhookUrl = WEBHOOK_URL_ASPHALT_JOBS;
            color = "F59E0B"; // Orange
            break;
        case 'Profiling':
            webhookUrl = WEBHOOK_URL_PROFILING_JOBS;
            color = "3B82F6"; // Blue
            break;
        case 'Spray':
            webhookUrl = WEBHOOK_URL_SPRAY_JOBS;
            color = "8B5CF6"; // Violet
            break;
        default:
            console.warn(`No specific Teams webhook for division: ${job.division}. Skipping job sheet notification.`);
            return;
    }

    const payload = {
        "@type": "MessageCard",
        "summary": `New Job Sheet for ${job.jobNo}`,
        "themeColor": color,
        "title": `New Job Sheet Created: ${job.jobNo} - ${job.client}`,
        "sections": [{
            "activitySubtitle": `A new **${job.division}** job has been created and is ready for review.`,
            "facts": [
                { "name": "Project", "value": job.projectName },
                { "name": "Location", "value": job.location },
                { "name": "Job Date", "value": new Date(job.jobDate).toLocaleDateString('en-AU', { timeZone: 'Australia/Perth' }) }
            ],
            "markdown": true
        }],
        "potentialAction": [{
            "@type": "OpenUri",
            "name": "View Job Sheet PDF",
            "targets": [{ "os": "default", "uri": pdfUrl }]
        }]
    };
    await sendTeamsNotification(webhookUrl, payload);
};

export const sendBiosecurityNotification = async (report: FinalQaPack) => {
    if (!report.foremanPhotoUrl) return;
    const payload = {
        "@type": "MessageCard",
        "summary": `Biosecurity Check-in: ${report.submittedBy}`,
        "themeColor": "FBBF24", // Yellow
        "title": `Biosecurity Check-in: ${report.submittedBy}`,
        "sections": [{
            "activityTitle": `Foreman verification for job **${report.job.jobNo}**.`,
            "facts": [
                { "name": "Client", "value": report.job.client },
                { "name": "Location", "value": report.job.location }
            ],
            "images": [
                { "image": report.foremanPhotoUrl, "title": report.submittedBy }
            ],
            "markdown": true
        }]
    };
    await sendTeamsNotification(WEBHOOK_URL_BIOSECURITY, payload);
};

export const sendErrorNotification = async (title: string, error: Error, context: Record<string, any> = {}) => {
    const contextFacts = Object.entries(context).map(([key, value]) => ({
        "name": key, "value": `\`${value}\``
    }));

    const payload = {
        "@type": "MessageCard",
        "summary": `Error: ${title}`,
        "themeColor": "DC2626", // Red
        "title": `🚨 Application Error: ${title}`,
        "sections": [{
            "activityTitle": "An error occurred in a serverless function.",
            "facts": [
                { "name": "Error Message", "value": `\`${error.message}\`` },
                ...contextFacts
            ],
            "markdown": true
        }, {
            "title": "Stack Trace",
            "text": "```\n" + (error.stack ? error.stack.substring(0, 4000) : "Not available") + "\n```"
        }]
    };
    await sendTeamsNotification(WEBHOOK_URL_ERROR, payload);
};

export const sendIncidentNotification = async (incident: IncidentReport) => {
    const payload = {
        "@type": "MessageCard",
        "summary": `New Incident Reported: ${incident.reportId}`,
        "themeColor": "F97316", // Orange
        "title": `New Incident Reported: ${incident.type}`,
        "sections": [{
            "activityTitle": `A new **${incident.type}** report (${incident.reportId}) has been submitted by **${incident.reportedBy}**.`,
            "facts": [
                { "name": "Date", "value": new Date(incident.dateOfIncident).toLocaleDateString('en-AU') },
                { "name": "Location", "value": incident.location },
                { "name": "Job No.", "value": incident.jobNo || 'N/A' }
            ],
            "markdown": true
        }, {
            "title": "Description",
            "text": incident.description
        }]
    };
    await sendTeamsNotification(WEBHOOK_URL_INCIDENTS, payload);
};

// New function for sending consolidated daily summaries
export const sendDailySummaryNotification = async (summary: string, reportCount: number, date: string) => {
    const payload = createAdaptiveCard(
        `End of Day Summary for ${date}`,
        summary,
        [{ name: "Total Reports Summarized", value: String(reportCount) }],
        'emphasis'
    );
    await sendTeamsNotification(WEBHOOK_URL_MANAGEMENT, payload);
};

// --- New Scheduled Notification Functions ---

export const sendManagementUpdate = async (title: string, summary: string, facts: {name: string, value: string}[]) => {
     const payload = createAdaptiveCard(title, summary, facts, 'default');
     await sendTeamsNotification(WEBHOOK_URL_MANAGEMENT, payload);
};