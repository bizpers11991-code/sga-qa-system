// api/cron/send-morning-lookahead.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getRedisInstance } from '../_lib/redis.js';
import { GoogleGenAI } from "@google/genai";
import { Job } from '../../types.js';
import { sendManagementUpdate } from '../_lib/teams.js';
import { hydrateObjectFromRedisHash } from '../_lib/utils.js';
import { migrateJob } from '../_lib/migration.js';
import { getExpertSystemInstruction } from '../_lib/prompts.js';
import { handleApiError } from '../_lib/errors.js';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getTodayPerth = () => {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'Australia/Perth' });
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (process.env.CRON_SECRET && req.headers['x-vercel-cron-secret'] !== process.env.CRON_SECRET) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const redis = getRedisInstance();
        const today = getTodayPerth();
        
        const jobIds = await redis.smembers('jobs:index');
        if (jobIds.length === 0) {
            return res.status(200).json({ message: 'No jobs found to analyze.' });
        }

        const pipeline = redis.pipeline();
        jobIds.forEach(id => pipeline.hgetall(`job:${id}`));
        const results = await pipeline.exec<Record<string, string>[]>();
        
        const todaysJobs = results
            .filter((jobData): jobData is Record<string, string> => jobData !== null)
            .map(jobData => migrateJob(hydrateObjectFromRedisHash(jobData)) as Job)
            .filter(job => job.jobDate === today);

        if (todaysJobs.length === 0) {
            await sendManagementUpdate(
                `Morning Lookahead for ${today}`,
                "No jobs are scheduled for today.",
                [{ name: "Total Jobs", value: "0" }]
            );
            return res.status(200).json({ message: 'No jobs scheduled for today.' });
        }

        const jobDetails = todaysJobs.map(job => 
            `- **${job.jobNo} (${job.client})**: Division: ${job.division}, Location: ${job.location}`
        ).join('\n');

        const prompt = `
            You are an operations manager preparing a morning briefing.
            Based on the following list of jobs scheduled for today, ${today}, provide a concise and clear "Morning Lookahead" summary.
            Group the jobs by division (Asphalt, Profiling, Spray) and briefly state the plan for the day.

            **Today's Scheduled Jobs:**
            ${jobDetails}
        `;

        const result = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction: getExpertSystemInstruction('summary'),
            },
        });

        const summary = result.text ?? "Could not generate lookahead summary.";
        
        const facts = [
            { name: "Total Jobs Today", value: String(todaysJobs.length) },
            { name: "Asphalt Jobs", value: String(todaysJobs.filter(j => j.division === 'Asphalt').length) },
            { name: "Profiling Jobs", value: String(todaysJobs.filter(j => j.division === 'Profiling').length) },
            { name: "Spray Jobs", value: String(todaysJobs.filter(j => j.division === 'Spray').length) },
        ];

        await sendManagementUpdate(`Morning Lookahead for ${today}`, summary, facts);

        res.status(200).json({ message: 'Morning lookahead sent successfully.' });
    } catch (error: any) {
        await handleApiError({ res, error, title: 'Morning Lookahead Cron Failure' });
    }
}