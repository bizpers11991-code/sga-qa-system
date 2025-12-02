// api/_lib/jobSheetHandler.ts
import { Buffer } from 'buffer';
import { Job } from '../../src/types.js';
import { uploadFile } from './sharepointFiles.js';
import { sendJobSheetNotification } from './teams.js';
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
import ReactDOMServer from 'react-dom/server';
import React from 'react';
import { handleApiError } from './errors.js';
import JobSheetPrintView from './JobSheetPrintView.js';


const uploadPdf = async (
    key: string,
    body: Buffer,
): Promise<string> => {
    return await uploadFile(key, body, 'application/pdf');
};


export const generateAndSendJobSheetPdf = async (job: Job): Promise<void> => {
    if (!job.jobSheetData) {
        console.log(`Skipping PDF generation for job ${job.jobNo} as it has no job sheet data.`);
        return;
    }
    
    let browser = null;
    try {
        const timestamp = new Date().toISOString();
        const datePath = timestamp.split('T')[0];

        // 1. Render React component to HTML
        const reportHtml = ReactDOMServer.renderToStaticMarkup(React.createElement(JobSheetPrintView, { job }));
        const fullHtml = `<!DOCTYPE html><html><head><title>Job Sheet - ${job.jobNo}</title><meta charset="utf-8" /></head><body>${reportHtml}</body></html>`;

        // 2. Launch Puppeteer to generate PDF
        // FIX: The type definitions for @sparticuz/chromium and puppeteer-core appear to be outdated.
        // `chromium.defaultViewport` and `chromium.headless` are valid runtime properties missing from the types.
        // `ignoreHTTPSErrors` is a valid launch option missing from the `LaunchOptions` type.
        // Casting `chromium` to `any` and the options object to `any` bypasses these type checks.
        browser = await puppeteer.launch({
            args: chromium.args,
            defaultViewport: (chromium as any).defaultViewport,
            executablePath: await chromium.executablePath(),
            headless: (chromium as any).headless,
            ignoreHTTPSErrors: true,
        } as any);
        const page = await browser.newPage();
        await page.setContent(fullHtml, { waitUntil: 'networkidle0' });
        
        const pdfBuffer = await page.pdf({ 
            format: 'A4', 
            printBackground: true, 
            margin: { top: '1.5cm', right: '1.5cm', bottom: '2cm', left: '1.5cm' },
            displayHeaderFooter: true,
            headerTemplate: '<div></div>',
            footerTemplate: `<div style="font-size: 8px; width: 100%; padding: 0 1.5cm; color: #4a5568; display: flex; justify-content: space-between; align-items: center; box-sizing: border-box;">
                <span style="flex: 1; text-align: left;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
                <span style="flex: 1; text-align: center;">Printed copies are uncontrolled documents</span>
                <span style="flex: 1;"></span>
            </div>`
        });

        // 3. Upload PDF to SharePoint
        const pdfKey = `job-sheets/${datePath}/${job.jobNo}_${timestamp}.pdf`;
        const pdfUrl = await uploadPdf(pdfKey, Buffer.from(pdfBuffer));

        // 4. Send notification to Discord
        await sendJobSheetNotification(job, pdfUrl);

    } catch (error: any) {
        console.error(`Failed during job sheet PDF generation/notification for ${job.jobNo}:`, error);
        // This is a background task, so we send an error notification instead of throwing
        await handleApiError({
            error: error,
            title: 'Job Sheet PDF/Notification Failure',
            context: { JobNo: job.jobNo },
        });
    } finally {
        if (browser) {
            await browser.close();
        }
    }
};