import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getRedisInstance } from './_lib/redis.js';
import { GoogleGenAI } from "@google/genai";
import { Job, DailyJobSheetData, Role } from '../src/types';
import { sendErrorNotification } from './_lib/teams.js';
import { getExpertSystemInstruction } from './_lib/prompts.js';
import { hydrateObjectFromRedisHash } from './_lib/utils.js';
import { withAuth, AuthenticatedRequest } from './_lib/auth.js';
import { handleApiError } from './_lib/errors.js';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Mock weather service for demonstration
const getMockWeatherForecast = (location: string, date: string): string => {
    const day = new Date(date).getDay();
    const city = location.toLowerCase();
    
    if (city.includes('perth')) {
        return `Forecast for ${date}: 18°C, Partly cloudy with a 20% chance of showers in the afternoon. Winds SW at 15-25 km/h.`;
    }
    if (day % 2 === 0) {
        return `Forecast for ${date}: 22°C, Sunny with clear skies. Winds E at 10-15 km/h. Ideal conditions.`;
    } else {
        return `Forecast for ${date}: 15°C, Overcast with a 70% chance of rain, developing in the morning. Winds NW at 30-40 km/h. Poor conditions expected.`;
    }
};

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { jobId } = req.query;
        if (!jobId || typeof jobId !== 'string') {
            return res.status(400).json({ message: 'Job ID is required.' });
        }
        
        const redis = getRedisInstance();
        const jobDataRedis = await redis.hgetall(`job:${jobId}`);

        if (!jobDataRedis) {
            return res.status(404).json({ message: 'Job not found.' });
        }
        const jobData = hydrateObjectFromRedisHash(jobDataRedis) as Job;
        
        const jobSheetDataRedis = await redis.hgetall(`jobsheet:${jobId}`);
        const jobSheetData = hydrateObjectFromRedisHash(jobSheetDataRedis) as DailyJobSheetData | null;
        
        const weatherForecast = getMockWeatherForecast(jobData.location, jobData.dueDate);

        const prompt = `
            Analyze the following job details and its weather forecast to identify potential risks.
            Provide a concise, bulleted list of risks and proactive recommendations.

            **Job Details:**
            - Client: ${jobData.client}
            - Location: ${jobData.location}
            - Division: ${jobData.division}
            - QA Specification: ${jobData.qaSpec}
            - Work Type: ${jobSheetData?.jobMaterials?.[0]?.pavementType || 'General Works'}
            - Total Tonnes: ${jobSheetData?.jobMaterials?.reduce((acc, m) => acc + m.tonnes, 0) || 'N/A'}
            - Key Instructions: ${jobSheetData?.jobDetails?.join(', ') || 'None'}

            **Weather Forecast:**
            - ${weatherForecast}

            **Analysis Task:**
            Based on the information above, identify the top 3-5 potential risks for this job. Consider factors like:
            1.  **Weather Impact:** Rain on asphalt laying, wind affecting safety or quality, temperature affecting compaction.
            2.  **Logistics:** Large tonnage requiring many truck movements, specific client requirements.
            3.  **Quality Control:** High-spec jobs (e.g., MRWA) needing strict compliance, temperature challenges in cold/wet weather.
            4.  **Safety:** Traffic management complexity, hazards associated with the weather.

            For each risk, provide a brief, actionable recommendation. Format the output clearly with headings for "Potential Risks" and "Recommendations".
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction: getExpertSystemInstruction('risk-analysis'),
            }
        });

        const analysis = response.text ?? "Could not generate analysis.";
        
        res.status(200).json({ analysis });

    } catch (error: any) {
        await handleApiError({
            res,
            error,
            title: 'Job Risk Analysis Failure',
            context: { jobId: req.query.jobId },
        });
    }
}

const authorizedRoles: Role[] = ['asphalt_engineer', 'profiling_engineer', 'spray_admin', 'scheduler_admin', 'management_admin', 'hseq_manager'];
export default withAuth(handler, authorizedRoles);
