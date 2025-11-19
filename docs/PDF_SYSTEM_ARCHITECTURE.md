# PDF Generation System Architecture

## Component Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                     Application Router                           │
└────────────────────────┬────────────────────────────────────────┘
                         │
        ┌────────────────┴────────────────┐
        │                                  │
        ▼                                  ▼
┌───────────────────┐           ┌──────────────────────┐
│   Any Form Page   │           │  Document Library    │
│  (Job, Incident)  │           │       Page           │
└────────┬──────────┘           └──────────┬───────────┘
         │                                  │
         │ Opens                            │ Displays
         ▼                                  ▼
┌──────────────────┐            ┌──────────────────────┐
│ PdfPreviewModal  │            │   DocumentCard       │
│                  │            │   (multiple cards)   │
│  ┌────────────┐  │            │                      │
│  │ SgaPdfHeader│ │            │  • Type Badge        │
│  └────────────┘  │            │  • Thumbnail         │
│                  │            │  • Metadata          │
│  ┌────────────┐  │            │  • Sync Status       │
│  │  Content   │  │            │  • Actions           │
│  │  Preview   │  │            └──────────┬───────────┘
│  └────────────┘  │                       │
│                  │                       │ Triggers
│  ┌────────────┐  │                       ▼
│  │ SgaPdfFooter│ │            ┌──────────────────────┐
│  └────────────┘  │            │   AlertDialog        │
│                  │            │  (Delete Confirm)    │
│  [Generate PDF]  │            └──────────────────────┘
│  [Download PDF]  │
└────────┬─────────┘
         │ Calls
         ▼
┌──────────────────┐
│    pdfApi.ts     │
│                  │
│ • generateJobSheetPdf()
│ • generateSamplingPdf()
│ • generateIncidentPdf()
│ • generateNcrPdf()
│ • downloadBlob()
└────────┬─────────┘
         │ Makes HTTP requests
         ▼
┌──────────────────────────────┐
│    Backend API Server        │
│                              │
│  POST /api/generate-*-pdf    │
│  • Uses jsPDF/Puppeteer      │
│  • Adds SGA branding         │
│  • Returns PDF Blob          │
└──────────────────────────────┘
```

## Data Flow: PDF Generation

```
User Action
    │
    ▼
┌─────────────────┐
│  Click "Generate│
│  PDF" Button    │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│  PdfPreviewModal Opens      │
│  • Displays form data       │
│  • Shows header/footer      │
│  • Renders preview          │
└────────┬────────────────────┘
         │
         │ User clicks "Generate"
         ▼
┌─────────────────────────────┐
│  Call API Function          │
│  generateXxxPdf(data)       │
│  • Set loading state        │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  Backend Endpoint           │
│  POST /api/generate-xxx-pdf │
│  • Receives data            │
│  • Generates PDF            │
│  • Returns blob             │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  Frontend Receives Blob     │
│  • Create blob URL          │
│  • Display in iframe        │
│  • Show download button     │
└────────┬────────────────────┘
         │
         │ User clicks "Download"
         ▼
┌─────────────────────────────┐
│  Download PDF File          │
│  • Create download link     │
│  • Trigger browser download │
│  • Cleanup blob URL         │
└─────────────────────────────┘
```

## Data Flow: Document Management

```
User Navigates to /documents
         │
         ▼
┌─────────────────────────────┐
│  DocumentLibrary Mounts     │
│  • Call getDocuments()      │
│  • Set loading state        │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  documentsApi.ts            │
│  GET /api/get-documents     │
│  • With filters (optional)  │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  Backend Returns Documents  │
│  • Array of Document[]      │
│  • With metadata            │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  Render DocumentCard Grid   │
│  • Map documents to cards   │
│  • Apply filters locally    │
└────────┬────────────────────┘
         │
         ├─────────────────────────┐
         │                         │
         ▼                         ▼
┌──────────────────┐    ┌──────────────────┐
│  User Downloads  │    │   User Deletes   │
│    Document      │    │    Document      │
└────────┬─────────┘    └────────┬─────────┘
         │                       │
         ▼                       ▼
┌──────────────────┐    ┌──────────────────┐
│  Download File   │    │  Show Alert      │
│  from URL        │    │  Dialog          │
└──────────────────┘    └────────┬─────────┘
                                 │
                                 ▼
                        ┌──────────────────┐
                        │  Call DELETE API │
                        │  Remove from list│
                        └──────────────────┘
```

## Service Layer Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend Services                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────────┐        ┌──────────────────────┐   │
│  │     pdfApi.ts       │        │   documentsApi.ts    │   │
│  ├─────────────────────┤        ├──────────────────────┤   │
│  │ • generateJobSheetPdf│        │ • getDocuments       │   │
│  │ • generateSamplingPdf│        │ • uploadDocument     │   │
│  │ • generateIncidentPdf│        │ • deleteDocument     │   │
│  │ • generateNcrPdf     │        │ • getUploadUrl       │   │
│  │ • downloadBlob       │        │ • confirmUpload      │   │
│  │                      │        │ • downloadDocument   │   │
│  │ TypeScript Interfaces│        │ • formatFileSize     │   │
│  │ • JobSheetData       │        │ • getDocumentType    │   │
│  │ • SamplingPlanData   │        │                      │   │
│  │ • IncidentReportData │        │ TypeScript Interfaces│   │
│  │ • NcrData            │        │ • Document           │   │
│  └──────────┬───────────┘        │ • DocumentFilters    │   │
│             │                    │ • UploadMetadata     │   │
│             │                    └──────────┬───────────┘   │
│             │                               │               │
└─────────────┼───────────────────────────────┼───────────────┘
              │                               │
              └───────────┬───────────────────┘
                          │
                          │ HTTP Requests
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                      Backend API                             │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────────────┐        ┌──────────────────────┐     │
│  │  PDF Generation    │        │  Document Management │     │
│  ├────────────────────┤        ├──────────────────────┤     │
│  │ POST /api/generate-│        │ GET /api/get-docs    │     │
│  │   jobsheet-pdf     │        │ POST /api/upload-url │     │
│  │ POST /api/generate-│        │ POST /api/confirm-up │     │
│  │   sampling-pdf     │        │ DELETE /api/delete   │     │
│  │ POST /api/generate-│        │                      │     │
│  │   incident-pdf     │        │ • Azure Blob Storage │     │
│  │ POST /api/generate-│        │ • CosmosDB Storage   │     │
│  │   ncr-pdf          │        │ • SharePoint Sync    │     │
│  │                    │        │                      │     │
│  │ • jsPDF Library    │        └──────────────────────┘     │
│  │ • Puppeteer        │                                      │
│  │ • SGA Branding     │                                      │
│  └────────────────────┘                                      │
└─────────────────────────────────────────────────────────────┘
```

## Utility Functions Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   pdfHelpers.ts                          │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Date & Time Functions                                   │
│  ┌────────────────────────────────────────────┐         │
│  │ formatDateForPdf(date, format)             │         │
│  │ • 'full', 'short', 'long', 'time'          │         │
│  │ • Australian date formats                  │         │
│  └────────────────────────────────────────────┘         │
│                                                           │
│  PDF Operations                                          │
│  ┌────────────────────────────────────────────┐         │
│  │ addWatermark(doc, text, options)           │         │
│  │ • For jsPDF documents                      │         │
│  │ • Configurable opacity & angle             │         │
│  │                                             │         │
│  │ generatePdfBlob(htmlContent)               │         │
│  │ • HTML to PDF conversion                   │         │
│  │ • Browser print API                        │         │
│  │                                             │         │
│  │ downloadPdf(blob, filename)                │         │
│  │ • Browser download trigger                 │         │
│  │ • Automatic cleanup                        │         │
│  └────────────────────────────────────────────┘         │
│                                                           │
│  Document Management                                     │
│  ┌────────────────────────────────────────────┐         │
│  │ generateDocumentId(prefix)                 │         │
│  │ • Timestamp + random                       │         │
│  │                                             │         │
│  │ isValidPdfBlob(blob)                       │         │
│  │ • Type & size validation                   │         │
│  │                                             │         │
│  │ createPdfFilename(type, id, date)          │         │
│  │ • Consistent naming convention             │         │
│  │                                             │         │
│  │ formatFileSize(bytes)                      │         │
│  │ • KB, MB, GB formatting                    │         │
│  └────────────────────────────────────────────┘         │
│                                                           │
│  Content Processing                                      │
│  ┌────────────────────────────────────────────┐         │
│  │ sanitizeForPdf(text)                       │         │
│  │ • Remove non-printable chars               │         │
│  │                                             │         │
│  │ parseTableData(tableHtml)                  │         │
│  │ • HTML table to 2D array                   │         │
│  │                                             │         │
│  │ calculateOptimalFontSize(text, maxWidth)   │         │
│  │ • Responsive text sizing                   │         │
│  └────────────────────────────────────────────┘         │
│                                                           │
│  Metadata                                                │
│  ┌────────────────────────────────────────────┐         │
│  │ createPdfMetadata(options)                 │         │
│  │ • Title, subject, author, keywords         │         │
│  │                                             │         │
│  │ generatePageNumbers(totalPages)            │         │
│  │ • Page X of Y array                        │         │
│  └────────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────┘
```

## Component Props & State Flow

```
┌──────────────────────────────────────────────────────┐
│              PdfPreviewModal                          │
├──────────────────────────────────────────────────────┤
│ Props (Input):                                        │
│  • isOpen: boolean                                    │
│  • onClose: () => void                                │
│  • title: string                                      │
│  • documentType: 'jobsheet' | 'sampling' | ...        │
│  • data: JobSheetData | SamplingPlanData | ...        │
│  • onGenerate: (data: any) => Promise<Blob>          │
│                                                        │
│ State (Internal):                                     │
│  • isGenerating: boolean                              │
│  • generatedPdf: Blob | null                          │
│  • pdfUrl: string | null                              │
│                                                        │
│ Children Components:                                  │
│  ├─ SgaPdfHeader                                      │
│  │   └─ Props: { title, documentId, date }           │
│  ├─ Content Preview (dynamic based on type)          │
│  ├─ SgaPdfFooter                                      │
│  │   └─ Props: { pageNumber, totalPages }            │
│  └─ iframe (PDF viewer after generation)             │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│              DocumentLibrary                          │
├──────────────────────────────────────────────────────┤
│ Props: None (route component)                         │
│                                                        │
│ State:                                                │
│  • documents: Document[]                              │
│  • filteredDocuments: Document[]                      │
│  • isLoading: boolean                                 │
│  • searchTerm: string                                 │
│  • typeFilter: string                                 │
│  • dateFilter: string                                 │
│  • jobFilter: string                                  │
│  • deleteDialogOpen: boolean                          │
│  • documentToDelete: Document | null                  │
│  • isDeleting: boolean                                │
│                                                        │
│ Children Components:                                  │
│  ├─ Search Input                                      │
│  ├─ Filter Selects (Type, Date, Job)                 │
│  ├─ DocumentCard[] (mapped from filteredDocuments)   │
│  │   └─ Props: { document, onDelete }                │
│  └─ AlertDialog (delete confirmation)                │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│              DocumentCard                             │
├──────────────────────────────────────────────────────┤
│ Props:                                                │
│  • document: Document                                 │
│  • onDelete: (document: Document) => void             │
│                                                        │
│ State: None (stateless presentation)                  │
│                                                        │
│ Displays:                                             │
│  ├─ Type Badge (color-coded)                         │
│  ├─ Thumbnail/Placeholder                            │
│  ├─ Document Metadata                                │
│  │   ├─ Title                                         │
│  │   ├─ Document ID                                   │
│  │   ├─ Job Number                                    │
│  │   ├─ Size                                          │
│  │   └─ Created Date                                  │
│  ├─ SharePoint Sync Status                           │
│  └─ Action Buttons                                    │
│      ├─ Download                                      │
│      └─ Delete                                        │
└──────────────────────────────────────────────────────┘
```

## Color Coding System

```
Document Type Colors:
┌────────────────┬─────────────────┬──────────────────┐
│ Document Type  │ Badge Color     │ Tailwind Class   │
├────────────────┼─────────────────┼──────────────────┤
│ Job Sheet      │ Blue            │ bg-blue-100      │
│                │                 │ text-blue-800    │
│                │                 │ border-blue-200  │
├────────────────┼─────────────────┼──────────────────┤
│ Sampling Plan  │ Green           │ bg-green-100     │
│                │                 │ text-green-800   │
│                │                 │ border-green-200 │
├────────────────┼─────────────────┼──────────────────┤
│ Incident Report│ Red             │ bg-red-100       │
│                │                 │ text-red-800     │
│                │                 │ border-red-200   │
├────────────────┼─────────────────┼──────────────────┤
│ NCR            │ Amber           │ bg-amber-100     │
│                │                 │ text-amber-800   │
│                │                 │ border-amber-200 │
└────────────────┴─────────────────┴──────────────────┘

SharePoint Sync Status:
┌──────────────┬─────────┬──────────────┬──────────────┐
│ Status       │ Color   │ Icon         │ Text         │
├──────────────┼─────────┼──────────────┼──────────────┤
│ Synced       │ Green   │ CheckCircle  │ "Synced to   │
│              │         │              │  SharePoint" │
├──────────────┼─────────┼──────────────┼──────────────┤
│ Pending      │ Yellow  │ Clock        │ "Sync        │
│              │         │              │  pending..." │
├──────────────┼─────────┼──────────────┼──────────────┤
│ Not Synced   │ Gray    │ XCircle      │ "Not synced" │
└──────────────┴─────────┴──────────────┴──────────────┘

SGA Brand Colors:
┌─────────────────┬──────────────────────────┐
│ Color           │ Hex Code / Tailwind      │
├─────────────────┼──────────────────────────┤
│ Primary Amber   │ #F5A524                  │
│                 │ bg-[#F5A524]             │
├─────────────────┼──────────────────────────┤
│ Hover Amber     │ #E09410                  │
│                 │ hover:bg-[#E09410]       │
├─────────────────┼──────────────────────────┤
│ Text on Amber   │ White                    │
│                 │ text-white               │
└─────────────────┴──────────────────────────┘
```

## File Size & Performance

```
Component Sizes (approximate):
┌─────────────────────────────┬──────────┬─────────┐
│ File                        │ Lines    │ Size    │
├─────────────────────────────┼──────────┼─────────┤
│ PdfPreviewModal.tsx         │ 218      │ 7.2 KB  │
│ SgaPdfHeader.tsx            │ 58       │ 2.0 KB  │
│ SgaPdfFooter.tsx            │ 75       │ 2.5 KB  │
│ DocumentLibrary.tsx         │ 315      │ 11.2 KB │
│ DocumentCard.tsx            │ 161      │ 5.5 KB  │
│ pdfApi.ts                   │ 195      │ 6.8 KB  │
│ documentsApi.ts             │ 242      │ 8.5 KB  │
│ pdfHelpers.ts               │ 298      │ 10.5 KB │
├─────────────────────────────┼──────────┼─────────┤
│ TOTAL                       │ 1,562    │ 54.2 KB │
└─────────────────────────────┴──────────┴─────────┘

Performance Optimizations:
┌─────────────────────────────────────────────────────┐
│ • Lazy loading of document thumbnails               │
│ • Blob URL cleanup to prevent memory leaks          │
│ • Real-time filtering (no backend calls)            │
│ • Debounced search (can be added)                   │
│ • Efficient grid layout with CSS Grid              │
│ • Minimal re-renders with proper state management   │
│ • Conditional rendering for empty states            │
└─────────────────────────────────────────────────────┘
```

## Error Handling Flow

```
┌─────────────────────────────────────────┐
│         Error Scenarios                 │
└─────────────────────────────────────────┘
                  │
    ┌─────────────┼─────────────┐
    │             │             │
    ▼             ▼             ▼
┌─────────┐  ┌─────────┐  ┌──────────┐
│ Network │  │   API   │  │ Validation│
│ Failure │  │  Error  │  │  Error   │
└────┬────┘  └────┬────┘  └────┬─────┘
     │            │             │
     └────────────┴─────────────┘
                  │
                  ▼
    ┌──────────────────────────┐
    │   Try-Catch Block        │
    │   console.error()        │
    └──────────┬───────────────┘
               │
               ▼
    ┌──────────────────────────┐
    │   User-Friendly Alert    │
    │   "Failed to..."         │
    └──────────┬───────────────┘
               │
               ▼
    ┌──────────────────────────┐
    │   Reset Loading State    │
    │   Keep Modal Open        │
    └──────────────────────────┘
```

## Integration Points

```
┌────────────────────────────────────────────────────────┐
│               External Integrations                     │
├────────────────────────────────────────────────────────┤
│                                                          │
│  SharePoint                                             │
│  ┌─────────────────────────────────────────┐           │
│  │ • Document upload                       │           │
│  │ • Folder organization                   │           │
│  │ • Permission management                 │           │
│  │ • Metadata tagging                      │           │
│  └─────────────────────────────────────────┘           │
│                                                          │
│  Azure Blob Storage                                     │
│  ┌─────────────────────────────────────────┐           │
│  │ • PDF blob storage                      │           │
│  │ • Thumbnail storage                     │           │
│  │ • Presigned URL generation              │           │
│  │ • Automatic cleanup policies            │           │
│  └─────────────────────────────────────────┘           │
│                                                          │
│  CosmosDB                                               │
│  ┌─────────────────────────────────────────┐           │
│  │ • Document metadata storage             │           │
│  │ • Query with filters                    │           │
│  │ • Document relationships                │           │
│  │ • Audit trail                           │           │
│  └─────────────────────────────────────────┘           │
│                                                          │
│  Microsoft Graph API                                    │
│  ┌─────────────────────────────────────────┐           │
│  │ • User authentication                   │           │
│  │ • SharePoint access                     │           │
│  │ • OneDrive integration                  │           │
│  └─────────────────────────────────────────┘           │
└────────────────────────────────────────────────────────┘
```

## Deployment Checklist

```
Frontend Deployment:
☐ Build React application (npm run build)
☐ Set environment variable VITE_API_BASE_URL
☐ Upload build folder to Vercel/Azure Static Web Apps
☐ Configure CORS for API calls
☐ Test PDF generation in production
☐ Test document download from production URLs

Backend Deployment:
☐ Deploy API endpoints to Azure Functions/App Service
☐ Configure jsPDF and Puppeteer dependencies
☐ Upload SGA logo assets
☐ Set up Azure Blob Storage connection
☐ Configure CosmosDB connection
☐ Set up SharePoint app registration
☐ Configure Microsoft Graph API permissions
☐ Test all 8 API endpoints
☐ Set up monitoring and logging

Environment Variables Required:
┌────────────────────────────────────────┐
│ Frontend:                              │
│ • VITE_API_BASE_URL                    │
│                                        │
│ Backend:                               │
│ • AZURE_STORAGE_CONNECTION_STRING      │
│ • COSMOSDB_CONNECTION_STRING           │
│ • SHAREPOINT_CLIENT_ID                 │
│ • SHAREPOINT_CLIENT_SECRET             │
│ • SHAREPOINT_TENANT_ID                 │
│ • GRAPH_API_SCOPE                      │
└────────────────────────────────────────┘
```

This architecture document provides a complete visual overview of the entire PDF generation and document management system!
