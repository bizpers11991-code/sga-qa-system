import React from 'react';
import {
  Download,
  Trash2,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Document } from '@/services/documentsApi';
import { getDocumentTypeLabel, formatFileSize } from '@/services/documentsApi';

interface DocumentCardProps {
  document: Document;
  onDelete: (document: Document) => void;
}

const DocumentCard: React.FC<DocumentCardProps> = ({ document, onDelete }) => {
  const handleDownload = () => {
    const link = window.document.createElement('a');
    link.href = document.url;
    link.download = `${document.title}.pdf`;
    link.target = '_blank';
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
  };

  const getTypeColor = (type: Document['type']): string => {
    const colors: Record<Document['type'], string> = {
      jobsheet: 'bg-blue-100 text-blue-800 border-blue-200',
      sampling: 'bg-green-100 text-green-800 border-green-200',
      incident: 'bg-red-100 text-red-800 border-red-200',
      ncr: 'bg-amber-100 text-amber-800 border-amber-200',
    };
    return colors[type] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getTypeIcon = (type: Document['type']) => {
    const icons: Record<Document['type'], JSX.Element> = {
      jobsheet: <FileText className="h-4 w-4" />,
      sampling: <FileText className="h-4 w-4" />,
      incident: <FileText className="h-4 w-4" />,
      ncr: <FileText className="h-4 w-4" />,
    };
    return icons[type] || <FileText className="h-4 w-4" />;
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#F5A524] bg-opacity-10 rounded-lg">
              {getTypeIcon(document.type)}
            </div>
            <div className="flex-1 min-w-0">
              <Badge className={`${getTypeColor(document.type)} text-xs`}>
                {getDocumentTypeLabel(document.type)}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        {/* Thumbnail/Preview */}
        <div className="mb-3 bg-gray-100 rounded-lg h-32 flex items-center justify-center border-2 border-gray-200">
          {document.thumbnailUrl ? (
            <img
              src={document.thumbnailUrl}
              alt={document.title}
              className="h-full w-full object-cover rounded-lg"
            />
          ) : (
            <div className="text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-xs text-gray-500">PDF Document</p>
            </div>
          )}
        </div>

        {/* Document Info */}
        <div className="space-y-2">
          <h3 className="font-semibold text-gray-900 truncate" title={document.title}>
            {document.title}
          </h3>

          <div className="space-y-1 text-sm text-gray-600">
            <div className="flex items-center justify-between">
              <span className="text-xs">Document ID:</span>
              <span className="text-xs font-mono text-[#F5A524]">
                {document.documentId}
              </span>
            </div>

            {document.jobNumber && (
              <div className="flex items-center justify-between">
                <span className="text-xs">Job Number:</span>
                <span className="text-xs font-semibold">{document.jobNumber}</span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-xs">Size:</span>
              <span className="text-xs">{formatFileSize(document.size)}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs">Created:</span>
              <span className="text-xs">
                {new Date(document.createdAt).toLocaleDateString('en-AU', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
          </div>

          {/* SharePoint Sync Status */}
          <div className="pt-2 border-t">
            {document.sharePointSynced ? (
              <div className="flex items-center gap-2 text-xs text-green-600">
                <CheckCircle className="h-3 w-3" />
                <span>Synced to SharePoint</span>
              </div>
            ) : document.sharePointUrl ? (
              <div className="flex items-center gap-2 text-xs text-yellow-600">
                <Clock className="h-3 w-3" />
                <span>Sync pending...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <XCircle className="h-3 w-3" />
                <span>Not synced</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-3 border-t">
        <div className="flex gap-2 w-full">
          <Button
            onClick={handleDownload}
            variant="outline"
            size="sm"
            className="flex-1 gap-2 hover:bg-[#F5A524] hover:text-white hover:border-[#F5A524]"
          >
            <Download className="h-4 w-4" />
            Download
          </Button>
          <Button
            onClick={() => onDelete(document)}
            variant="outline"
            size="sm"
            className="gap-2 hover:bg-red-600 hover:text-white hover:border-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default DocumentCard;
