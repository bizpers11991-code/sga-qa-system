import React from 'react';

interface SgaLogoProps {
    className?: string;
    style?: React.CSSProperties;
}

const SgaLogo: React.FC<SgaLogoProps> = ({ className = '', style = {} }) => {
  const baseStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        width: '120px',
        height: 'auto',
        ...style
    };

  return React.createElement(
    'div',
    {
        className: className,
        style: { display: 'flex', alignItems: 'center', gap: '12px' }
    },
    React.createElement('img', {
      src: '/assets/sga-logo.png',
      alt: 'Safety Grooving Australia',
      style: baseStyle
    }),
    React.createElement(
      'span',
      {
        style: {
          fontSize: '24pt',
          fontWeight: 900,
          color: '#F5A524',
          letterSpacing: '-0.075em',
          fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
          lineHeight: 1,
        }
      },
      'SGA'
    )
  );
};

export default SgaLogo;
