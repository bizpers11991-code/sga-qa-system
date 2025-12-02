// api/generate-sampling-pdf.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { SamplingPlansData } from './_lib/sharepointData.js';
import { SamplingPlan } from '../src/types.js';
import { withAuth, AuthenticatedRequest } from './_lib/auth.js';
import { handleApiError } from './_lib/errors.js';
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
import ReactDOMServer from 'react-dom/server';
import React from 'react';
import SamplingPlanPrintView from './_lib/SamplingPlanPrintView.js';

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
    const { planId } = req.query;
    if (!planId || typeof planId !== 'string') {
        return res.status(400).json({ message: 'Sampling Plan ID is required.' });
    }

    let browser = null;
    try {
        // Fetch sampling plan from SharePoint
        const plan = await SamplingPlansData.getById(planId);
        if (!plan) {
            return res.status(404).json({ message: 'Sampling plan not found.' });
        }

        const reportHtml = ReactDOMServer.renderToStaticMarkup(React.createElement(SamplingPlanPrintView, { plan }));
        const fullHtml = `<!DOCTYPE html><html><head><title>Sampling Plan - ${plan.jobNo}</title><meta charset="utf-8" /></head><body>${reportHtml}</body></html>`;

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
                <span style="flex: 0 0 33%; text-align: left;">Doc ID: SP-${plan.jobNo}-L${plan.lotNo} v1.0</span>
                <span style="flex: 0 0 34%; text-align: center;">Printed copies are uncontrolled documents</span>
                <span style="flex: 0 0 33%; text-align: right;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
            </div>`
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="Sampling-Plan-${plan.jobNo}-Lot-${plan.lotNo}.pdf"`);
        res.send(pdfBuffer);

    } catch (error: any) {
        await handleApiError({
            res,
            error,
            title: 'Sampling Plan PDF Generation Failure',
            context: { planId, authenticatedUserId: req.user.id },
        });
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

export default withAuth(handler, ['asphalt_engineer']);