import { useEffect, useRef } from 'react';
import { useRenderer } from '../../context/CanvasContext';
import { Shape, DragE } from '../../types';
import { UUID } from '../../utils/uuid';

interface EllipseProps {
  x: number;
  y: number;
  radiusX: number;
  radiusY: number;
  color: [number, number, number, number];
  isDraggable?: boolean;
  onDragStart?: (e: DragE) => void;
  onDrag?: (e: DragE) => void;
  onDragEnd?: (e: DragE) => void;
}

export function Ellipse(props: EllipseProps): null {
  const { x, y, radiusX, radiusY, color } = props;
  const renderer = useRenderer();
  const shapeId = useRef(UUID());

  useEffect(() => {
    if (renderer) {
      const renderFn = (): void => {
        renderer.drawEllipse(x, y, radiusX, radiusY, color);
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
          const dx = (x - props.x) / props.radiusX;
          const dy = (y - props.y) / props.radiusY;
          return (dx * dx + dy * dy) <= 1;
        },
      };
      
      renderer.addToRenderQueue(shape, shapeId.current);
      renderer.render();

      return (): void => {
      };
    }
  }, [x, y, radiusX, radiusY, color, renderer]);

  return null;
}