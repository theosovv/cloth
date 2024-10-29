import { useEffect } from 'react';
import { useRenderer } from '../../context/CanvasContext';

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

  useEffect(() => {
    if (renderer) {
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
    }
  }, [text, x, y, color, fontSize, fontFamily, textAlign, baseline, renderer]);

  return null;
}