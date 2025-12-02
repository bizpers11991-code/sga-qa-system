// api/generate-scope-report-pdf.ts
/**
 * Business Logic Flow: Scope Report PDF Generation
 * 1.  An authenticated user requests a PDF for a specific scope report.
 * 2.  The scope report data is fetched from SharePoint.
 * 3.  The data is rendered into an HTML print view using a React component.
 * 4.  A headless browser (Puppeteer) converts the HTML into a PDF document.
 * 5.  The PDF is named according to the standardized format (e.g., SCR-2025-001-01.pdf).
 * 6.  The generated PDF is streamed directly to the user for download.
 */
import type { VercelResponse } from '@vercel/node';
import { ScopeReportsData } from './_lib/sharepointData.js';
import { withAuth, AuthenticatedRequest } from './_lib/auth.js';
import { handleApiError, NotFoundError } from './_lib/errors.js';
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
import ReactDOMServer from 'react-dom/server';
import React from 'react';
import ScopeReportPrintView from './_lib/ScopeReportPrintView.js';

async function handler(
  request: AuthenticatedRequest,
  response: VercelResponse
) {
  if (request.method !== 'GET') {
    return response.status(405).json({ message: 'Method Not Allowed' });
  }

  const { id } = request.query;
  if (!id || typeof id !== 'string') {
    throw new NotFoundError('Scope Report', { providedId: id });
  }

  let browser = null;
  try {
    // Fetch scope report from SharePoint
    const report = await ScopeReportsData.getById(id);

    if (!report) {
      throw new NotFoundError('Scope Report', { reportId: id });
    }

    // Render React component to HTML
    const reportHtml = ReactDOMServer.renderToStaticMarkup(
      React.createElement(ScopeReportPrintView, { report })
    );
    const fullHtml = `<!DOCTYPE html><html><head><title>Scope Report - ${report.reportNumber}</title><meta charset="utf-8" /></head><body>${reportHtml}</body></html>`;

    // Launch Puppeteer
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
      timeout: 60000,
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate: `<div style="font-size: 8pt; width: 100%; padding: 8px 15mm; color: #6b7280; display: flex; justify-content: space-between; align-items: center; box-sizing: border-box; border-top: 1px solid #e5e7eb;">
          <span style="flex: 0 0 33%; text-align: left;">Doc ID: ${report.reportNumber} v1.0</span>
          <span style="flex: 0 0 34%; text-align: center;">Printed copies are uncontrolled documents</span>
          <span style="flex: 0 0 33%; text-align: right;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
      </div>`
    });

    // Send PDF back to client
    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader('Content-Disposition', `attachment; filename="Scope_Report_${report.reportNumber}.pdf"`);
    response.send(pdfBuffer);

  } catch (error: any) {
    await handleApiError({
      res: response,
      error,
      title: 'Scope Report PDF Generation Failure',
      context: {
        reportId: request.query.id,
        authenticatedUserId: request.user.id,
      },
    });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Any authenticated user can generate PDF
export default withAuth(handler, [
  'tender_admin',
  'scheduler_admin',
  'management_admin',
  'hseq_manager',
  'asphalt_engineer',
  'profiling_engineer',
  'spray_admin',
  'asphalt_foreman',
  'profiling_foreman',
  'spray_foreman',
]);
