import { useEffect, useRef } from 'react';
import { useRenderer } from '../../context/CanvasContext';
import { PathPoint, DragE, Shape } from '../../types';
import { UUID } from '../../utils/uuid';

interface PathProps {
  x: number;
  y: number;
  points: PathPoint[];
  strokeColor: [number, number, number, number];
  fillColor?: [number, number, number, number];
  thickness?: number;
  closed?: boolean;
  isDraggable?: boolean;
  onDragStart?: (e: DragE) => void;
  onDrag?: (e: DragE) => void;
  onDragEnd?: (e: DragE) => void;
}

export function Path(props: PathProps): null {
  const {
    x,
    y,
    points,
    strokeColor,
    fillColor,
    thickness = 2,
    closed = false,
  } = props;
  const renderer = useRenderer();
  const shapeId = useRef(UUID());

  useEffect(() => {
    const fixedPoints = points.map((point) => ({
      x: point.x + x,
      y: point.y + y,
      moveTo: point.moveTo,
    }));
    if (renderer) {
      const renderFn = (): void => {
        renderer.drawPath(fixedPoints, strokeColor, fillColor || null, thickness, closed);
      };

      const shape: Shape = {
        props: {
          isDraggable: props.isDraggable === true,
          onDragStart: props.onDragStart,
          onDrag: props.onDrag,
          onDragEnd: props.onDragEnd,
        },
        render: renderFn,
        hitTest: (x: number, y: number) => {
          const fixedPoints = points.map((point) => ({
            x: point.x + props.x,
            y: point.y + props.y,
            moveTo: point.moveTo,
          }));
        
          if (props.fillColor) {
            let inside = false;
            for (let i = 0, j = fixedPoints.length - 1; i < fixedPoints.length; j = i++) {
              const xi = fixedPoints[i].x, yi = fixedPoints[i].y;
              const xj = fixedPoints[j].x, yj = fixedPoints[j].y;
              
              const intersect = ((yi > y) !== (yj > y))
                  && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
              if (intersect) inside = !inside;
            }
            if (inside) return true;
          }
        
          for (let i = 0; i < fixedPoints.length - 1; i++) {
            const p1 = fixedPoints[i];
            const p2 = fixedPoints[i + 1];
            
            const thickness = props.thickness || 2;
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const length = Math.sqrt(dx * dx + dy * dy);
            
            const distance = Math.abs(
              (dy * x - dx * y + p2.x * p1.y - p2.y * p1.x) / length,
            );
            
            if (distance <= thickness) return true;
          }
          return false;
        },
      };
      renderer.addToRenderQueue(shape, shapeId.current);
      renderer.render();

      return (): void => {
      };
    }
  }, [points, x, y, strokeColor, fillColor, thickness, closed, renderer]);

  return null;
}