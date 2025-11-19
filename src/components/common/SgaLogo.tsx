import React from 'react';

interface SgaLogoProps {
  className?: string;
}

export const SgaLogo: React.FC<SgaLogoProps> = ({ className = 'h-8' }) => {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="font-bold text-sga-700 text-2xl tracking-tight">
        SGA
      </div>
      <div className="text-sm text-gray-600 font-medium">
        Quality Assurance
      </div>
    </div>
  );
};

export default SgaLogo;
