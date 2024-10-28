import React from 'react';
import { createRoot } from 'react-dom/client';
import { Canvas, Rectangle, Circle } from '../src';

const container = document.getElementById('app');
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <Canvas width={window.innerWidth} height={window.innerHeight}>
      <Rectangle 
        x={100} 
        y={100} 
        width={200} 
        height={150} 
        color={[1, 0, 0, 1]} 
      />
      <Circle 
        x={400} 
        y={300} 
        radius={75}
        color={[0, 0, 1, 0.5]} 
      />
    </Canvas>
  </React.StrictMode>,
);