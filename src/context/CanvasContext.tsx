import React, { createContext, useContext } from 'react';
import { WebGLRenderer } from '../core/renderer';

interface CanvasContextType {
  renderer: WebGLRenderer;
  addToRenderQueue: (renderFn: () => void) => void;
}

const CanvasContext = createContext<CanvasContextType | null>(null);

export function CanvasProvider({ 
  children, 
  renderer, 
  addToRenderQueue,
}: { 
  children: React.ReactNode; 
  renderer: WebGLRenderer;
  addToRenderQueue: (renderFn: () => void) => void;
}): JSX.Element {
  return (
    <CanvasContext.Provider value={{ renderer, addToRenderQueue }}>
      {children}
    </CanvasContext.Provider>
  );
}


export function useRenderer(): WebGLRenderer | undefined {
  const context = useContext(CanvasContext);
  return context?.renderer;
}

export function useAddToRenderQueue(): ((renderFn: () => void) => void) | undefined {
  const context = useContext(CanvasContext);
  return context?.addToRenderQueue;
}