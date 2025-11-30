/**
 * Morning Lookahead Cron Job
 * 
 * Runs daily at 7:00 AM Perth time (23:00 UTC previous day)
 * Sends a summary of today's scheduled jobs to Teams
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { JobsData } from '../_lib/sharepointData.js';
import { generateMorningLookahead } from '../_lib/aiService.js';
import { sendManagementUpdate } from '../_lib/teams.js';
import { handleApiError } from '../_lib/errors.js';

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

    // Get all jobs from SharePoint
    const allJobs = await JobsData.getAll();

    if (allJobs.length === 0) {
      return res.status(200).json({ message: 'No jobs found to analyze.' });
    }

    // Filter jobs scheduled for today
    const todaysJobs = allJobs.filter(job => job.jobDate === today);

    if (todaysJobs.length === 0) {
      await sendManagementUpdate(
        `Morning Lookahead for ${today}`,
        "No jobs are scheduled for today.",
        [{ name: "Total Jobs", value: "0" }]
      );
      return res.status(200).json({ message: 'No jobs scheduled for today.' });
    }

    // Generate AI summary
    const summary = await generateMorningLookahead(todaysJobs, today);
    
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
