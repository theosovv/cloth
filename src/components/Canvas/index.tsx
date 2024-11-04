import React from 'react';
import { CanvasProvider } from '../../context/CanvasContext';
import { useCanvas } from './hooks/useCanvas';

interface CanvasProps {
  width: number;
  height: number;
  children?: React.ReactNode;
}

export function Canvas(props: CanvasProps): JSX.Element {
  const { width, height, children } = props;
  const {
    canvasRef,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    renderer,
    selectedShapes,
  } = useCanvas({ width, height });

  return (
    <>
      <canvas
        ref={canvasRef}
        width={width * 2}
        height={height * 2}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onMouseMove={handleMouseMove}
        style={{
          width: `${width}px`,
          height: `${height}px`,
          cursor: 'grab',
          overflow: 'hidden',
        }}
      >
        {renderer && (
          <CanvasProvider renderer={renderer} selectedShapes={selectedShapes}>
            {children}
          </CanvasProvider>
        )}
      </canvas>
    </>
  );
}
