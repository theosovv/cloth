import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useRenderer, useSelectedShapes } from 'src/context/CanvasContext';
import { DragE, TextMetrics } from 'src/types';
import { UUID } from 'src/utils/uuid';

interface UseShapeProps {
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

export function useShape(props: UseShapeProps): void {
  const {
    text,
    x,
    y,
    color,
    fontSize = 16,
    fontFamily = 'Arial',
    textAlign = 'left',
    baseline = 'top',
    isDraggable,
    onDragStart,
    onDrag,
    onDragEnd,
  } = props;
  const renderer = useRenderer();
  const shapeId = useRef(UUID());
  const metricsRef = useRef<TextMetrics | null>(null);
  const isSelected = useSelectedShapes()?.has(shapeId.current);

  const move = useCallback(
    (dx: number, dy: number): void => {
      onDrag?.({
        x: x + dx,
        y: y + dy,
        dx,
        dy,
        worldX: x + dx,
        worldY: y + dy,
        worldDx: dx,
        worldDy: dy,
      });
    },
    [onDrag, x, y]
  );

  const getBounds = useCallback(() => {
    const metrics = metricsRef.current;
    if (!metrics) {
      return {
        x: x,
        y: y,
        width: 0,
        height: 0,
      };
    }

    return {
      x: x,
      y: y,
      width: metrics.width,
      height: metrics.height,
    };
  }, [x, y]);

  const renderFn = useCallback(() => {
    metricsRef.current = renderer!.drawText(text, x, y, color, {
      fontSize,
      fontFamily,
      textAlign,
      baseline,
    });

    if (isSelected) {
      renderer!.drawRectangle({
        x: x,
        y: y,
        width: metricsRef.current.width,
        height: metricsRef.current.height,
        fillColor: [0.2, 0.4, 0.9, 0.3],
        strokeColor: [0.2, 0.4, 0.9, 0.9],
        thickness: 1,
      });
    }
  }, [
    baseline,
    color,
    fontFamily,
    fontSize,
    isSelected,
    renderer,
    text,
    textAlign,
    x,
    y,
  ]);

  const hitTest = useCallback(
    (x: number, y: number) => {
      const metrics = metricsRef.current;
      return (
        x >= props.x &&
        x <= props.x + metrics!.width &&
        y >= props.y &&
        y <= props.y + metrics!.height
      );
    },
    [props.x, props.y]
  );

  const shape = useMemo(() => {
    return {
      id: shapeId.current,
      props: {
        isDraggable: isDraggable === true,
        onDragStart,
        onDrag,
        onDragEnd,
      },
      render: renderFn,
      hitTest,
      getBounds,
      move,
    };
  }, [
    getBounds,
    hitTest,
    isDraggable,
    move,
    onDrag,
    onDragEnd,
    onDragStart,
    renderFn,
  ]);

  useEffect(() => {
    if (renderer) {
      renderer.addToRenderQueue(shape, shapeId.current);
      renderer.render();
    }
  }, [renderer, shape]);
}
