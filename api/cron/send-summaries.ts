// api/cron/send-summaries.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { QAPacksData } from '../_lib/sharepointData.js';
import { GoogleGenAI } from "@google/genai";
import { FinalQaPack } from '../../types.js';
import { sendDailySummaryNotification } from '../_lib/teams.js';
import { getExpertSystemInstruction } from '../_lib/prompts.js';
import { handleApiError } from '../_lib/errors.js';

// Use GOOGLE_API_KEY or API_KEY (fallback)
const apiKey = process.env.GOOGLE_API_KEY || process.env.API_KEY;
if (!apiKey) {
    console.warn("No AI API key configured - summaries will skip AI generation");
}
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

const getTodayPerth = () => {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'Australia/Perth' }); // YYYY-MM-DD
};


export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
    if (process.env.CRON_SECRET && request.headers['x-vercel-cron-secret'] !== process.env.CRON_SECRET) {
        return response.status(401).json({ message: 'Unauthorized' });
    }

    try {
        console.log("Running End of Day (4pm) summary cron job...");

        const targetDate = getTodayPerth();

        // Get all QA packs from SharePoint
        const allReports = await QAPacksData.getAll() as FinalQaPack[];

        if (allReports.length === 0) {
            console.log("No reports found. Exiting cron job.");
            return response.status(200).json({ message: "No reports to summarize." });
        }

        // Filter reports submitted today
        const reportsFromToday = allReports.filter(report =>
            report.timestamp &&
            new Date(report.timestamp).toLocaleDateString('en-CA', { timeZone: 'Australia/Perth' }) === targetDate
        );

        if (reportsFromToday.length === 0) {
            console.log(`No reports submitted on ${targetDate}. Exiting cron job.`);
            return response.status(200).json({ message: `No reports found for ${targetDate}.` });
        }
        
        const reportsContext = reportsFromToday.map(r => `
            ---
            Job No: ${r.job.jobNo}
            Client: ${r.job.client}
            Foreman: ${r.submittedBy}
            Summary: ${r.expertSummary || 'Not available.'}
            Key Issues: ${r.sgaDailyReport.otherComments || 'None'}
            Status: Report Submitted
            ---
        `).join('\n');

        const prompt = `
            Analyze the following collection of daily QA reports submitted today, ${targetDate}.
            Synthesize them into a single, high-level End of Day summary for senior management.
            Your summary should identify overall trends, highlight any significant or recurring issues (like delays, major non-conformances, or safety hazards), and mention standout project successes.
            Do not just list each report. Find the patterns across all of them.

            **Report Data:**
            ${reportsContext}
        `;

        const result = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction: getExpertSystemInstruction('summary'),
            },
        });

        const consolidatedSummary = result.text ?? "AI summary could not be generated.";

        await sendDailySummaryNotification(consolidatedSummary, reportsFromToday.length, targetDate);

        const message = `End of Day summary for ${targetDate} generated for ${reportsFromToday.length} reports and sent successfully.`;
        console.log(message);
        
        return response.status(200).json({ message });

    } catch (error: any) {
        await handleApiError({ res: response, error, title: 'End of Day Summary Cron Failure' });
    }
}