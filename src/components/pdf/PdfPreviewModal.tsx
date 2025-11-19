import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Download, FileText } from 'lucide-react';
import SgaPdfHeader from './SgaPdfHeader';
import SgaPdfFooter from './SgaPdfFooter';

interface PdfPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  documentType: 'jobsheet' | 'sampling' | 'incident' | 'ncr';
  data: any;
  onGenerate: (data: any) => Promise<Blob>;
}

const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({
  isOpen,
  onClose,
  title,
  documentType,
  data,
  onGenerate,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPdf, setGeneratedPdf] = useState<Blob | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const blob = await onGenerate(data);
      setGeneratedPdf(blob);
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!pdfUrl || !generatedPdf) return;

    const filename = `${documentType}-${data.id || 'document'}-${new Date().toISOString().split('T')[0]}.pdf`;
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClose = () => {
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
    }
    setGeneratedPdf(null);
    setPdfUrl(null);
    onClose();
  };

  const renderPreviewContent = () => {
    switch (documentType) {
      case 'jobsheet':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Job Number</p>
                <p className="text-base">{data.jobNumber || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Date</p>
                <p className="text-base">{data.date || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Client</p>
                <p className="text-base">{data.client || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Location</p>
                <p className="text-base">{data.location || 'N/A'}</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Description</p>
              <p className="text-base">{data.description || 'N/A'}</p>
            </div>
          </div>
        );
      case 'sampling':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Plan ID</p>
                <p className="text-base">{data.planId || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Date</p>
                <p className="text-base">{data.date || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Material Type</p>
                <p className="text-base">{data.materialType || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Sample Size</p>
                <p className="text-base">{data.sampleSize || 'N/A'}</p>
              </div>
            </div>
          </div>
        );
      case 'incident':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Incident ID</p>
                <p className="text-base">{data.incidentId || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Date</p>
                <p className="text-base">{data.date || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Severity</p>
                <p className="text-base">{data.severity || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Reporter</p>
                <p className="text-base">{data.reporter || 'N/A'}</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Description</p>
              <p className="text-base">{data.description || 'N/A'}</p>
            </div>
          </div>
        );
      case 'ncr':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600">NCR Number</p>
                <p className="text-base">{data.ncrNumber || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Date</p>
                <p className="text-base">{data.date || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Status</p>
                <p className="text-base">{data.status || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Priority</p>
                <p className="text-base">{data.priority || 'N/A'}</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Non-Conformance</p>
              <p className="text-base">{data.nonConformance || 'N/A'}</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#F5A524]" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* PDF Header Preview */}
          <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
            <p className="text-xs text-gray-500 mb-2">Header Preview:</p>
            <SgaPdfHeader
              title={title}
              documentId={data.id || data.jobNumber || data.planId || data.incidentId || data.ncrNumber || 'N/A'}
              date={data.date || new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Document Content Preview */}
          <div className="border-2 border-gray-200 rounded-lg p-6 bg-white">
            <p className="text-xs text-gray-500 mb-4">Content Preview:</p>
            {renderPreviewContent()}
          </div>

          {/* PDF Footer Preview */}
          <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
            <p className="text-xs text-gray-500 mb-2">Footer Preview:</p>
            <SgaPdfFooter pageNumber={1} totalPages={1} />
          </div>

          {/* Generated PDF Preview */}
          {pdfUrl && (
            <div className="border-2 border-green-200 rounded-lg p-4 bg-green-50">
              <p className="text-sm text-green-700 mb-2 font-medium">PDF Generated Successfully!</p>
              <iframe
                src={pdfUrl}
                className="w-full h-96 border rounded"
                title="PDF Preview"
              />
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isGenerating}
          >
            Close
          </Button>
          {!generatedPdf ? (
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="bg-[#F5A524] hover:bg-[#E09410] text-white"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Generate PDF
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleDownload}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PdfPreviewModal;
