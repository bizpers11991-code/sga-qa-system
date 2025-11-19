# PDF Generation System - Quick Reference Card

## 🚀 Quick Start

### Generate a PDF
```tsx
import PdfPreviewModal from '@/components/pdf/PdfPreviewModal';
import { generateJobSheetPdf } from '@/services/pdfApi';

<PdfPreviewModal
  isOpen={true}
  onClose={() => {}}
  title="Job Sheet"
  documentType="jobsheet"
  data={yourData}
  onGenerate={generateJobSheetPdf}
/>
```

### Display Document Library
```tsx
import DocumentLibrary from '@/pages/documents/DocumentLibrary';

<Route path="/documents" element={<DocumentLibrary />} />
```

---

## 📁 File Locations

| Component | Path |
|-----------|------|
| **PDF Preview Modal** | `src/components/pdf/PdfPreviewModal.tsx` |
| **PDF Header** | `src/components/pdf/SgaPdfHeader.tsx` |
| **PDF Footer** | `src/components/pdf/SgaPdfFooter.tsx` |
| **Document Library** | `src/pages/documents/DocumentLibrary.tsx` |
| **Document Card** | `src/components/documents/DocumentCard.tsx` |
| **PDF API** | `src/services/pdfApi.ts` |
| **Documents API** | `src/services/documentsApi.ts` |
| **PDF Helpers** | `src/utils/pdfHelpers.ts` |

---

## 🎨 Color Codes

```css
/* SGA Amber */
Primary: #F5A524
Hover:   #E09410

/* Document Types */
Job Sheet:   Blue   (bg-blue-100)
Sampling:    Green  (bg-green-100)
Incident:    Red    (bg-red-100)
NCR:         Amber  (bg-amber-100)
```

---

## 📝 TypeScript Interfaces

### PDF Data Types
```typescript
import {
  JobSheetData,
  SamplingPlanData,
  IncidentReportData,
  NcrData
} from '@/services/pdfApi';
```

### Document Type
```typescript
import { Document, DocumentFilters } from '@/services/documentsApi';

interface Document {
  id: string;
  title: string;
  type: 'jobsheet' | 'sampling' | 'incident' | 'ncr';
  documentId: string;
  jobNumber?: string;
  size: number;
  createdAt: string;
  url: string;
  sharePointSynced: boolean;
}
```

---

## 🔌 API Endpoints

### PDF Generation
```
POST /api/generate-jobsheet-pdf
POST /api/generate-sampling-pdf
POST /api/generate-incident-pdf
POST /api/generate-ncr-pdf
```
**Returns:** PDF Blob

### Document Management
```
GET    /api/get-documents
POST   /api/generate-upload-url
POST   /api/confirm-document-upload
DELETE /api/delete-document
```

---

## 🛠️ Common Functions

### PDF Generation
```typescript
import { generateJobSheetPdf, downloadBlob } from '@/services/pdfApi';

const blob = await generateJobSheetPdf(data);
downloadBlob(blob, 'filename.pdf');
```

### Document Management
```typescript
import { getDocuments, deleteDocument } from '@/services/documentsApi';

const docs = await getDocuments({ type: 'jobsheet' });
await deleteDocument(documentId);
```

### Date Formatting
```typescript
import { formatDateForPdf } from '@/utils/pdfHelpers';

formatDateForPdf(new Date(), 'long'); // "19 November 2024"
formatDateForPdf(new Date(), 'short'); // "19/11/2024"
```

### File Size Formatting
```typescript
import { formatFileSize } from '@/services/documentsApi';

formatFileSize(1024);      // "1 KB"
formatFileSize(2097152);   // "2 MB"
```

---

## 📊 Document Filters

```typescript
// Filter by type
getDocuments({ type: 'jobsheet' })

// Filter by date range
getDocuments({ dateRange: 'week' })
// Options: 'today', 'week', 'month', 'year'

// Filter by job number
getDocuments({ jobNumber: 'JS-2024-001' })

// Combine filters
getDocuments({
  type: 'incident',
  dateRange: 'month',
  jobNumber: 'JS-2024-001'
})
```

---

## 🎯 Props Quick Reference

### PdfPreviewModal
```typescript
isOpen: boolean
onClose: () => void
title: string
documentType: 'jobsheet' | 'sampling' | 'incident' | 'ncr'
data: any
onGenerate: (data: any) => Promise<Blob>
```

### SgaPdfHeader
```typescript
title: string
documentId: string
date: string
```

### SgaPdfFooter
```typescript
pageNumber: number
totalPages: number
```

### DocumentCard
```typescript
document: Document
onDelete: (document: Document) => void
```

---

## ✅ Usage Checklist

**To Generate a PDF:**
- [ ] Import PdfPreviewModal and generate function
- [ ] Prepare data matching TypeScript interface
- [ ] Set up modal state (isOpen, onClose)
- [ ] Pass correct documentType
- [ ] Handle onGenerate callback

**To Display Documents:**
- [ ] Add DocumentLibrary to router
- [ ] Ensure API endpoints are working
- [ ] Configure CORS if needed
- [ ] Test filters and search
- [ ] Test download and delete

**Backend Requirements:**
- [ ] Install jsPDF and/or Puppeteer
- [ ] Create 8 API endpoints
- [ ] Add SGA logo assets
- [ ] Configure Azure Blob Storage
- [ ] Set up CosmosDB
- [ ] Implement SharePoint sync

---

## 🐛 Common Issues

### PDF Generation Fails
```typescript
// Check data structure
console.log('Data:', JSON.stringify(data, null, 2));

// Verify required fields
if (!data.jobNumber || !data.date) {
  throw new Error('Missing required fields');
}
```

### Document Not Downloading
```typescript
// Check URL is valid
console.log('Document URL:', document.url);

// Verify CORS headers on backend
// Access-Control-Allow-Origin: *
```

### Filters Not Working
```typescript
// Check filter state
console.log('Filters:', { typeFilter, dateFilter, jobFilter });

// Verify documents array
console.log('Documents:', documents.length);
```

---

## 📦 Dependencies

```json
{
  "react": "^18.x",
  "react-dom": "^18.x",
  "lucide-react": "^0.x",
  "@radix-ui/react-alert-dialog": "^1.x",
  "class-variance-authority": "^0.x",
  "tailwindcss": "^3.x"
}
```

Backend:
```json
{
  "jspdf": "^2.x",
  "puppeteer": "^21.x"
}
```

---

## 🔗 Related Documentation

- **Full Guide:** `docs/PDF_GENERATION_GUIDE.md`
- **Architecture:** `docs/PDF_SYSTEM_ARCHITECTURE.md`
- **Implementation:** `AGENT_5_IMPLEMENTATION_SUMMARY.md`
- **Examples:** `src/examples/PdfGenerationExample.tsx`

---

## 💡 Pro Tips

1. **Always validate data** before generating PDFs
2. **Use loading states** for better UX
3. **Clean up blob URLs** to prevent memory leaks
4. **Handle errors gracefully** with user-friendly messages
5. **Use TypeScript interfaces** for type safety
6. **Test with real data** from all document types
7. **Optimize images** in PDFs for smaller file sizes
8. **Cache document lists** to reduce API calls

---

## 📞 Support

Need help? Check:
1. Browser console for errors
2. Network tab for API calls
3. TypeScript errors in IDE
4. Example file: `PdfGenerationExample.tsx`

---

**Version:** 1.0.0
**Last Updated:** 2024-11-19
**Status:** Production Ready ✅
