import React, { useEffect, useRef } from 'react';
import { WebGLRenderer } from '../../core/renderer';

interface CanvasProps {
  width: number;
  height: number;
  children?: React.ReactNode;
};

export const Canvas: React.FC<CanvasProps> = ({ width, height }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<WebGLRenderer | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      rendererRef.current = new WebGLRenderer(canvasRef.current);
      rendererRef.current.setViewport(width, height);
      
      // Пример рендеринга прямоугольника
      rendererRef.current.clear();
      rendererRef.current.drawRectangle(100, 100, 200, 100, [1, 0, 0, 1]);
    }
  }, [width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ border: '1px solid black' }}
    />
  );
};