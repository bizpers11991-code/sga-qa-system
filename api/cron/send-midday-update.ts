// api/cron/send-midday-update.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { JobsData, DraftsData } from '../_lib/sharepointData.js';
import { GoogleGenAI } from "@google/genai";
import { Job, QaPack } from '../../types.js';
import { sendManagementUpdate } from '../_lib/teams.js';
import { getExpertSystemInstruction } from '../_lib/prompts.js';
import { handleApiError } from '../_lib/errors.js';

// Use GOOGLE_API_KEY or API_KEY (fallback)
const apiKey = process.env.GOOGLE_API_KEY || process.env.API_KEY;
if (!apiKey) {
    console.warn("No AI API key configured - midday update will skip AI summaries");
}
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

const getTodayPerth = () => {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'Australia/Perth' });
};

const getReportTitle = (reportType: string | string[] | undefined): string => {
    switch (reportType) {
        case 'morning': return '9:00 AM Progress Check-in';
        case 'lunch': return '11:40 AM Pre-Lunch Report';
        case 'afternoon': return '1:00 PM Afternoon Update';
        default: return 'Mid-day Progress Update';
    }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (process.env.CRON_SECRET && req.headers['x-vercel-cron-secret'] !== process.env.CRON_SECRET) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const today = getTodayPerth();
        const { report } = req.query;
        const title = getReportTitle(report);

        // 1. Get all jobs for today
        const allJobs = await JobsData.getAll();
        const todaysJobs = allJobs.filter(job => job.jobDate === today);

        if (todaysJobs.length === 0) {
            return res.status(200).json({ message: 'No active jobs for today to report on.' });
        }

        // 2. Get all drafts from SharePoint
        const allDrafts = await DraftsData.getAll();

        // 3. Process drafts and prepare context for AI
        let progressDetails = '';
        let jobsWithProgress = 0;

        for (const job of todaysJobs) {
            // Find draft for this job and foreman
            const draftItem = allDrafts.find(d =>
                d.jobId === job.id && d.foremanId === job.foremanId
            );

            if (!draftItem || !draftItem.data) {
                progressDetails += `\n- **${job.jobNo} (${job.client})**: No draft data available yet. Crew may not have started.`;
                continue;
            }

            try {
                // Parse draft data
                const draft: QaPack = typeof draftItem.data === 'string' ? JSON.parse(draftItem.data) : draftItem.data;
                jobsWithProgress++;

                let metrics = '';
                if (job.division === 'Asphalt') {
                    const tonnes = draft.asphaltPlacement.placements.reduce((sum, p) => sum + (parseFloat(p.tonnes) || 0), 0);
                    metrics = `Progress: ${tonnes.toFixed(2)} tonnes laid.`;
                } else if (job.division === 'Profiling') {
                    const area = draft.sgaDailyReport.works.reduce((sum, w) => sum + (parseFloat(w.area) || 0), 0);
                    metrics = `Progress: ${area.toFixed(2)} m² profiled.`;
                } else if (job.division === 'Spray') {
                    const area = draft.sprayReport?.runs.reduce((sum, r) => sum + (parseFloat(r.area) || 0), 0) || 0;
                    metrics = `Progress: ${area.toFixed(2)} m² sprayed.`;
                }

                const issues = draft.sgaDailyReport.otherComments || 'None reported.';
                const photos = draft.sitePhotos.length;

                progressDetails += `\n- **${job.jobNo} (${job.client})**: ${metrics} Issues: ${issues}. Photos Added: ${photos}.`;

            } catch (e) {
                progressDetails += `\n- **${job.jobNo} (${job.client})**: Could not parse draft data.`;
                console.error(`Failed to parse draft for job ${job.jobNo}`, e);
            }
        }

        const prompt = `
            You are an operations manager providing a mid-day progress update.
            Based on the following real-time data from active job site drafts for ${today}, provide a concise summary for management.
            Highlight key metrics and any reported issues or delays.

            **Live Job Data:**
            ${progressDetails}
        `;

        const result = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction: getExpertSystemInstruction('summary'),
            },
        });

        const summary = result.text ?? "Could not generate progress summary.";
        
        const facts = [
            { name: "Total Active Jobs", value: String(todaysJobs.length) },
            { name: "Crews Reporting Progress", value: String(jobsWithProgress) },
        ];

        await sendManagementUpdate(title, summary, facts);

        res.status(200).json({ message: 'Mid-day update sent successfully.' });
    } catch (error: any) {
        await handleApiError({ res, error, title: 'Mid-day Update Cron Failure' });
    }
}