import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useRenderer, useSelectedShapes } from 'src/context/CanvasContext';
import { Bounds, DragE } from 'src/types';
import { UUID } from 'src/utils/uuid';

interface UseShapeProps {
  x: number;
  y: number;
  width: number;
  height: number;
  color: [number, number, number, number];
  thickness?: number;
  isDraggable?: boolean;
  onDragStart?: (e: DragE) => void;
  onDrag?: (e: DragE) => void;
  onDragEnd?: (e: DragE) => void;
}

export function useShape(props: UseShapeProps): void {
  const {
    x,
    y,
    width,
    height,
    color,
    thickness = 0,
    isDraggable,
    onDragStart,
    onDrag,
    onDragEnd,
  } = props;

  const renderer = useRenderer();
  const shapeId = useRef(UUID());
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

  const getBounds = useCallback((): Bounds => {
    return {
      x: x,
      y: y,
      width: width,
      height: height,
    };
  }, [x, y, width, height]);

  const renderFn = useCallback(() => {
    renderer!.drawRectangle({ x, y, width, height, fillColor: color });

    if (isSelected) {
      renderer!.drawRectangle({
        x,
        y,
        width,
        height,
        fillColor: [0.2, 0.4, 0.9, 0.3],
        strokeColor: [0.2, 0.4, 0.9, 0.9],
        thickness: thickness + 1,
      });
    }
  }, [color, height, isSelected, renderer, thickness, width, x, y]);

  const hitTest = useCallback(
    (x: number, y: number) => {
      return (
        x >= props.x &&
        x <= props.x + props.width &&
        y >= props.y &&
        y <= props.y + props.height
      );
    },
    [props.height, props.width, props.x, props.y]
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
  });
}
