import React from 'react';
import SgaLogo from '../../api/_lib/SgaLogo';

interface SgaPdfHeaderProps {
  title: string;
  documentId: string;
  date: string;
}

const SgaPdfHeader: React.FC<SgaPdfHeaderProps> = ({
  title,
  documentId,
  date,
}) => {
  return (
    <div className="bg-white border-b-4 border-[#F5A524] pb-4">
      <div className="flex items-start justify-between mb-4">
        {/* SGA Logo */}
        <div className="flex-shrink-0">
          <SgaLogo className="h-16 w-auto" />
        </div>

        {/* Document Info */}
        <div className="text-right">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{title}</h1>
          <div className="text-sm text-gray-600 space-y-1">
            <p>
              <span className="font-medium">Document ID:</span>{' '}
              <span className="text-[#F5A524] font-semibold">{documentId}</span>
            </p>
            <p>
              <span className="font-medium">Date:</span>{' '}
              <span>{new Date(date).toLocaleDateString('en-AU', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Company Name Bar */}
      <div className="bg-gradient-to-r from-[#F5A524] to-[#E09410] text-white px-4 py-2 rounded">
        <div className="flex items-center justify-between">
          <p className="text-lg font-bold">Safety Grooving Australia</p>
          <p className="text-sm">Quality Assurance Document</p>
        </div>
      </div>
    </div>
  );
};

export default SgaPdfHeader;
