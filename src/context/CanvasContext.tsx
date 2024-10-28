import React from 'react';
import { WebGLRenderer } from '../core/renderer';

export const CanvasContext = React.createContext<{renderer: WebGLRenderer | null;}>({ renderer: null });

export const CanvasProvider: React.FC<{ children: React.ReactNode; renderer: WebGLRenderer | null }> = ({ renderer, children }) => (
  <CanvasContext.Provider value={{ renderer }}>
    {children}
  </CanvasContext.Provider>
);


export function useRenderer(): WebGLRenderer | null {
  const { renderer } = React.useContext(CanvasContext);

  return renderer;
}