import { useEffect, useRef } from 'react';
import { useRenderer } from '../../context/CanvasContext';
import { Shape, DragE } from '../../types';
import { UUID } from '../../utils/uuid';

interface LineProps {
  x: number;
  y: number;
  points: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  }
  color: [number, number, number, number];
  thickness?: number;
  isDraggable?: boolean;
  onDragStart?: (e: DragE) => void;
  onDrag?: (e: DragE) => void;
  onDragEnd?: (e: DragE) => void;
}

export function Line(props: LineProps): null {
  const { x, y, points, color, thickness = 2 } = props;
  const renderer = useRenderer();
  const shapeId = useRef(UUID());

  useEffect(() => {
    if (renderer) {
      const renderFn = (): void => {
        renderer.drawLine(
          x + points.x1, 
          y + points.y1,
          x + points.x2, 
          y + points.y2,
          color,
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
        hitTest: (x: number, y: number) => {
          const thickness = props.thickness || 2;
          const x2 = props.x + points.x2;
          const y2 = props.y + points.y2;
          const x1 = props.x + points.x1;
          const y1 = props.y + points.y1;
          const dx = x2 - x1;
          const dy = y2 - y1;
          const length = Math.sqrt(dx * dx + dy * dy);
          
          const distance = Math.abs(
            (dy * x - dx * y + x2 * y1 - y2 * x1) / length,
          );
          
          return distance <= thickness + 1;
        },
      };

      renderer.addToRenderQueue(shape, shapeId.current);
      renderer.render();

      return (): void => {
      };
    }
  }, [x, y, points, color, thickness, renderer]);

  return null;
}