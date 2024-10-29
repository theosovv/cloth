import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  const [viewport, setViewport] = useState({ scale: 1, x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const renderQueueRef = useRef<(() => void)[]>([]);
  const [fps, setFps] = useState(0);
  const frameTimestamps = useRef<number[]>([]);

  const updateFPS = (): void => {
    const now = performance.now();
    const timestamps = frameTimestamps.current;

    while (timestamps.length > 0 && timestamps[0] <= now - 1000) {
      timestamps.shift();
    }
    timestamps.push(now);

    setFps(timestamps.length);
    requestAnimationFrame(updateFPS);
  };

  useEffect(() => {
    requestAnimationFrame(updateFPS);
  }, []);

  const addToRenderQueue = useCallback((renderFn: () => void) => {
    renderQueueRef.current.push(renderFn);
  }, []);

  useEffect(() => {
    if (canvasRef.current && !renderer) {
      const newRenderer = new WebGLRenderer(canvasRef.current);
      newRenderer.setViewport(viewport.x, viewport.y, width, height);
      newRenderer.clear();
      newRenderer.render();
      setRenderer(newRenderer);
    }
  }, []);

  useEffect(() => {
    if (renderer) {
      renderer.setViewport(viewport.x, viewport.y, width, height);
      renderer.clear();
    }
  }, [width, height]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e: WheelEvent): void => {
      e.preventDefault();
      if (!renderer) return;
      
      const scaleChange = e.deltaY * -0.001;
      const newScale = Math.max(0.1, Math.min(10, viewport.scale + scaleChange));
      
      renderer.zoom(newScale, e.clientX, e.clientY);
      requestAnimationFrame(() => {
        renderer.render();
      });
      setViewport(prev => ({ ...prev, scale: newScale }));
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });

    return (): void => {
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [renderer, viewport.scale]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>): void => {
    if (e.button === 0) {
      setIsDragging(true);

      if (canvasRef.current) {
        canvasRef.current.style.cursor = 'grabbing';
      }
    }
  };

  const handleMouseUp = (): void => {
    setIsDragging(false);
    if (canvasRef.current) {
      canvasRef.current.style.cursor = 'grab';
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>): void => {
    if (!isDragging || !renderer) return;
    
    renderer.pan(e.movementX, e.movementY);
    requestAnimationFrame(() => {
      renderer.render();
    });
  };

  return (
    <>
      <div style={{ position: 'fixed', top: 10, left: 10, background: 'white', padding: 5 }}>
        FPS: {fps}
      </div>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onMouseMove={handleMouseMove}>
        {renderer && (
          <CanvasProvider renderer={renderer} addToRenderQueue={addToRenderQueue}>
            {children}
          </CanvasProvider>
        )}
      </canvas>
    </>
  );
};