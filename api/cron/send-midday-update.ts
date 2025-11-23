// api/cron/send-midday-update.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getRedisInstance } from '../_lib/redis.js';
import { GoogleGenAI } from "@google/genai";
import { Job, QaPack } from '../../types.js';
import { sendManagementUpdate } from '../_lib/teams.js';
import { hydrateObjectFromRedisHash } from '../_lib/utils.js';
import { migrateJob } from '../_lib/migration.js';
import { getExpertSystemInstruction } from '../_lib/prompts.js';
import { handleApiError } from '../_lib/errors.js';

// NOTE: This serverless function CANNOT use the client-side encryption service.
// A shared secret or different encryption strategy would be needed if drafts were encrypted at rest.
// For now, we assume drafts in Redis are NOT encrypted for this server-side analysis.

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
        const redis = getRedisInstance();
        const today = getTodayPerth();
        const { report } = req.query;
        const title = getReportTitle(report);

        // 1. Get all jobs for today
        const jobIds = await redis.smembers('jobs:index');
        const jobPipeline = redis.pipeline();
        jobIds.forEach(id => jobPipeline.hgetall(`job:${id}`));
        const jobResults = await jobPipeline.exec<Record<string, string>[]>();
        
        const todaysJobs = jobResults
            .filter((jobData): jobData is Record<string, string> => jobData !== null)
            .map(jobData => migrateJob(hydrateObjectFromRedisHash(jobData)) as Job)
            .filter(job => job.jobDate === today);

        if (todaysJobs.length === 0) {
            return res.status(200).json({ message: 'No active jobs for today to report on.' });
        }

        // 2. Get all drafts for today's jobs
        const draftPipeline = redis.pipeline();
        todaysJobs.forEach(job => draftPipeline.get(`draft:${job.id}:${job.foremanId}`));
        const draftResults = await draftPipeline.exec<string[]>();

        // 3. Process drafts and prepare context for AI
        let progressDetails = '';
        let jobsWithProgress = 0;

        for (let i = 0; i < todaysJobs.length; i++) {
            const job = todaysJobs[i];
            const draftJson = draftResults[i];

            if (!draftJson) {
                progressDetails += `\n- **${job.jobNo} (${job.client})**: No draft data available yet. Crew may not have started.`;
                continue;
            }

            try {
                // Here we would decrypt if drafts were encrypted
                const draft: QaPack = JSON.parse(draftJson);
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