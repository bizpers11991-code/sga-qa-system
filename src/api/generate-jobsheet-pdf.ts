// api/generate-jobsheet-pdf.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getRedisInstance } from './_lib/redis.js';
import { Job, Role } from '../types';
import { withAuth, AuthenticatedRequest } from './_lib/auth.js';
import { handleApiError } from './_lib/errors.js';
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
import ReactDOMServer from 'react-dom/server';
import React from 'react';
import JobSheetPrintView from './_lib/JobSheetPrintView.js';
import { hydrateObjectFromRedisHash } from './_lib/utils.js';
import { migrateJob, migrateJobSheet } from './_lib/migration.js';

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
    const { jobId } = req.query;
    if (!jobId || typeof jobId !== 'string') {
        return res.status(400).json({ message: 'Job ID is required.' });
    }

    let browser = null;
    try {
        const redis = getRedisInstance();

        const jobDataRedis = await redis.hgetall(`job:${jobId}`);
        if (!jobDataRedis) {
            return res.status(404).json({ message: 'Job not found.' });
        }
        const job: Job = migrateJob(hydrateObjectFromRedisHash(jobDataRedis));
        
        const jobSheetDataRedis = await redis.hgetall(`jobsheet:${jobId}`);
        if (jobSheetDataRedis && Object.keys(jobSheetDataRedis).length > 0) {
            job.jobSheetData = migrateJobSheet(hydrateObjectFromRedisHash(jobSheetDataRedis));
        }

        if (!job.jobSheetData) {
            return res.status(404).json({ message: 'Job Sheet data not found for this job.' });
        }

        const reportHtml = ReactDOMServer.renderToStaticMarkup(React.createElement(JobSheetPrintView, { job }));
        const fullHtml = `<!DOCTYPE html><html><head><title>Job Sheet - ${job.jobNo}</title><meta charset="utf-8" /></head><body>${reportHtml}</body></html>`;

        browser = await puppeteer.launch({
            args: chromium.args,
            defaultViewport: (chromium as any).defaultViewport,
            executablePath: await chromium.executablePath(),
            headless: (chromium as any).headless,
            ignoreHTTPSErrors: true,
        } as any);
        
        const page = await browser.newPage();
        await page.setContent(fullHtml, { waitUntil: 'domcontentloaded' });
        
        const pdfBuffer = await page.pdf({ 
            format: 'A4', 
            printBackground: true, 
            margin: { top: '1.5cm', right: '1.5cm', bottom: '2cm', left: '1.5cm' },
            timeout: 30000,
            displayHeaderFooter: true,
            headerTemplate: '<div></div>',
            footerTemplate: `<div style="font-size: 8px; width: 100%; padding: 0 1.5cm; color: #4a5568; display: flex; justify-content: space-between; align-items: center; box-sizing: border-box;">
                <span style="flex: 1; text-align: left;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
                <span style="flex: 1; text-align: center;">Printed copies are uncontrolled documents</span>
                <span style="flex: 1;"></span>
            </div>`
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="Job-Sheet-${job.jobNo || job.id}.pdf"`);
        res.send(pdfBuffer);

    } catch (error: any) {
        await handleApiError({
            res,
            error,
            title: 'Job Sheet PDF Generation Failure',
            context: { jobId, authenticatedUserId: req.user.id },
        });
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

const authorizedRoles: Role[] = ['asphalt_engineer', 'profiling_engineer', 'spray_admin', 'management_admin', 'scheduler_admin', 'hseq_manager'];
export default withAuth(handler, authorizedRoles);