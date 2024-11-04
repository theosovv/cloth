import React, { createContext, useContext } from 'react';
import { WebGLRenderer } from '../core/renderer';

interface CanvasContextType {
  renderer: WebGLRenderer;
  selectedShapes: Set<string>;
}

const CanvasContext = createContext<CanvasContextType | null>(null);

export function CanvasProvider({
  children,
  renderer,
  selectedShapes,
}: {
  children: React.ReactNode;
  renderer: WebGLRenderer;
  selectedShapes: Set<string>;
}): JSX.Element {
  return (
    <CanvasContext.Provider value={{ renderer, selectedShapes }}>
      {children}
    </CanvasContext.Provider>
  );
}

export function useRenderer(): WebGLRenderer | undefined {
  const context = useContext(CanvasContext);
  return context?.renderer;
}

export function useSelectedShapes(): Set<string> | undefined {
  const context = useContext(CanvasContext);
  return context?.selectedShapes;
}
