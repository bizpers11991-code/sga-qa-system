// api/get-daily-briefing.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getRedisInstance } from './_lib/redis.js';
import { GoogleGenAI } from "@google/genai";
import { Job } from '../types.js';
import { hydrateObjectFromRedisHash } from './_lib/utils.js';
import { migrateJob } from './_lib/migration.js';
import { withAuth, AuthenticatedRequest } from './_lib/auth.js';
import { handleApiError } from './_lib/errors.js';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getTodayPerth = () => {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'Australia/Perth' });
};

// Perth, WA coordinates
const PERTH_LAT = -31.9523;
const PERTH_LON = 115.8613;

const getWeatherForecast = async (): Promise<string> => {
    try {
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${PERTH_LAT}&longitude=${PERTH_LON}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max&timezone=Australia%2FPerth`);
        if (!response.ok) return "Weather data unavailable.";
        const data = await response.json();
        const daily = data.daily;
        return `Forecast for Perth: High of ${daily.temperature_2m_max[0]}°C, Low of ${daily.temperature_2m_min[0]}°C. Precipitation: ${daily.precipitation_sum[0]}mm with a ${daily.precipitation_probability_max[0]}% max probability.`;
    } catch (error) {
        console.error("Failed to fetch weather:", error);
        return "Could not retrieve weather forecast.";
    }
};

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
    const { foremanId } = req.query;
    if (!foremanId || typeof foremanId !== 'string') {
        return res.status(400).json({ message: 'Foreman ID is required.' });
    }
     if (req.user.id !== foremanId) {
       return res.status(403).json({ message: 'Forbidden' });
    }

    const today = getTodayPerth();
    const cacheKey = `briefing:${foremanId}:${today}`;

    try {
        const redis = getRedisInstance();
        
        // Check cache first
        const cachedBriefing = await redis.get(cacheKey);
        if (cachedBriefing) {
            return res.status(200).json({ summary: cachedBriefing });
        }

        // --- If not cached, generate a new briefing ---
        const [jobIds, weather] = await Promise.all([
            redis.smembers('jobs:index'),
            getWeatherForecast()
        ]);
        
        if (jobIds.length === 0) {
            const noJobsSummary = "You have no jobs scheduled for today. Enjoy the quiet day or check with your scheduler for any updates.";
            return res.status(200).json({ summary: noJobsSummary });
        }
        
        const pipeline = redis.pipeline();
        jobIds.forEach(id => pipeline.hgetall(`job:${id}`));
        const results = await pipeline.exec<Record<string, string>[]>();
        
        const foremanJobsToday = results
            .filter((jobData): jobData is Record<string, string> => jobData !== null)
            .map(jobData => migrateJob(hydrateObjectFromRedisHash(jobData)) as Job)
            .filter(job => job.foremanId === foremanId && job.jobDate === today);

        if (foremanJobsToday.length === 0) {
            const noJobsSummary = "You have no jobs scheduled for today. Enjoy the quiet day or check with your scheduler for any updates.";
             await redis.set(cacheKey, noJobsSummary, { ex: 3600 * 12 }); // Cache for 12 hours
            return res.status(200).json({ summary: noJobsSummary });
        }

        const jobDetails = foremanJobsToday.map(job => 
            `- **${job.jobNo} (${job.client})**: A ${job.division} job at ${job.location}. Project: ${job.projectName}.`
        ).join('\n');
        
        const prompt = `
            You are a helpful and concise operations assistant for SGA. Your task is to provide a personalized morning briefing for a foreman. Be friendly and professional.
            
            **Foreman:** ${req.user.name}
            **Date:** ${today}
            **Weather Forecast:** ${weather}
            
            **Scheduled Jobs for Today:**
            ${jobDetails}
            
            **Instruction:**
            Based on the information above, write a brief, easy-to-read summary of the foreman's day. Start with a greeting. Mention the number of jobs. For each job, briefly state the client and location. Incorporate the weather forecast as a practical tip (e.g., "watch for afternoon showers"). Keep it under 100 words.
        `;

        const result = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        const summary = result.text ?? "Could not generate a daily briefing.";
        
        // Cache the result until the end of the day
        const now = new Date();
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        const ttl = Math.floor((endOfDay.getTime() - now.getTime()) / 1000);
        await redis.set(cacheKey, summary, { ex: ttl > 0 ? ttl : 3600 }); // Cache for at least 1 hr if calculation is off

        res.status(200).json({ summary });

    } catch (error: any) {
        // Don't send a 500 for a non-critical feature, just a user-friendly error
        await handleApiError({
            res,
            error,
            title: 'AI Daily Briefing Failure',
            context: { foremanId },
            statusCode: 503,
        });
    }
}

export default withAuth(handler, ['asphalt_foreman', 'profiling_foreman', 'spray_foreman']);