import React, { useEffect, useRef, useState } from 'react';
import { WebGLRenderer } from '../../core/renderer';
import { CanvasProvider } from '../../context/CanvasContext';

interface CanvasProps {
  width: number;
  height: number;
  children?: React.ReactNode;
};

export function Canvas(props: CanvasProps): JSX.Element {
  const { width, height, children } = props;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [renderer, setRenderer] = useState<WebGLRenderer | null>(null);

  useEffect(() => {
    if (canvasRef.current && !renderer) {
      const newRenderer = new WebGLRenderer(canvasRef.current);
      newRenderer.setViewport(width, height);
      newRenderer.clear();
      setRenderer(newRenderer);
    }
  }, []);

  useEffect(() => {
    if (renderer) {
      renderer.setViewport(width, height);
      renderer.clear();
    }
  }, [width, height]);

  return (
    <canvas ref={canvasRef} width={width} height={height}>
      {renderer && (
        <CanvasProvider renderer={renderer}>
          {children}
        </CanvasProvider>
      )}
    </canvas>
  );
};