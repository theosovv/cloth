import { useEffect } from 'react';
import { useAddToRenderQueue, useRenderer } from '../../context/CanvasContext';
import { PathPoint } from '../../types';

interface PathProps {
  points: PathPoint[];
  strokeColor: [number, number, number, number];
  fillColor?: [number, number, number, number];
  thickness?: number;
  closed?: boolean;
}

export function Path(props: PathProps): null {
  const {
    points,
    strokeColor,
    fillColor,
    thickness = 2,
    closed = false,
  } = props;
  const renderer = useRenderer();
  const addToRenderQueue = useAddToRenderQueue();

  useEffect(() => {
    if (renderer && addToRenderQueue) {
      const renderFn = (): void => {
        renderer.drawPath(points, strokeColor, fillColor || null, thickness, closed);
      };
      addToRenderQueue(renderFn);
      renderer.addToRenderQueue(renderFn);
      renderer.render();
    }
  }, [points, strokeColor, fillColor, thickness, closed, renderer]);

  return null;
}