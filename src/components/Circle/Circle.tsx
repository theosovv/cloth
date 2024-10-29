import { useEffect } from 'react';
import { useAddToRenderQueue, useRenderer } from '../../context/CanvasContext';

interface CircleProps {
  x: number;
  y: number;
  radius: number;
  color: [number, number, number, number];
}

export function Circle(props: CircleProps): null {
  const { x, y, radius, color } = props;
  const renderer = useRenderer();
  const addToRenderQueue = useAddToRenderQueue();

  useEffect(() => {
    if (renderer && addToRenderQueue) {
      const renderFn = (): void => {
        renderer.drawCircle(x, y, radius, color);
      };
      addToRenderQueue(renderFn);
      renderer.addToRenderQueue(renderFn);
      renderer.render();
    }
  }, [x, y, radius, color, renderer]);

  return null;
}