/**
 * Evening Summary Cron Job
 * 
 * Runs daily at 4:00 PM Perth time (08:00 UTC)
 * Sends a technical summary of all QA packs submitted today
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { QAPacksData } from '../_lib/sharepointData.js';
import { generateEveningSummary } from '../_lib/aiService.js';
import { sendManagementUpdate } from '../_lib/teams.js';
import { handleApiError } from '../_lib/errors.js';
import type { FinalQaPack, AsphaltPlacementRow, ItpChecklistSection, ItpChecklistItem } from '../../src/types.js';

const getTodayPerth = () => {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Australia/Perth' });
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verify cron secret
  if (process.env.CRON_SECRET && req.headers['x-vercel-cron-secret'] !== process.env.CRON_SECRET) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const today = getTodayPerth();

    // Get all submitted reports from SharePoint
    const allReports = await QAPacksData.getAll() as FinalQaPack[];

    // Filter for today's submitted reports
    const todaysReports: FinalQaPack[] = allReports.filter((report: FinalQaPack) =>
      report.timestamp &&
      new Date(report.timestamp).toLocaleDateString('en-CA', { timeZone: 'Australia/Perth' }) === today
    );

    if (todaysReports.length === 0) {
      return res.status(200).json({ message: 'No submitted reports for today to summarize.' });
    }

    // Prepare detailed context for AI
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

    // Generate AI summary
    const summary = await generateEveningSummary(reportDetails, today);
    
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
