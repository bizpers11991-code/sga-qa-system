import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from "@google/genai";
import type { DailyJobSheetData, Role } from '../src/types';
import { handleApiError } from './_lib/errors.js';
import { withAuth, AuthenticatedRequest } from './_lib/auth.js';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        // --- Standard Fields ---
        jobNo: { type: Type.STRING },
        client: { type: Type.STRING },
        date: { type: Type.STRING, description: 'Format as YYYY-MM-DD from the DATE field.' },
        address: { type: Type.STRING },
        projectName: { type: Type.STRING },
        
        // --- Profiling Specific Fields ---
        crewLeader: { type: Type.STRING },
        crew: { type: Type.STRING, description: "List of crew members, e.g., 'Jack B, Jahani, Gogsey'" },
        depotStartTime: { type: Type.STRING },
        leaveDepotTime: { type: Type.STRING },
        onSiteBriefingTime: { type: Type.STRING },
        startCutTime: { type: Type.STRING },
        clientSiteContact: { type: Type.STRING },

        // Description of Works
        workArea: { type: Type.STRING, description: "Value from Area (m2), e.g., '1300m2'" },
        depth: { type: Type.STRING, description: "Value from Depth (mm), e.g., '40mm-80mm'" },
        tons: { type: Type.STRING },
        trucksDescription: { type: Type.STRING, description: "Value from the Trucks column, e.g., 'Use own 6w'" },
        descriptionOfWorks: { type: Type.STRING },
        rapDumpsite: { type: Type.STRING },
        
        // Plant Requirements (modeled as arrays)
        profilers: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    machine: { type: Type.STRING, description: "The machine type, e.g., 'Bobcat Sweeper', 'Pocket', 'SGA87'" },
                    startTime: { type: Type.STRING },
                    supplier: { type: Type.STRING },
                    notes: { type: Type.STRING, description: "Any notes from the yellow boxes under the corresponding machine" }
                }
            }
        },
        trucks: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    machine: { type: Type.STRING, description: "The truck type, e.g., '3 x Semis'" },
                    startTime: { type: Type.STRING },
                    supplier: { type: Type.STRING },
                    notes: { type: Type.STRING, description: "Any notes from the yellow boxes under the corresponding truck" }
                }
            }
        },

        // Float Details
        machineDeliveryLocation: { type: Type.STRING },
        radioChannel: { type: Type.STRING },
        timeMachineToBeOnSiteBy: { type: Type.STRING },
        preDropOption: { type: Type.STRING },
        gateEntry: { type: Type.STRING },
        ifFloatRequiredToWait: { type: Type.STRING },

        // End of Shift Checks (if present)
        endOfShiftChecks: {
            type: Type.OBJECT,
            properties: {
                teethInspected: { type: Type.BOOLEAN },
                machinesRefueledWaterFull: { type: Type.BOOLEAN },
                machinesCleanedReloaded: { type: Type.BOOLEAN },
                kerbsCheckedForDamage: { type: Type.BOOLEAN },
                percentOfTeethWear: { type: Type.STRING },
                detailsOfKerbDamage: { type: Type.STRING }
            }
        },

        notes: { type: Type.STRING },
    }
};

async function handler(
  request: AuthenticatedRequest,
  response: VercelResponse
) {
    if (request.method !== 'POST') {
        return response.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { imageBase64, mimeType } = request.body;
        if (!imageBase64) {
            return response.status(400).json({ message: 'No file data provided.' });
        }
        if (!mimeType) {
            return response.status(400).json({ message: 'No MIME type provided for the file.' });
        }

        const filePart = { inlineData: { mimeType, data: imageBase64 } };
        const textPart = { text: 'Extract all details from the provided Profiling Job Sheet document. Pay close attention to all fields, including contacts, site details, all plant requirements and float details. Provide the output in the specified JSON schema.' };

        const result = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: [filePart, textPart] },
            config: {
                responseMimeType: "application/json",
                responseSchema,
            },
        });
        
        const jsonText = (result.text ?? '').trim();
        if (!jsonText) {
            console.error("Gemini response was empty.", result);
            throw new Error('AI model returned an empty response.');
        }
        
        const extractedData = JSON.parse(jsonText) as DailyJobSheetData;
        
        return response.status(200).json({ extractedData });

    } catch (error: any) {
        if (error instanceof SyntaxError) {
             error.message = 'AI returned an invalid format. Please try again with a clearer document.';
        }
        await handleApiError({
            res: response,
            error,
            title: 'Job Detail Extraction Failure',
            context: { Endpoint: '/api/extract-job-details' },
        });
    }
}

const authorizedRoles: Role[] = ['asphalt_engineer', 'profiling_engineer', 'spray_admin', 'scheduler_admin', 'management_admin', 'hseq_manager'];
export default withAuth(handler, authorizedRoles);
