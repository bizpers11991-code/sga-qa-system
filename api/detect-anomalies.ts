import type { VercelRequest, VercelResponse } from '@vercel/node';
import { QAPacksData } from './_lib/sharepointData';
import { GoogleGenAI } from "@google/genai";
import { FinalQaPack, Role } from '../src/types';
import { sendErrorNotification } from './_lib/teams.js';
import { withAuth, AuthenticatedRequest } from './_lib/auth.js';
import { handleApiError } from './_lib/errors.js';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        // Get all QA packs from SharePoint
        const allReports = await QAPacksData.getAll() as any[];

        if (allReports.length < 5) { // Need a minimum amount of data to find patterns
            return res.status(200).json({ analysis: "Insufficient data for anomaly detection. At least 5 reports are needed." });
        }

        // Extract relevant data for analysis
        const hazardData = allReports.flatMap(r => r.siteRecord.hazardLog.map(h => h.hazardDescription)).filter(Boolean);
        const nonConformanceData = allReports.flatMap(r => r.asphaltPlacement.placements.map(p => p.nonConformanceReason)).filter(Boolean);
        const delayData = allReports.map(r => r.sgaDailyReport.otherComments).filter(c => c && c.toLowerCase().includes('delay'));

        const prompt = `
            As a data analyst for a construction company, analyze the following lists of raw data extracted from dozens of daily QA reports.
            Your goal is to identify systemic issues, recurring problems, or interesting anomalies that management should be aware of.

            **1. Hazard Log Entries:**
            The following hazards have been reported by foremen on various sites:
            - ${hazardData.slice(0, 50).join('\n- ') || 'No hazard data'}

            **2. Non-Conformance Reasons (Asphalt):**
            The following reasons were given for asphalt not meeting specifications:
            - ${nonConformanceData.slice(0, 50).join('\n- ') || 'No non-conformance data'}

            **3. Reported Delays:**
            The following comments mention delays:
            - ${delayData.slice(0, 50).join('\n- ') || 'No delay data'}

            **Analysis Task:**
            Synthesize the information from the three lists above. Do not just list the items. Instead, find patterns and provide actionable insights.
            - Are there specific hazards that appear frequently across different jobs? (e.g., "public interaction", "uneven ground")
            - Is there a common theme in non-conformances? (e.g., "mix too cold on arrival")
            - What are the most common reasons for delays? (e.g., "waiting on trucks", "client not ready")

            Provide a concise summary of your findings as a bulleted list. Focus on insights that could lead to process improvements, new safety talks, or better planning.
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        const analysis = response.text ?? "Could not generate analysis.";
        
        res.status(200).json({ analysis });

    } catch (error: any) {
        await handleApiError({
            res,
            error,
            title: 'Anomaly Detection Failure'
        });
    }
}

const authorizedRoles: Role[] = ['asphalt_engineer', 'profiling_engineer', 'spray_admin', 'scheduler_admin', 'management_admin', 'hseq_manager'];
export default withAuth(handler, authorizedRoles);
