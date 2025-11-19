import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from "@google/genai";
import { getExpertSystemInstruction } from './_lib/prompts.js';
import { handleApiError } from './_lib/errors.js';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const responseSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            chainage: {
                type: Type.NUMBER,
                description: 'The randomly generated chainage in meters, rounded to two decimal places.'
            },
            offset: {
                type: Type.STRING,
                description: "The randomly assigned transverse offset position, chosen from 'LWP' (Left Wheel Path), 'RWP' (Right Wheel Path), or 'Between WP' (Between Wheel Paths)."
            },
            notes: {
                type: Type.STRING,
                description: 'An empty string for notes to be added later.'
            }
        }
    }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { startChainage, endChainage, numCores, jobNo, lotNo, specification } = req.body;

        if (!startChainage || !endChainage || !numCores || !jobNo || !lotNo) {
            return res.status(400).json({ message: 'Job No, Lot No, Start Chainage, End Chainage, and Number of Cores are required.' });
        }

        const start = parseFloat(startChainage as string);
        const end = parseFloat(endChainage as string);
        const count = parseInt(numCores as string, 10);

        if (isNaN(start) || isNaN(end) || isNaN(count) || start >= end || count <= 0) {
            return res.status(400).json({ message: 'Invalid input parameters.' });
        }

        const prompt = `
            For a pavement lot with the following parameters:
            - Job Number: ${jobNo}
            - Lot Number: ${lotNo}
            - Specification: ${specification || 'AS 2891 / MRWA 504'}
            - Start Chainage: ${start} meters
            - End Chainage: ${end} meters
            - Number of Samples Required: ${count}

            Generate a stratified random sampling plan with ${count} unique locations. For each location, provide a random chainage and a random transverse offset.

            Rules:
            1.  The chainage for each sample must be unique and fall strictly between the start and end chainages.
            2.  Divide the lot into ${count} equal-length strata and generate one random chainage within each stratum to ensure proper distribution.
            3.  For each location, randomly assign a transverse offset from the following list: 'LWP' (Left Wheel Path), 'RWP' (Right Wheel Path), 'Between WP'.
            4.  Ensure the distribution of offsets is as even as possible.
        `;
        
        const systemInstruction = getExpertSystemInstruction('calculation');

        const result = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema,
            },
        });

        const jsonText = (result.text ?? '').trim();
        if (!jsonText) {
            throw new Error('AI model returned an empty response.');
        }

        const coreLocations = JSON.parse(jsonText);
        
        // Sort results by chainage for a logical output worksheet
        coreLocations.sort((a: any, b: any) => a.chainage - b.chainage);
        
        return res.status(200).json({ coreLocations });

    } catch (error: any) {
        await handleApiError({
            res,
            error,
            title: 'Core Location Generation Failure',
            context: req.body,
        });
    }
}