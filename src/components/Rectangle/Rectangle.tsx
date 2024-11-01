import { useEffect, useRef } from 'react';
import { useRenderer } from '../../context/CanvasContext';
import { DragE, Shape } from '../../types';
import { UUID } from '../../utils/uuid';

interface RectangleProps {
    x: number;
    y: number;
    width: number;
    height: number;
    color: [number, number, number, number];
    isDraggable?: boolean;
    onDragStart?: (e: DragE) => void;
    onDrag?: (e: DragE) => void;
    onDragEnd?: (e: DragE) => void;
}

export function Rectangle(props: RectangleProps): null {
  const { x, y, width, height, color } = props;
  const renderer = useRenderer();
  const shapeId = useRef(UUID());

  useEffect(() => {
    if (renderer) {
      const renderFn = (): void => {
        renderer.drawRectangle(x, y, width, height, color);
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
          return x >= props.x && 
                 x <= props.x + props.width &&
                 y >= props.y && 
                 y <= props.y + props.height;
        },
      };
      renderer.addToRenderQueue(shape, shapeId.current);
      renderer.render();

      return (): void => {
      };
    }
  }, [x, y, width, height, color, renderer]);

  return null;
}