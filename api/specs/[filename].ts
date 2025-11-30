/**
 * API endpoint to serve specification PDF files
 * GET /api/specs/:filename
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Map of specification filenames to their locations
const SPEC_FILES: Record<string, string> = {
  // Specifications
  'IPWEA_AfPA_Asphalt_Specification.pdf': 'docs/Specifications and Test Methods/Specifications/IPWEA_AfPA_Asphalt_Specification.pdf',
  'specification-201-quality-management.pdf': 'docs/Specifications and Test Methods/Specifications/specification-201-quality-management.pdf',
  'specification-501-pavements-doc.pdf': 'docs/Specifications and Test Methods/Specifications/specification-501-pavements-doc.pdf',
  'specification-502-stone-mastic-asphalt.pdf': 'docs/Specifications and Test Methods/Specifications/specification-502-stone-mastic-asphalt.pdf',
  'specification-503-bituminous-surfacing.pdf': 'docs/Specifications and Test Methods/Specifications/specification-503-bituminous-surfacing.pdf',
  'specification-504-asphalt-wearing-course.pdf': 'docs/Specifications and Test Methods/Specifications/specification-504-asphalt-wearing-course.pdf',
  'specification-505-segmental-paving.pdf': 'docs/Specifications and Test Methods/Specifications/specification-505-segmental-paving.pdf',
  'specification-506-enrichment-seals.pdf': 'docs/Specifications and Test Methods/Specifications/specification-506-enrichment-seals.pdf',
  'specification-507-microsurfacing.pdf': 'docs/Specifications and Test Methods/Specifications/specification-507-microsurfacing.pdf',
  'specification-508-cold-planing.pdf': 'docs/Specifications and Test Methods/Specifications/specification-508-cold-planing.pdf',
  'specification-509-polymer-modified-bituminous-surfacing.pdf': 'docs/Specifications and Test Methods/Specifications/specification-509-polymer-modified-bituminous-surfacing.pdf',
  'specification-510-asphalt-intermediate-course.pdf': 'docs/Specifications and Test Methods/Specifications/specification-510-asphalt-intermediate-course.pdf',
  'specification-511-materials-for-bituminous-treatments.pdf': 'docs/Specifications and Test Methods/Specifications/specification-511-materials-for-bituminous-treatments.pdf',
  'specification-515-in-situ-stabilisation-of-pavement-materials.pdf': 'docs/Specifications and Test Methods/Specifications/specification-515-in-situ-stabilisation-of-pavement-materials.pdf',
  'specification-516-crumb-rubber-open-graded-asphalt-pdf.pdf': 'docs/Specifications and Test Methods/Specifications/specification-516-crumb-rubber-open-graded-asphalt-pdf.pdf',
  'specification-517-crumb-rubber-gap-graded-asphalt-pdf.pdf': 'docs/Specifications and Test Methods/Specifications/specification-517-crumb-rubber-gap-graded-asphalt-pdf.pdf',

  // Test Methods
  'ATM-453-22_Surface_Deviation_Using_Straightedge_v1.1.pdf': 'docs/Specifications and Test Methods/Test Methods/ATM-453-22_Surface_Deviation_Using_Straightedge_v1.1.pdf',
  'assessment-of-liquid-adhesion-agents.pdf': 'docs/Specifications and Test Methods/Test Methods/assessment-of-liquid-adhesion-agents.pdf',
  'bulk-density-and-void-content-of-asphalt.pdf': 'docs/Specifications and Test Methods/Test Methods/bulk-density-and-void-content-of-asphalt.pdf',
  'bulk-density-and-void-content-of-asphalt-vacuum-sealing-method.pdf': 'docs/Specifications and Test Methods/Test Methods/bulk-density-and-void-content-of-asphalt-vacuum-sealing-method.pdf',
  'density-of-bituminous-materials-and-oils.pdf': 'docs/Specifications and Test Methods/Test Methods/density-of-bituminous-materials-and-oils.pdf',
  'determination-of-bitumen-durability-using-a-dynamic-shear-rheometer-dsr.pdf': 'docs/Specifications and Test Methods/Test Methods/determination-of-bitumen-durability-using-a-dynamic-shear-rheometer-dsr.pdf',
  'determination-of-the-density-of-thin-polythene-plastic-film.pdf': 'docs/Specifications and Test Methods/Test Methods/determination-of-the-density-of-thin-polythene-plastic-film.pdf',
  'dispersion-of-bitumen-in-soil.pdf': 'docs/Specifications and Test Methods/Test Methods/dispersion-of-bitumen-in-soil.pdf',
  'maximum-density-of-asphalt-rice-method.pdf': 'docs/Specifications and Test Methods/Test Methods/maximum-density-of-asphalt-rice-method.pdf',
  'preparation-of-asphalt-for-testing.pdf': 'docs/Specifications and Test Methods/Test Methods/preparation-of-asphalt-for-testing.pdf',
  'sampling-and-storage-of-asphalt.pdf': 'docs/Specifications and Test Methods/Test Methods/sampling-and-storage-of-asphalt.pdf',
  'sampling-procedures-for-bitumen-and-oils.pdf': 'docs/Specifications and Test Methods/Test Methods/sampling-procedures-for-bitumen-and-oils.pdf',
  'stability-and-flow-of-asphalt-marshall-method.pdf': 'docs/Specifications and Test Methods/Test Methods/stability-and-flow-of-asphalt-marshall-method.pdf',
  'stone-coating-and-water-resistance-test-cationic-bituminous-emulsions.pdf': 'docs/Specifications and Test Methods/Test Methods/stone-coating-and-water-resistance-test-cationic-bituminous-emulsions.pdf',
  'wa-730.1-bitumen-content-and-particle-size-distribution-of-asphalt-and-stabilised-soil-centrifuge.pdf': 'docs/Specifications and Test Methods/Test Methods/wa-730.1-bitumen-content-and-particle-size-distribution-of-asphalt-and-stabilised-soil-centrifuge.pdf',
  'wa-730.2-bitumen-content-and-particle-size-distribution-of-asphalt-ignition-oven-method.pdf': 'docs/Specifications and Test Methods/Test Methods/wa-730.2-bitumen-content-and-particle-size-distribution-of-asphalt-ignition-oven-method.pdf',
};

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { filename } = req.query;

  if (!filename || typeof filename !== 'string') {
    return res.status(400).json({ error: 'Filename is required' });
  }

  // Sanitize filename to prevent directory traversal
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '');

  // Check if file exists in our whitelist
  const filePath = SPEC_FILES[sanitizedFilename];

  if (!filePath) {
    return res.status(404).json({
      error: 'File not found',
      available: Object.keys(SPEC_FILES)
    });
  }

  try {
    // In Vercel serverless environment, files are relative to project root
    const fullPath = join(process.cwd(), filePath);

    // Check if file exists
    if (!existsSync(fullPath)) {
      console.error(`File not found at path: ${fullPath}`);
      return res.status(404).json({
        error: 'File not found on server',
        path: filePath
      });
    }

    // Read the file
    const fileBuffer = readFileSync(fullPath);

    // Set appropriate headers for PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${sanitizedFilename}"`);
    res.setHeader('Content-Length', fileBuffer.length);
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours

    return res.send(fileBuffer);
  } catch (error) {
    console.error('Error serving file:', error);
    return res.status(500).json({
      error: 'Failed to serve file',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
