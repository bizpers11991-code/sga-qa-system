// api/submit-report.ts
/**
 * Business Logic Flow: QA Pack Submission
 * 1.  An authenticated Foreman or Admin submits a completed QA Pack.
 * 2.  The system performs a security check to ensure the user has permission to submit for the given job.
 * 3.  All attached images (biometric photo, site photos, damage photos) are uploaded to secure cloud storage (R2).
 * 4.  The application data is rendered into an HTML view and then converted into a PDF using a headless browser (Puppeteer).
 * 5.  The generated PDF is named according to the format: SGA-[JobNo]-[ProjectName]-QAPack.pdf.
 * 6.  The PDF is uploaded to cloud storage.
 * 7.  The final report metadata (with URLs to assets, minus large base64 data) is saved to the database (Redis), versioning it if a previous submission exists.
 * 8.  An immediate success response is sent to the user.
 * 9.  In the background, the system sends notifications to relevant MS Teams channels and triggers an AI summary generation.
 */
import { Buffer } from 'buffer';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getR2Config } from './_lib/r2.js';
import { getRedisInstance } from './_lib/redis.js';
import { generateReportSummary } from './_lib/gemini.js';
import { sendSummaryNotification, sendQAPackNotification, sendBiosecurityNotification } from './_lib/teams.js';
import { FinalQaPack, SitePhoto, DamagePhoto, JobSheetImage, Role, SecureForeman, isAdminRole } from '../types.js';
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
import ReactDOMServer from 'react-dom/server';
import React from 'react';
import ReportPrintView from './_lib/ReportPrintView.js';
import { LATEST_SCHEMA_VERSION } from './_lib/migration.js';
import { withAuth, AuthenticatedRequest } from './_lib/auth.js';
import { handleApiError } from './_lib/errors.js';


const base64ToBuffer = (base64: string): Buffer => {
  const match = base64.match(/^data:(.+);base64,(.+)$/);
  if (!match) {
    // If no prefix, assume it's just the base64 part
    return Buffer.from(base64, 'base64');
  }
  return Buffer.from(match[2], 'base64');
};

const uploadAsset = async (
    r2: ReturnType<typeof getR2Config>, 
    key: string, 
    body: Buffer, 
    contentType: string
): Promise<string> => {
    const command = new PutObjectCommand({
        Bucket: r2.bucketName,
        Key: key,
        Body: body,
        ContentType: contentType,
    });
    // FIX: The S3Client type was not resolving correctly, causing a 'send does not exist' error.
    // Following the pattern in other API files (e.g., submit-incident), casting to 'any'
    // bypasses the incorrect type check and allows the code to compile.
    await (r2.client as any).send(command);
    return `${r2.publicUrl}/${key}`;
};

// Asynchronous background task for automated analysis
const processAutomatedAnalysis = async (report: FinalQaPack) => {
    const redis = getRedisInstance();
    const historyKey = `history:${report.job.jobNo}`;
    let updatedReport = { ...report };

    try {
        const summary = await generateReportSummary(updatedReport);
        updatedReport.expertSummary = summary;
        updatedReport.expertSummaryStatus = 'completed';

        // Update the latest report in Redis with the summary
        await redis.lset(historyKey, 0, JSON.stringify(updatedReport));
        
        // Send summary notification now that it's complete
        await sendSummaryNotification(updatedReport, summary);

    } catch (aiError: any) {
        console.error('Automated analysis failed:', aiError);
        updatedReport.expertSummaryStatus = 'failed';
        updatedReport.expertSummary = 'Automated summary generation failed. Please try again later.';
        await redis.lset(historyKey, 0, JSON.stringify(updatedReport));
        // Use the centralized error handler to report this background failure
        await handleApiError({
            error: aiError,
            title: 'Expert Summary Failure (background task)',
            context: { JobNo: report.job.jobNo },
        });
    }
};


async function handler(req: AuthenticatedRequest, res: VercelResponse) {
    let report: FinalQaPack = req.body;

    try {
        const { user } = req;
        const isAdmin = isAdminRole(user.role);

        // Security hardening: A foreman can only submit a report for a job assigned to them.
        // Admins can submit for any job (e.g., if they are editing/finalizing a report).
        if (!isAdmin && report.job.foremanId !== user.id) {
            return res.status(403).json({ message: 'Forbidden: You can only submit reports for jobs assigned to you.' });
        }

        const r2 = getR2Config();
        const redis = getRedisInstance();
        const timestamp = new Date().toISOString();
        const datePath = timestamp.split('T')[0]; // YYYY-MM-DD

        // --- 1. Handle File Uploads to R2 ---
        const { foremanPhoto, sitePhotos, damagePhotos, job, jobSheet } = report;
        const jobNo = job.jobNo;

        if (foremanPhoto) {
            const buffer = base64ToBuffer(foremanPhoto);
            const key = `biosecurity/${datePath}/${jobNo}_${timestamp}.jpeg`;
            report.foremanPhotoUrl = await uploadAsset(r2, key, buffer, 'image/jpeg');
        }

        if (sitePhotos?.length > 0) {
            report.sitePhotoUrls = await Promise.all(
                sitePhotos.map(async (photo: SitePhoto, index: number) => {
                    const buffer = base64ToBuffer(photo.data);
                    const key = `site-photos/${datePath}/${jobNo}_${index}_${timestamp}.jpeg`;
                    return await uploadAsset(r2, key, buffer, 'image/jpeg');
                })
            );
        }
        
        if (damagePhotos?.length > 0) {
            report.damagePhotoUrls = await Promise.all(
                damagePhotos.map(async (photo: DamagePhoto, index: number) => {
                    const buffer = base64ToBuffer(photo.data);
                    const key = `damage-photos/${datePath}/${jobNo}_${index}_${timestamp}.jpeg`;
                    return await uploadAsset(r2, key, buffer, 'image/jpeg');
                })
            );
        }

        if (jobSheet?.jobSheetImages && jobSheet.jobSheetImages.length > 0) {
            report.jobSheetImageUrls = await Promise.all(
                jobSheet.jobSheetImages.map(async (photo: JobSheetImage, index: number) => {
                    const buffer = base64ToBuffer(photo.data);
                    const key = `job-sheet-images/${datePath}/${jobNo}_${index}_${timestamp}.jpeg`;
                    return await uploadAsset(r2, key, buffer, 'image/jpeg');
                })
            );
        }

        // --- 2. Generate PDF ---
        let browser = null;
        try {
            const reportHtml = ReactDOMServer.renderToStaticMarkup(React.createElement(ReportPrintView, { report }));
            // FIX: Removed the unnecessary and potentially problematic Tailwind CDN script.
            // The ReportPrintView component is self-contained and provides its own inline styles.
            // This change makes PDF generation more reliable by removing an external network dependency.
            const fullHtml = `
                <!DOCTYPE html>
                <html>
                    <head>
                        <title>QA Pack - ${report.job.jobNo}</title>
                        <meta charset="utf-8" />
                    </head>
                    <body>${reportHtml}</body>
                </html>
            `;
            
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
            await page.setContent(fullHtml, { waitUntil: 'networkidle0', timeout: 30000 });
            
            const pdfBuffer = await page.pdf({
                format: 'A4',
                printBackground: true,
                margin: { top: '0mm', right: '0mm', bottom: '15mm', left: '0mm' },
                timeout: 60000,
                displayHeaderFooter: true,
                headerTemplate: '<div></div>',
                footerTemplate: `<div style="font-size: 8pt; width: 100%; padding: 8px 15mm; color: #6b7280; text-align: center; box-sizing: border-box; border-top: 1px solid #e5e7eb;">
                    <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span> | Printed copies are uncontrolled documents</span>
                </div>`
            });

            // Standardized naming convention
            const sanitizedProjectName = (job.projectName || 'Project').replace(/[^a-zA-Z0-9-_\s]/g, '').replace(/\s+/g, '-');
            const pdfKey = `qa-packs/${datePath}/SGA-${jobNo}-${sanitizedProjectName}-QAPack.pdf`;
            report.pdfUrl = await uploadAsset(r2, pdfKey, Buffer.from(pdfBuffer), 'application/pdf');
        } finally {
            if (browser) await browser.close();
        }
        
        // --- 3. Save CRITICAL DATA to Redis (Versioning) ---
        const historyKey = `history:${jobNo}`;
        const currentLength = await redis.llen(historyKey);
        report.version = currentLength + 1;
        report.timestamp = timestamp;
        report.expertSummaryStatus = 'pending'; // Set initial status
        report.schemaVersion = LATEST_SCHEMA_VERSION; // Stamp with the latest version
        
        // Clean up large base64 data before saving to DB
        delete report.foremanPhoto;
        if(report.sitePhotos) report.sitePhotos = [];
        if(report.damagePhotos) report.damagePhotos = [];
        if(report.jobSheet.jobSheetImages) report.jobSheet.jobSheetImages = [];
        delete report.pdfData;
        delete report.expertSummary; // Summary will be added later
        
        await redis.lpush(historyKey, JSON.stringify(report));
        await redis.sadd('reports:index', jobNo);
        
        // --- 4. RESPOND TO USER IMMEDIATELY ---
        // The foreman's report is now safely stored.
        res.status(200).json({ message: 'Report submitted successfully!', report });

        // --- 5. Asynchronous Analysis & Notifications ---
        // This part runs in the background after the response has been sent.
        // Vercel keeps the function alive for a short period to complete these tasks.
        await sendQAPackNotification(report);
        await sendBiosecurityNotification(report);
        await processAutomatedAnalysis(report); // This will handle its own errors and notifications

    } catch (error: any) {
        await handleApiError({
            res,
            error,
            title: 'Report Submission Failure',
            context: {
                JobNo: report.job?.jobNo || 'Unknown',
                Foreman: report.submittedBy || 'Unknown',
                authenticatedUserId: req.user.id
            }
        });
    }
}

// Apply authentication middleware to the handler.
// This ensures only authorized users (foremen and admins) can submit reports.
const authorizedRoles: Role[] = [
    'asphalt_foreman', 'profiling_foreman', 'spray_foreman',
    'asphalt_engineer', 'profiling_engineer', 'spray_admin',
    'management_admin', 'scheduler_admin', 'hseq_manager'
];

export default withAuth(handler, authorizedRoles);