import { useEffect } from 'react';
import { useAddToRenderQueue, useRenderer } from '../../context/CanvasContext';

interface LineProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: [number, number, number, number];
  thickness?: number;
}

export function Line(props: LineProps): null {
  const { x1, y1, x2, y2, color, thickness = 2 } = props;
  const renderer = useRenderer();
  const addToRenderQueue = useAddToRenderQueue();

  useEffect(() => {
    if (renderer && addToRenderQueue) {
      const renderFn = (): void => {
        renderer.drawLine(x1, y1, x2, y2, color, thickness);
      };
      addToRenderQueue(renderFn);
      renderer.addToRenderQueue(renderFn);
      renderer.render();
    }
  }, [x1, y1, x2, y2, color, thickness, renderer]);

  return null;
}