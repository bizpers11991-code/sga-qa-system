# PDF Generation & Document Management Guide

## Overview

The SGA QA System includes a comprehensive PDF generation and document management system with professional branding, SharePoint integration, and a complete document library.

## Architecture

### Components

#### 1. PDF Preview Modal (`src/components/pdf/PdfPreviewModal.tsx`)
Modal component for previewing and generating PDFs with:
- Preview of document content before generation
- SGA header and footer preview
- Generate and download buttons
- Loading states
- Generated PDF preview in iframe

**Props:**
```typescript
interface PdfPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  documentType: 'jobsheet' | 'sampling' | 'incident' | 'ncr';
  data: any;
  onGenerate: (data: any) => Promise<Blob>;
}
```

**Usage:**
```tsx
<PdfPreviewModal
  isOpen={showPreview}
  onClose={() => setShowPreview(false)}
  title="Job Sheet"
  documentType="jobsheet"
  data={jobSheetData}
  onGenerate={generateJobSheetPdf}
/>
```

#### 2. SGA PDF Header (`src/components/pdf/SgaPdfHeader.tsx`)
Professional header component with:
- SGA logo
- Document title
- Document ID with amber highlight
- Date in Australian format
- Gradient amber brand bar

**Props:**
```typescript
interface SgaPdfHeaderProps {
  title: string;
  documentId: string;
  date: string;
}
```

#### 3. SGA PDF Footer (`src/components/pdf/SgaPdfFooter.tsx`)
Professional footer component with:
- Company information (ABN, contact details)
- Page numbers
- Generation timestamp
- SGA logo watermark
- Confidentiality notice

**Props:**
```typescript
interface SgaPdfFooterProps {
  pageNumber: number;
  totalPages: number;
}
```

#### 4. Document Library (`src/pages/documents/DocumentLibrary.tsx`)
Complete document management page with:
- Grid view of all documents
- Multiple filters (type, date, job number, search)
- Download and delete actions
- SharePoint sync status
- Refresh functionality
- Delete confirmation dialog

**Features:**
- **Search:** Real-time search by title, document ID, or job number
- **Type Filter:** Filter by document type (Job Sheet, Sampling Plan, Incident, NCR)
- **Date Filter:** Today, Last 7 Days, Last 30 Days, Last Year
- **Job Filter:** Filter by job number
- **Active Filters Summary:** Shows count and allows clearing filters

#### 5. Document Card (`src/components/documents/DocumentCard.tsx`)
Individual document display card with:
- Document thumbnail or placeholder
- Type badge with color coding
- Document metadata (ID, job number, size, date)
- SharePoint sync status indicator
- Download and delete buttons

**Color Coding:**
- Job Sheet: Blue
- Sampling Plan: Green
- Incident Report: Red
- NCR: Amber

### Services

#### 1. PDF API (`src/services/pdfApi.ts`)
Core PDF generation service with TypeScript interfaces and functions:

**Functions:**
```typescript
generateJobSheetPdf(data: JobSheetData): Promise<Blob>
generateSamplingPdf(data: SamplingPlanData): Promise<Blob>
generateIncidentPdf(data: IncidentReportData): Promise<Blob>
generateNcrPdf(data: NcrData): Promise<Blob>
downloadBlob(blob: Blob, filename: string): void
```

**Interfaces:**
- `JobSheetData`: Job details, crew, equipment, materials, quality checks
- `SamplingPlanData`: Sample plan, criteria, locations, testing methods
- `IncidentReportData`: Incident details, severity, witnesses, corrective actions
- `NcrData`: Non-conformance details, root cause, corrective/preventive actions

#### 2. Documents API (`src/services/documentsApi.ts`)
Document management service:

**Functions:**
```typescript
getDocuments(filters?: DocumentFilters): Promise<Document[]>
uploadDocument(file: File, metadata: UploadMetadata): Promise<Document>
getUploadUrl(): Promise<UploadUrlResponse>
confirmUpload(request: ConfirmUploadRequest): Promise<Document>
deleteDocument(id: string): Promise<void>
downloadDocument(document: Document): void
getDocumentTypeLabel(type: Document['type']): string
formatFileSize(bytes: number): string
```

**Interfaces:**
```typescript
interface Document {
  id: string;
  title: string;
  type: 'jobsheet' | 'sampling' | 'incident' | 'ncr';
  documentId: string;
  jobNumber?: string;
  size: number;
  createdAt: string;
  updatedAt: string;
  url: string;
  thumbnailUrl?: string;
  sharePointSynced: boolean;
  sharePointUrl?: string;
  metadata?: Record<string, any>;
}
```

### Utilities

#### PDF Helpers (`src/utils/pdfHelpers.ts`)
Comprehensive utility functions:

**Date Formatting:**
```typescript
formatDateForPdf(date: string | Date, format: 'full' | 'short' | 'long' | 'time'): string
```

**PDF Operations:**
```typescript
addWatermark(doc: any, text: string, options?: WatermarkOptions): void
generatePdfBlob(htmlContent: string): Promise<Blob>
downloadPdf(blob: Blob, filename: string): void
```

**Document Management:**
```typescript
generateDocumentId(prefix: string): string
isValidPdfBlob(blob: Blob): boolean
createPdfFilename(type: string, documentId: string, date?: string | Date): string
```

**PDF Metadata:**
```typescript
createPdfMetadata(options: MetadataOptions): Record<string, string>
```

**Helpers:**
```typescript
sanitizeForPdf(text: string): string
calculateOptimalFontSize(text: string, maxWidth: number, baseFontSize?: number): number
parseTableData(tableHtml: string): Array<Array<string>>
```

## API Integration

### Backend Endpoints

#### PDF Generation
```
POST /api/generate-jobsheet-pdf
POST /api/generate-sampling-pdf
POST /api/generate-incident-pdf
POST /api/generate-ncr-pdf
```

**Request Body Example:**
```json
{
  "jobNumber": "JS-2024-001",
  "date": "2024-01-15",
  "client": "Melbourne Airport",
  "location": "Runway 16/34",
  "description": "Safety grooving on main runway surface"
}
```

**Response:** PDF Blob

#### Document Management
```
GET /api/get-documents?type=jobsheet&dateRange=week&jobNumber=JS-001
POST /api/generate-upload-url
POST /api/confirm-document-upload
DELETE /api/delete-document
```

## Usage Examples

### 1. Generate a Job Sheet PDF

```tsx
import { useState } from 'react';
import PdfPreviewModal from '@/components/pdf/PdfPreviewModal';
import { generateJobSheetPdf, JobSheetData } from '@/services/pdfApi';

function JobSheetPage() {
  const [showPreview, setShowPreview] = useState(false);

  const jobData: JobSheetData = {
    jobNumber: 'JS-2024-001',
    date: '2024-01-15',
    client: 'Melbourne Airport',
    location: 'Runway 16/34',
    description: 'Safety grooving on main runway surface',
    projectManager: 'John Smith',
    crew: ['Mike Johnson', 'Sarah Williams'],
    equipment: ['Grooving Machine A', 'Water Truck B'],
    qualityChecks: [
      { item: 'Groove Depth', passed: true, notes: '3mm uniform' }
    ]
  };

  return (
    <div>
      <button onClick={() => setShowPreview(true)}>
        Generate Job Sheet PDF
      </button>

      <PdfPreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        title="Job Sheet"
        documentType="jobsheet"
        data={jobData}
        onGenerate={generateJobSheetPdf}
      />
    </div>
  );
}
```

### 2. Display Document Library

```tsx
import DocumentLibrary from '@/pages/documents/DocumentLibrary';

// In your router:
<Route path="/documents" element={<DocumentLibrary />} />
```

### 3. Direct PDF Download

```tsx
import { generateJobSheetPdf, downloadBlob } from '@/services/pdfApi';

async function downloadJobSheet(data: JobSheetData) {
  try {
    const blob = await generateJobSheetPdf(data);
    const filename = `jobsheet-${data.jobNumber}.pdf`;
    downloadBlob(blob, filename);
  } catch (error) {
    console.error('Failed to generate PDF:', error);
  }
}
```

### 4. Upload Custom Document

```tsx
import { uploadDocument } from '@/services/documentsApi';

async function handleFileUpload(file: File, jobNumber: string) {
  const metadata = {
    title: file.name,
    type: 'jobsheet',
    documentId: 'JS-2024-001',
    jobNumber: jobNumber,
    size: file.size
  };

  try {
    const document = await uploadDocument(file, metadata);
    console.log('Uploaded:', document);
  } catch (error) {
    console.error('Upload failed:', error);
  }
}
```

### 5. Filter Documents

```tsx
import { getDocuments } from '@/services/documentsApi';

async function loadRecentIncidents() {
  const documents = await getDocuments({
    type: 'incident',
    dateRange: 'month'
  });

  return documents;
}
```

## Styling & Branding

### SGA Color Scheme
- **Primary Amber:** `#F5A524`
- **Hover Amber:** `#E09410`
- **Text on Amber:** White

### PDF Layout
- **Page Size:** A4
- **Margins:** 20mm all sides
- **Header Height:** ~80px
- **Footer Height:** ~100px
- **Font:** Arial/Helvetica family

### Component Classes
```css
/* Amber buttons */
.bg-[#F5A524] hover:bg-[#E09410]

/* Document type badges */
.bg-blue-100 .text-blue-800  /* Job Sheet */
.bg-green-100 .text-green-800 /* Sampling */
.bg-red-100 .text-red-800     /* Incident */
.bg-amber-100 .text-amber-800 /* NCR */
```

## Best Practices

### 1. Data Validation
Always validate data before generating PDFs:
```typescript
if (!data.jobNumber || !data.date) {
  throw new Error('Required fields missing');
}
```

### 2. Error Handling
Wrap PDF generation in try-catch blocks:
```typescript
try {
  const blob = await generateJobSheetPdf(data);
  // Handle success
} catch (error) {
  console.error('PDF generation failed:', error);
  // Show user-friendly error message
}
```

### 3. Loading States
Always show loading indicators during generation:
```tsx
{isGenerating && <Loader2 className="animate-spin" />}
```

### 4. Cleanup
Clean up blob URLs after use:
```typescript
useEffect(() => {
  return () => {
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
  };
}, [pdfUrl]);
```

### 5. File Naming
Use consistent naming conventions:
```typescript
const filename = `${type}-${documentId}-${date}.pdf`;
```

## SharePoint Integration

Documents can be synced to SharePoint:
- **Sync Status:** Shown on document cards
- **Status Indicators:**
  - ✓ Green: Synced successfully
  - ⏱ Yellow: Sync pending
  - ✗ Gray: Not synced

## Troubleshooting

### PDF Generation Fails
- Check backend API is running
- Verify data structure matches interfaces
- Check browser console for errors
- Ensure required fields are present

### Document Upload Fails
- Verify file size is within limits
- Check upload URL hasn't expired
- Ensure metadata is complete

### Preview Not Showing
- Check modal `isOpen` prop
- Verify data is passed correctly
- Check browser console for errors

## Future Enhancements

1. **Thumbnail Generation:** Automatic PDF thumbnail creation
2. **Batch Operations:** Multi-document download/delete
3. **Advanced Search:** Full-text search in documents
4. **Version Control:** Document revision tracking
5. **Templates:** Custom PDF templates per client
6. **Digital Signatures:** Sign documents electronically
7. **Email Integration:** Send documents via email
8. **Print Queue:** Batch printing functionality

## Support

For issues or questions:
- Check browser console for errors
- Verify all dependencies are installed
- Review TypeScript interfaces for data structure
- Test with example data from `PdfGenerationExample.tsx`
