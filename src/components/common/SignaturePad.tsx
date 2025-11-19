import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';

export interface SignaturePadHandle {
  toDataURL: () => string;
  clear: () => void;
}

interface SignaturePadProps {
  initialSignature?: string;
}

export const SignaturePad = forwardRef<SignaturePadHandle, SignaturePadProps>(
  ({ initialSignature }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set canvas size
      canvas.width = canvas.offsetWidth;
      canvas.height = 150;

      // Set drawing styles
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      setContext(ctx);

      // Load initial signature if provided
      if (initialSignature) {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        };
        img.src = initialSignature;
      }
    }, [initialSignature]);

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      if (!context || !canvasRef.current) return;

      setIsDrawing(true);
      const rect = canvasRef.current.getBoundingClientRect();
      const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
      const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

      context.beginPath();
      context.moveTo(x, y);
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      if (!isDrawing || !context || !canvasRef.current) return;

      e.preventDefault();
      const rect = canvasRef.current.getBoundingClientRect();
      const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
      const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

      context.lineTo(x, y);
      context.stroke();
    };

    const stopDrawing = () => {
      if (!context) return;
      context.closePath();
      setIsDrawing(false);
    };

    useImperativeHandle(ref, () => ({
      toDataURL: () => {
        return canvasRef.current?.toDataURL('image/png') || '';
      },
      clear: () => {
        if (!canvasRef.current || !context) return;
        context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      },
    }));

    return (
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        className="w-full border-2 border-gray-300 rounded-md cursor-crosshair bg-white touch-none"
        style={{ height: '150px' }}
      />
    );
  }
);

SignaturePad.displayName = 'SignaturePad';

export default SignaturePad;
