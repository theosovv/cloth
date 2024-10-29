import React from 'react';
import { createRoot } from 'react-dom/client';
import { Canvas, Triangle } from '../src';

const container = document.getElementById('app');
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <Canvas width={window.innerWidth} height={window.innerHeight}>
      <Triangle 
        x1={100} y1={200}
        x2={200} y2={200}
        x3={300} y3={100}
        strokeColor={[0, 0, 0, 1]}
        fillColor={[1, 0, 0, 0.5]}
        thickness={2}
      />
    </Canvas>
  </React.StrictMode>,
);