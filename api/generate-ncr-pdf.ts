// api/generate-ncr-pdf.ts
/**
 * Business Logic Flow: NCR PDF Generation
 * 1.  An authenticated Admin requests a PDF for a specific NCR.
 * 2.  The NCR data is fetched from SharePoint.
 * 3.  The data is rendered into an HTML print view using a React component.
 * 4.  A headless browser (Puppeteer) converts the HTML into a PDF document.
 * 5.  The PDF is named according to the standardized format (e.g., SGA-2025-NCR-001.pdf).
 * 6.  The generated PDF is streamed directly to the user for download.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { NCRsData } from './_lib/sharepointData.js';
import { NonConformanceReport, Role } from '../src/types.js';
import { withAuth, AuthenticatedRequest } from './_lib/auth.js';
import { handleApiError } from './_lib/errors.js';
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
import ReactDOMServer from 'react-dom/server';
import React from 'react';
import NcrPrintView from './_lib/NcrPrintView.js';

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
    const { ncrId } = req.query;
    if (!ncrId || typeof ncrId !== 'string') {
        return res.status(400).json({ message: 'NCR ID is required.' });
    }

    let browser = null;
    try {
        // Fetch NCR from SharePoint
        const ncr = await NCRsData.getById(ncrId);
        if (!ncr) {
            return res.status(404).json({ message: 'NCR not found.' });
        }

        const reportHtml = ReactDOMServer.renderToStaticMarkup(React.createElement(NcrPrintView, { report: ncr }));
        const fullHtml = `<!DOCTYPE html><html><head><title>NCR - ${ncr.ncrId}</title><meta charset="utf-8" /></head><body>${reportHtml}</body></html>`;

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
            footerTemplate: `<div style="font-size: 8pt; width: 100%; padding: 8px 15mm; color: #6b7280; display: flex; justify-content: space-between; align-items: center; box-sizing: border-box; border-top: 1px solid #e5e7eb;">
                <span style="flex: 0 0 33%; text-align: left;">Doc ID: ${ncr.ncrId} v1.0</span>
                <span style="flex: 0 0 34%; text-align: center;">Printed copies are uncontrolled documents</span>
                <span style="flex: 0 0 33%; text-align: right;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
            </div>`
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${ncr.ncrId}.pdf"`);
        res.send(pdfBuffer);

    } catch (error: any) {
        await handleApiError({
            res,
            error,
            title: 'NCR PDF Generation Failure',
            context: { ncrId, authenticatedUserId: req.user.id },
        });
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

const authorizedRoles: Role[] = ['asphalt_engineer', 'profiling_engineer', 'spray_admin', 'management_admin', 'hseq_manager'];
export default withAuth(handler, authorizedRoles);