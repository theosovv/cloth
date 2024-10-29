import { useEffect } from 'react';
import { useAddToRenderQueue, useRenderer } from '../../context/CanvasContext';

interface TextProps {
  text: string;
  x: number;
  y: number;
  color: [number, number, number, number];
  fontSize?: number;
  fontFamily?: string;
  textAlign?: 'left' | 'center' | 'right';
  baseline?: 'top' | 'middle' | 'bottom';
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
  const addToRenderQueue = useAddToRenderQueue();

  useEffect(() => {
    if (renderer && addToRenderQueue) {
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
      addToRenderQueue(renderFn);
      renderer.addToRenderQueue(renderFn);
      renderer.render();
    }
  }, [text, x, y, color, fontSize, fontFamily, textAlign, baseline, renderer]);

  return null;
}