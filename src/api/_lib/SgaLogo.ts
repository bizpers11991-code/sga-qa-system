import React from 'react';

interface SgaLogoProps {
    className?: string;
    style?: React.CSSProperties;
}

const SgaLogo: React.FC<SgaLogoProps> = ({ className = '', style = {} }) => {
  const baseStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        fontSize: '32pt',
        fontWeight: 900,
        color: '#b45309',
        letterSpacing: '-0.075em',
        fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
        lineHeight: 1,
    };
  
  return React.createElement(
    'div', 
    { 
        className: className,
        style: { ...baseStyle, ...style } 
    },
    'SGA'
  );
};

export default SgaLogo;
