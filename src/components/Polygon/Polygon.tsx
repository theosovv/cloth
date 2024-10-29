import { useEffect } from 'react';
import { useAddToRenderQueue, useRenderer } from '../../context/CanvasContext';

interface Point {
  x: number;
  y: number;
}

interface PolygonProps {
  points: Point[];
  strokeColor: [number, number, number, number];
  fillColor?: [number, number, number, number];
  thickness?: number;
}

export function Polygon(props: PolygonProps): null {
  const {
    points,
    strokeColor,
    fillColor,
    thickness = 2,
  } = props;
  const renderer = useRenderer();
  const addToRenderQueue = useAddToRenderQueue();

  useEffect(() => {
    if (renderer && addToRenderQueue) {
      const renderFn = (): void => {
        renderer.drawPolygon(
          points,
          strokeColor,
          fillColor || null,
          thickness,
        );
      };
      addToRenderQueue(renderFn);
      renderer.addToRenderQueue(renderFn);
      renderer.render();
    }
  }, [points, strokeColor, fillColor, thickness, renderer]);

  return null;
}