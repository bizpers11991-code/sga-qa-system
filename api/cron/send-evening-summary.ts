// api/cron/send-evening-summary.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getRedisInstance } from '../_lib/redis.js';
import { GoogleGenAI } from "@google/genai";
import { FinalQaPack, AsphaltPlacementRow, ItpChecklistSection, ItpChecklistItem } from '../../types.js';
import { sendManagementUpdate } from '../_lib/teams.js';
import { migrateReport } from '../_lib/migration.js';
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
        
        // 1. Get all submitted reports for today
        const jobNumbers = await redis.smembers('reports:index');
        const pipeline = redis.pipeline();
        jobNumbers.forEach(jobNo => pipeline.lindex(`history:${jobNo}`, 0)); // Get only the latest version
        const latestReportsJson = await pipeline.exec<string[]>();
        
        const todaysReports: FinalQaPack[] = latestReportsJson
            .filter((r): r is string => r !== null)
            .map((r: string) => migrateReport(JSON.parse(r)))
            .filter((report: FinalQaPack) => new Date(report.timestamp).toLocaleDateString('en-CA', { timeZone: 'Australia/Perth' }) === today);

        if (todaysReports.length === 0) {
            return res.status(200).json({ message: 'No submitted reports for today to summarize.' });
        }

        // 2. Prepare detailed context for AI
        const reportDetails = todaysReports.map((r: FinalQaPack) => {
            const tempIssues = r.asphaltPlacement?.placements?.filter((p: AsphaltPlacementRow) => p.tempsCompliant === 'No').length || 0;
            const itpIssues = r.itpChecklist?.sections.flatMap((s: ItpChecklistSection) => s.items).filter((i: ItpChecklistItem) => i.compliant === 'No').length || 0;
            return `
                ---
                **Job No: ${r.job.jobNo} (${r.job.client})**
                - **Foreman:** ${r.submittedBy}
                - **Tonnes Laid:** ${r.sgaDailyReport.works.reduce((sum: number, w) => sum + (parseFloat(w.tonnes) || 0), 0).toFixed(2)}
                - **Temperature Non-Conformances:** ${tempIssues}
                - **ITP Non-Conformances:** ${itpIssues}
                - **Foreman's Comments/Delays:** ${r.sgaDailyReport.otherComments || 'None'}
            `;
        }).join('');

        const prompt = `
            You are a senior QA engineer. Provide a detailed technical evening summary for your engineering team based on all completed QA packs for today, ${today}.
            Focus on compliance, non-conformances, material usage, and any technical issues noted in the reports.
            Your summary should be factual and highlight areas that may require follow-up.

            **Submitted QA Packs for ${today}:**
            ${reportDetails}
        `;

        const result = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction: getExpertSystemInstruction('summary'),
            },
        });

        const summary = result.text ?? "Could not generate evening summary.";
        
        const facts = [
            { name: "Total Reports Reviewed", value: String(todaysReports.length) },
            { name: "Date of Reports", value: today },
        ];

        await sendManagementUpdate(`Technical Evening Summary for ${today}`, summary, facts);

        res.status(200).json({ message: 'Evening summary sent successfully.' });
    } catch (error: any) {
        await handleApiError({ res, error, title: 'Evening Summary Cron Failure' });
    }
}