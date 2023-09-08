import { KonvaEventObject } from 'konva/lib/Node';
import React from 'react';
import { Rect } from 'react-konva';

type Props = {
  size: number;
  pixelW: number;
  pixelH: number;
  onClick?: (e: KonvaEventObject<MouseEvent>) => void;
};

export const Grid: React.FC<Props> = React.memo(({ size, pixelW, pixelH, onClick }) => {
  const w = Math.floor(pixelW / size);
  const h = Math.floor(pixelH / size);
  const cells: any[] = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      cells.push(<Rect key={y * w + x} x={x * size} y={y * size} width={size} height={size} stroke="gray" strokeWidth={1} onClick={onClick} />);
    }
  }
  return <>{cells}</>;
});
