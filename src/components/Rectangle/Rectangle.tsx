import { useEffect } from 'react';
import { useAddToRenderQueue, useRenderer } from '../../context/CanvasContext';

interface RectangleProps {
    x: number;
    y: number;
    width: number;
    height: number;
    color: [number, number, number, number];
}

export function Rectangle(props: RectangleProps): null {
  const { x, y, width, height, color } = props;
  const renderer = useRenderer();
  const addToRenderQueue = useAddToRenderQueue();

  useEffect(() => {
    if (renderer && addToRenderQueue) {
      const renderFn = (): void => {
        renderer.drawRectangle(x, y, width, height, color);
      };
      addToRenderQueue(renderFn);
      renderer.addToRenderQueue(renderFn);
      renderer.render();
    }
  }, [x, y, width, height, color, renderer]);

  return null;
}