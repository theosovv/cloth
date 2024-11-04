import React, {
  RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { WebGLRenderer } from 'src/core/renderer';
import { DragManager } from 'src/core/renderer/DragManager';
import { SelectionManager } from 'src/core/renderer/SelectionManager';
import { getCanvasRelativePosition } from 'src/utils/getCanvasRelativePosition';

interface UseCanvasOptions {
  width: number;
  height: number;
}

interface Result {
  canvasRef: RefObject<HTMLCanvasElement>;
  handleMouseDown: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  handleMouseMove: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  handleMouseUp: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  renderer: WebGLRenderer | null;
  selectedShapes: Set<string>;
}

export function useCanvas(options: UseCanvasOptions): Result {
  const { width, height } = options;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [renderer, setRenderer] = useState<WebGLRenderer | null>(null);
  const [dragManager, setDragManager] = useState<DragManager | null>(null);
  const [selectionManager, setSelectionManager] =
    useState<SelectionManager | null>(null);
  const [viewport, setViewport] = useState({ scale: 1, x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [selectedShapes, setSelectedShapes] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (canvasRef.current && !renderer) {
      const newRenderer = new WebGLRenderer(canvasRef.current);
      const newSelectionManager = new SelectionManager(
        newRenderer,
        setSelectedShapes
      );
      const newDragManager = new DragManager(newRenderer, newSelectionManager);

      newRenderer.setViewport(viewport.x, viewport.y, width, height);
      newRenderer.render();

      setRenderer(newRenderer);
      setSelectionManager(newSelectionManager);
      setDragManager(newDragManager);
    }
  }, [height, renderer, viewport.x, viewport.y, width]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e: WheelEvent): void => {
      e.preventDefault();
      if (!renderer) return;

      const newScale = Math.min(
        Math.max(0.1, viewport.scale * (1 - e.deltaY * 0.001)),
        10
      );

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      renderer.zoom(newScale, x, y);
      renderer.render();
      setViewport((prev) => ({ ...prev, scale: newScale }));
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return (): void => {
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [renderer, viewport.scale]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>): void => {
      if (e.button === 0) {
        const { x: canvasX, y: canvasY } = getCanvasRelativePosition(
          canvasRef.current!,
          e.clientX,
          e.clientY
        );
        if (e.shiftKey && selectionManager) {
          selectionManager.startSelection(e.nativeEvent);
          return;
        }

        const shapes = renderer?.getShapes() ?? [];
        const selectedShapes =
          selectionManager?.getSelectedShapes() ?? new Set();

        for (const shape of shapes) {
          if (dragManager?.hitTest(canvasX, canvasY, shape)) {
            if (!Array.from(selectedShapes).some((s) => s.id === shape.id)) {
              selectionManager?.clearSelectedShapes();
            }
            dragManager.startDrag(e.nativeEvent, shape);
            return;
          }
        }

        selectionManager?.clearSelectedShapes();

        setIsDragging(true);
        if (canvasRef.current) {
          canvasRef.current.style.cursor = 'grabbing';
        }
      }
    },
    [renderer, dragManager, selectionManager]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>): void => {
      if (selectionManager?.isSelecting) {
        selectionManager.updateSelection(e.nativeEvent);
      } else if (dragManager?.isDragging) {
        dragManager.drag(e.nativeEvent);
      } else if (isDragging && renderer) {
        renderer.pan(e.movementX / 2, e.movementY / 2);
      }
    },
    [selectionManager, dragManager, isDragging, renderer]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>): void => {
      dragManager?.endDrag(e.nativeEvent);
      selectionManager?.endSelection();
      setIsDragging(false);

      if (canvasRef.current) {
        canvasRef.current.style.cursor = 'grab';
      }
    },
    [dragManager, selectionManager]
  );

  return {
    canvasRef,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    renderer,
    selectedShapes,
  };
}
