import React from 'react';

interface SgaPdfFooterProps {
  pageNumber: number;
  totalPages: number;
}

const SgaPdfFooter: React.FC<SgaPdfFooterProps> = ({
  pageNumber,
  totalPages,
}) => {
  return (
    <div className="bg-gray-50 border-t-2 border-[#F5A524] pt-3">
      <div className="flex items-center justify-between text-xs text-gray-600">
        {/* Company Info */}
        <div className="flex-1">
          <p className="font-bold text-gray-900 mb-1">Safety Grooving Australia</p>
          <p>ABN: 12 345 678 901</p>
          <p>Delivering Quality Safety Solutions</p>
        </div>

        {/* Contact Info */}
        <div className="flex-1 text-center">
          <p className="font-medium text-gray-900 mb-1">Contact Information</p>
          <p>Phone: 1300 SGA QA (1300 742 727)</p>
          <p>Email: qa@safetygrooving.com.au</p>
          <p>Web: www.safetygrooving.com.au</p>
        </div>

        {/* Page Number & Logo Watermark */}
        <div className="flex-1 text-right">
          <div className="flex items-center justify-end gap-3">
            <div>
              <p className="font-medium text-gray-900 mb-1">Page {pageNumber} of {totalPages}</p>
              <p className="text-[#F5A524] font-semibold text-xs">
                Generated: {new Date().toLocaleDateString('en-AU', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
            {/* Small SGA watermark */}
            <div className="opacity-30">
              <div className="w-12 h-12 bg-[#F5A524] rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">SGA</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="mt-2 pt-2 border-t border-gray-300">
        <p className="text-center text-xs text-gray-500">
          This document is confidential and intended solely for the use of Safety Grooving Australia and its clients.
          <span className="mx-2">|</span>
          <span className="text-[#F5A524] font-medium">Quality Assured</span>
        </p>
      </div>
    </div>
  );
};

export default SgaPdfFooter;
