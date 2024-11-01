import { useEffect, useRef } from 'react';
import { useRenderer } from '../../context/CanvasContext';
import { DragE, Shape } from '../../types';
import { UUID } from '../../utils/uuid';

interface CircleProps {
  x: number;
  y: number;
  radius: number;
  color: [number, number, number, number];
  isDraggable?: boolean;
  onDragStart?: (e: DragE) => void;
  onDrag?: (e: DragE) => void;
  onDragEnd?: (e: DragE) => void;
}

export function Circle(props: CircleProps): null {
  const { x, y, radius, color } = props;
  const renderer = useRenderer();
  const shapeId = useRef(UUID());

  useEffect(() => {
    if (renderer) {
      const renderFn = (): void => {
        renderer.drawCircle(x, y, radius, color);
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
          const dx = x - props.x;
          const dy = y - props.y;
          return Math.sqrt(dx * dx + dy * dy) <= props.radius;
        },
      };

      renderer.addToRenderQueue(shape, shapeId.current);
      renderer.render();

      return (): void => {
      };
    }
  }, [x, y, radius, color, renderer]);

  return null;
}