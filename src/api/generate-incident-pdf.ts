// api/generate-incident-pdf.ts
/**
 * Business Logic Flow: Incident Report PDF Generation
 * 1.  An authenticated user requests a PDF for a specific incident.
 * 2.  The system verifies the user has permission to view the requested report.
 * 3.  The incident data is fetched from the database (Redis).
 * 4.  The data is rendered into an HTML print view using a React component.
 * 5.  A headless browser (Puppeteer) converts the HTML into a PDF document.
 * 6.  The PDF is named according to the standardized format (e.g., SGA-2025-Incident-001.pdf).
 * 7.  The generated PDF is streamed directly to the user for download.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getRedisInstance } from './_lib/redis.js';
import { IncidentReport, SecureForeman } from '../types.js';
import { withAuth, AuthenticatedRequest } from './_lib/auth.js';
import { handleApiError } from './_lib/errors.js';
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
import ReactDOMServer from 'react-dom/server';
import React from 'react';
import IncidentReportPrintView from './_lib/IncidentReportPrintView.js';

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { incidentId } = req.query;
    if (!incidentId || typeof incidentId !== 'string') {
        return res.status(400).json({ message: 'Incident ID is required.' });
    }

    let browser = null;
    try {
        const redis = getRedisInstance();
        const { user } = req;

        // Fetch incident data
        const incidentJson = await redis.get(`incident:${incidentId}`);
        if (!incidentJson) {
            return res.status(404).json({ message: 'Incident report not found.' });
        }
        const incident: IncidentReport = JSON.parse(incidentJson as string);

        // Authorization check: User must be an admin/manager OR the original reporter
        const isAdmin = ['asphalt_engineer', 'profiling_engineer', 'spray_admin', 'management_admin', 'hseq_manager'].includes(user.role);
        if (!isAdmin && user.id !== incident.reporterId) {
             return res.status(403).json({ message: 'Forbidden: You do not have permission to view this report.' });
        }
        
        // Render React component to HTML
        const reportHtml = ReactDOMServer.renderToStaticMarkup(React.createElement(IncidentReportPrintView, { report: incident }));
        const fullHtml = `<!DOCTYPE html><html><head><title>Incident Report - ${incident.reportId}</title><meta charset="utf-8" /></head><body>${reportHtml}</body></html>`;

        // Launch Puppeteer
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
            timeout: 30000,
            displayHeaderFooter: true,
            headerTemplate: '<div></div>',
            footerTemplate: `<div style="font-size: 8px; width: 100%; padding: 0 1.5cm; color: #4a5568; display: flex; justify-content: space-between; align-items: center; box-sizing: border-box;">
                <span style="flex: 1; text-align: left;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
                <span style="flex: 1; text-align: center;">Printed copies are uncontrolled documents</span>
                <span style="flex: 1;"></span>
            </div>`
        });

        // Send PDF back to client
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${incident.reportId}.pdf"`);
        res.send(pdfBuffer);

    } catch (error: any) {
        await handleApiError({
            res,
            error,
            title: 'Incident PDF Generation Failure',
            context: { incidentId, authenticatedUserId: req.user.id },
        });
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// Allow all authenticated users to attempt to access this endpoint.
// The handler itself performs fine-grained authorization.
export default withAuth(handler, [
    'asphalt_foreman', 'profiling_foreman', 'spray_foreman',
    'asphalt_engineer', 'profiling_engineer', 'spray_admin',
    'management_admin', 'scheduler_admin', 'hseq_manager'
]);