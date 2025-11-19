/**
 * PDF Helper Utilities
 * Functions for PDF generation, formatting, and manipulation
 */

/**
 * Format a date for PDF display
 * @param date - Date string or Date object
 * @param format - Format type: 'full', 'short', 'long', 'time'
 * @returns Formatted date string
 */
export function formatDateForPdf(
  date: string | Date,
  format: 'full' | 'short' | 'long' | 'time' = 'long'
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }

  switch (format) {
    case 'full':
      return dateObj.toLocaleString('en-AU', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    case 'short':
      return dateObj.toLocaleDateString('en-AU', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    case 'long':
      return dateObj.toLocaleDateString('en-AU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    case 'time':
      return dateObj.toLocaleTimeString('en-AU', {
        hour: '2-digit',
        minute: '2-digit',
      });
    default:
      return dateObj.toLocaleDateString('en-AU');
  }
}

/**
 * Add a watermark to a PDF document (conceptual - for jsPDF)
 * @param doc - jsPDF document instance
 * @param text - Watermark text
 * @param options - Watermark options
 */
export function addWatermark(
  doc: any,
  text: string,
  options?: {
    fontSize?: number;
    opacity?: number;
    angle?: number;
    color?: string;
  }
): void {
  const {
    fontSize = 48,
    opacity = 0.1,
    angle = 45,
    color = '#F5A524',
  } = options || {};

  try {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    doc.saveGraphicsState();
    doc.setGState(new doc.GState({ opacity }));
    doc.setTextColor(color);
    doc.setFontSize(fontSize);

    // Calculate center position
    const x = pageWidth / 2;
    const y = pageHeight / 2;

    // Add rotated text in center
    doc.text(text, x, y, {
      angle,
      align: 'center',
    });

    doc.restoreGraphicsState();
  } catch (error) {
    console.error('Error adding watermark:', error);
  }
}

/**
 * Generate a PDF blob from HTML content using browser's print functionality
 * @param htmlContent - HTML string content
 * @returns Promise resolving to PDF Blob
 */
export async function generatePdfBlob(htmlContent: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      // Create hidden iframe
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = 'none';
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) {
        throw new Error('Unable to access iframe document');
      }

      // Write HTML content
      iframeDoc.open();
      iframeDoc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>PDF Document</title>
            <style>
              @page {
                size: A4;
                margin: 20mm;
              }
              body {
                font-family: Arial, sans-serif;
                font-size: 12pt;
                line-height: 1.6;
                color: #333;
              }
              * {
                box-sizing: border-box;
              }
            </style>
          </head>
          <body>
            ${htmlContent}
          </body>
        </html>
      `);
      iframeDoc.close();

      // Wait for content to load
      iframe.onload = () => {
        try {
          // Note: This is a simplified version. In production, you'd use a library
          // like html2pdf.js, jsPDF with html2canvas, or a backend service
          console.warn('Browser print not fully implemented. Use backend service.');
          document.body.removeChild(iframe);
          reject(new Error('Use backend PDF generation service'));
        } catch (error) {
          document.body.removeChild(iframe);
          reject(error);
        }
      };
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Download a PDF blob with a given filename
 * @param blob - PDF Blob to download
 * @param filename - Filename for the download
 */
export function downloadPdf(blob: Blob, filename: string): void {
  try {
    // Ensure filename has .pdf extension
    const pdfFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;

    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = pdfFilename;
    link.style.display = 'none';

    // Trigger download
    document.body.appendChild(link);
    link.click();

    // Cleanup
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 100);
  } catch (error) {
    console.error('Error downloading PDF:', error);
    throw new Error('Failed to download PDF');
  }
}

/**
 * Generate a unique document ID
 * @param prefix - Prefix for the ID (e.g., 'JS', 'SP', 'IR', 'NCR')
 * @returns Unique document ID
 */
export function generateDocumentId(prefix: string): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Validate PDF blob
 * @param blob - Blob to validate
 * @returns True if blob appears to be a valid PDF
 */
export function isValidPdfBlob(blob: Blob): boolean {
  return blob.type === 'application/pdf' && blob.size > 0;
}

/**
 * Get file size in human-readable format
 * @param bytes - File size in bytes
 * @returns Formatted size string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
}

/**
 * Create a filename for a PDF document
 * @param type - Document type
 * @param documentId - Document ID
 * @param date - Optional date
 * @returns Formatted filename
 */
export function createPdfFilename(
  type: string,
  documentId: string,
  date?: string | Date
): string {
  const dateStr = date
    ? formatDateForPdf(date, 'short').replace(/\//g, '-')
    : new Date().toISOString().split('T')[0];

  return `${type}-${documentId}-${dateStr}.pdf`;
}

/**
 * Convert HTML table to PDF-friendly format
 * @param tableHtml - HTML table string
 * @returns Formatted table data
 */
export function parseTableData(tableHtml: string): Array<Array<string>> {
  const parser = new DOMParser();
  const doc = parser.parseFromString(tableHtml, 'text/html');
  const rows = doc.querySelectorAll('tr');

  return Array.from(rows).map((row) => {
    const cells = row.querySelectorAll('td, th');
    return Array.from(cells).map((cell) => cell.textContent?.trim() || '');
  });
}

/**
 * Add page numbers to PDF metadata
 * @param totalPages - Total number of pages
 * @returns Array of page number strings
 */
export function generatePageNumbers(totalPages: number): string[] {
  return Array.from({ length: totalPages }, (_, i) => `Page ${i + 1} of ${totalPages}`);
}

/**
 * Create PDF metadata object
 * @param options - Metadata options
 * @returns PDF metadata object
 */
export function createPdfMetadata(options: {
  title: string;
  subject?: string;
  author?: string;
  keywords?: string[];
  creator?: string;
}): Record<string, string> {
  return {
    title: options.title,
    subject: options.subject || 'SGA Quality Assurance Document',
    author: options.author || 'Safety Grooving Australia',
    keywords: options.keywords?.join(', ') || 'SGA, Quality, Safety',
    creator: options.creator || 'SGA QA System',
    creationDate: new Date().toISOString(),
  };
}

/**
 * Sanitize text for PDF generation
 * @param text - Text to sanitize
 * @returns Sanitized text
 */
export function sanitizeForPdf(text: string): string {
  return text
    .replace(/[^\x20-\x7E\n\r\t]/g, '') // Remove non-printable characters
    .trim();
}

/**
 * Calculate optimal font size for text to fit in given width
 * @param text - Text to measure
 * @param maxWidth - Maximum width in points
 * @param baseFontSize - Base font size
 * @returns Optimal font size
 */
export function calculateOptimalFontSize(
  text: string,
  maxWidth: number,
  baseFontSize: number = 12
): number {
  const estimatedWidth = text.length * (baseFontSize * 0.5);
  if (estimatedWidth <= maxWidth) {
    return baseFontSize;
  }
  return Math.max(8, (maxWidth / estimatedWidth) * baseFontSize);
}

export default {
  formatDateForPdf,
  addWatermark,
  generatePdfBlob,
  downloadPdf,
  generateDocumentId,
  isValidPdfBlob,
  formatFileSize,
  createPdfFilename,
  parseTableData,
  generatePageNumbers,
  createPdfMetadata,
  sanitizeForPdf,
  calculateOptimalFontSize,
};
