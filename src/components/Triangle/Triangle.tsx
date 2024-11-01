import { useEffect, useRef } from 'react';
import { useRenderer } from '../../context/CanvasContext';
import { DragE, Shape } from '../../types';
import { UUID } from '../../utils/uuid';

interface TriangleProps {
  x: number;
  y: number;
  points: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    x3: number;
    y3: number;
  };
  strokeColor: [number, number, number, number];
  fillColor?: [number, number, number, number];
  thickness?: number;
  isDraggable?: boolean;
  onDragStart?: (e: DragE) => void;
  onDrag?: (e: DragE) => void;
  onDragEnd?: (e: DragE) => void;
}

export function Triangle(props: TriangleProps): null {
  const {
    x, y, points,
    strokeColor,
    fillColor,
    thickness = 2,
  } = props;
  const renderer = useRenderer();
  const shapeId = useRef(UUID());

  useEffect(() => {
    if (renderer) {
      const renderFn = (): void => {
        renderer.drawTriangle(
          points.x1 + x, points.y1 + y,
          points.x2 + x, points.y2 + y,
          points.x3 + x, points.y3 + y,
          strokeColor,
          fillColor || null,
          thickness,
        );
      };
      const shape: Shape = {
        props: {
          isDraggable: props.isDraggable === true,
          onDragStart: props.onDragStart,
          onDrag: props.onDrag,
          onDragEnd: props.onDragEnd,
        },
        render: renderFn,
        hitTest: (px: number, py: number) => {
          function sign(p1x: number, p1y: number, p2x: number, p2y: number, p3x: number, p3y: number): number {
            return (p1x - p3x) * (p2y - p3y) - (p2x - p3x) * (p1y - p3y);
          }
        
          const x1 = points.x1 + x;
          const y1 = points.y1 + y;
          const x2 = points.x2 + x;
          const y2 = points.y2 + y;
          const x3 = points.x3 + x;
          const y3 = points.y3 + y;
        
          const d1 = sign(px, py, x1, y1, x2, y2);
          const d2 = sign(px, py, x2, y2, x3, y3);
          const d3 = sign(px, py, x3, y3, x1, y1);
        
          const hasNeg = (d1 < 0) || (d2 < 0) || (d3 < 0);
          const hasPos = (d1 > 0) || (d2 > 0) || (d3 > 0);
        
          return !(hasNeg && hasPos);
        },
      };
      renderer.addToRenderQueue(shape, shapeId.current);
      renderer.render();

      return (): void => {
      };
    }
  }, [x, y, points, strokeColor, fillColor, thickness, renderer]);

  return null;
}