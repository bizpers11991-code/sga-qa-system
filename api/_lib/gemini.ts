import { GoogleGenAI } from "@google/genai";
import { FinalQaPack } from '../../src/types.js';
import { sendErrorNotification } from './teams.js';
import { getExpertSystemInstruction } from './prompts.js';
import { sanitizeForAIPrompt } from './sanitization.js';

// SECURITY FIX (CRIT-003): Validate API key at startup, fail fast if missing
if (!process.env.API_KEY || process.env.API_KEY.trim().length === 0) {
    throw new Error("FATAL: API_KEY environment variable not set or empty. Cannot initialize Gemini AI securely.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateReportSummary = async (report: FinalQaPack): Promise<string> => {
  const formatTable = (headers: string[], rows: any[]) => {
    if (!rows || rows.length === 0) return 'Not applicable.';
    const formatHeader = (h: string) => h.toLowerCase().replace(/[^a-z0-9]/g, '');
    const headerKeys = headers.map(formatHeader);

    const headerLine = `| ${headers.join(' | ')} |`;
    const divider = `| ${headers.map(() => '---').join(' | ')} |`;
    const body = rows.map(row => {
        const rowValues = headerKeys.map(key => {
            const rowKey = Object.keys(row).find(k => formatHeader(k) === key);
            return rowKey ? row[rowKey] : '';
        });
        return `| ${rowValues.join(' | ')} |`;
    }).join('\n');
    return `${headerLine}\n${divider}\n${body}`;
  };
  
  const getItpSummary = (itp: FinalQaPack['itpChecklist']): string => {
    const nonCompliantItems = itp.sections
      .flatMap(section => section.items)
      .filter(item => item.compliant === 'No');

    if (nonCompliantItems.length === 0) {
      return "All ITP checklist items were marked as compliant.";
    }

    return `
      **Potential ITP Issues Found:**
      ${nonCompliantItems.map(item => `- ${item.description}: Non-compliant. Comment: ${item.comments || 'None'}`).join('\n')}
    `;
  }

  // SECURITY FIX (CRIT-001): Sanitize all user inputs before sending to AI
  // This prevents prompt injection attacks where malicious users could inject
  // instructions to manipulate AI output or extract sensitive information
  const sanitizedClient = sanitizeForAIPrompt(report.job.client, 200);
  const sanitizedJobNo = sanitizeForAIPrompt(report.job.jobNo, 50);
  const sanitizedLocation = sanitizeForAIPrompt(report.job.location, 200);
  const sanitizedDate = sanitizeForAIPrompt(report.asphaltPlacement.date, 50);
  const sanitizedForeman = sanitizeForAIPrompt(report.sgaDailyReport.completedBy, 100);
  const sanitizedQaSpec = sanitizeForAIPrompt(report.job.qaSpec || 'Not specified', 200);

  const prompt = `
    Analyze the following Quality Assurance Pack and provide a concise executive summary for a project manager.
    Focus on key metrics, compliance, issues, and overall progress, interpreting the data in the context of relevant industry standards.

    **Job Details:**
    - Project / Client: ${sanitizedClient}
    - Job No: ${sanitizedJobNo}
    - Location: ${sanitizedLocation}
    - Date: ${sanitizedDate}
    - Foreman: ${sanitizedForeman}
    - QA Specification: ${sanitizedQaSpec}

    **1. Daily Report Summary:**
    - Work Performed:
      ${report.sgaDailyReport.works.map(w => `- ${sanitizeForAIPrompt(w.mixType, 100)} (${sanitizeForAIPrompt(w.tonnes, 20)} tonnes, ${sanitizeForAIPrompt(w.area, 20)}m², ${sanitizeForAIPrompt(w.depth, 20)}mm depth)`).join('\n') || "No work details provided."}
    - Crew: ${report.sgaDailyReport.labour.length} personnel on site.
    - Key Events & Issues:
      - Site Instructions: ${sanitizeForAIPrompt(report.sgaDailyReport.siteInstructions || 'None', 500)}
      - Other Comments (Weather, Breakdowns, Delays): ${sanitizeForAIPrompt(report.sgaDailyReport.otherComments || 'None', 500)}
      - Corrector Used: ${sanitizeForAIPrompt(report.sgaDailyReport.correctorUsed, 10)}

    **2. Asphalt Placement Summary:**
    - Total Tonnes Placed: ${report.asphaltPlacement.placements.reduce((acc, p) => acc + (parseFloat(p.tonnes) || 0), 0)} tonnes.
    - Placement & Conformance Details:
      ${formatTable(
        ['Docket #', 'Tonnes', 'Incoming Temp', 'Placement Temp', 'Temps Compliant', 'Details Match Spec'],
        report.asphaltPlacement.placements
      )}

    **3. ITP Checklist Summary:**
    ${getItpSummary(report.itpChecklist)}

    **Instruction:**
    Synthesize all the information above into a brief, easy-to-read executive summary. Highlight total tonnage, any reported ITP or temperature compliance issues, use of corrector, delays, or significant site events.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: getExpertSystemInstruction('summary'),
      },
    });

    return response.text ?? "Automated summary could not be generated at this time.";
  } catch (error: any) {
    console.error("Error summarizing report with Gemini:", error);
    // Error is now handled by the background task in submit-report.ts
    // We re-throw it so the calling function knows it failed.
    throw error;
  }
};