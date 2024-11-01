import { useEffect, useRef } from 'react';
import { useRenderer } from '../../context/CanvasContext';
import { DragE, Shape } from '../../types';
import { UUID } from '../../utils/uuid';

interface TextProps {
  text: string;
  x: number;
  y: number;
  color: [number, number, number, number];
  fontSize?: number;
  fontFamily?: string;
  textAlign?: 'left' | 'center' | 'right';
  baseline?: 'top' | 'middle' | 'bottom';
  isDraggable?: boolean;
  onDragStart?: (e: DragE) => void;
  onDrag?: (e: DragE) => void;
  onDragEnd?: (e: DragE) => void;
}

export function Text(props: TextProps): null {
  const {
    text,
    x,
    y,
    color,
    fontSize = 16,
    fontFamily = 'Arial',
    textAlign = 'left',
    baseline = 'top',
  } = props;
  const renderer = useRenderer();
  const shapeId = useRef(UUID());

  useEffect(() => {
    if (renderer) {
      const renderFn = (): void => {
        renderer.drawText(
          text,
          x,
          y,
          color,
          {
            fontSize,
            fontFamily,
            textAlign,
            baseline,
          },
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
          const metrics = renderer.drawText(props.text, props.x, props.y, props.color, {
            fontSize,
            fontFamily,
            textAlign,
            baseline,
          });
          return x >= props.x && 
                 x <= props.x + metrics.width &&
                 y >= props.y && 
                 y <= props.y + metrics.height;
        },
      };

      renderer.addToRenderQueue(shape, shapeId.current);
      renderer.render();

      return (): void => {
      };
    }
  }, [text, x, y, color, fontSize, fontFamily, textAlign, baseline, renderer]);

  return null;
}