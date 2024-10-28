import React, { useEffect, useRef } from 'react';

type StageProps = {
  width?: string;
  height?: string;
};

export function Stage(props: StageProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { width, height } = props;

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      console.error('Canvas element not found.');
      return;
    }

    const gl = canvas.getContext('webgl');

    if (!gl) {
      console.error('WebGL is not supported in this browser.');
      return;
    }
  }, []);

  return (
    <div style={{ width, height }}>
      <canvas ref={canvasRef} width={window.innerWidth} height={window.innerHeight} />
    </div>
  );
}