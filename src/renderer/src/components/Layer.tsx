import React from 'react';
import { Image, Layer, Stage } from 'react-konva';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { currentScreenState, layerState, metatileSheet } from '../state';
import { Box } from '@chakra-ui/react';
import { KonvaEventObject } from 'konva/lib/Node';

const UNIT = {
  w: 16,
  h: 12,
};

export const LayerViewer: React.FC = () => {
  const [selected, setSelected] = React.useState<[number, number]>([0, 0]);
  const setScreen = useSetRecoilState(currentScreenState);
  const setSheet = useSetRecoilState(metatileSheet);
  const layer = useRecoilValue(layerState);
  if (layer.length < 4) return <></>;

  const unused = layer[1];
  const [w, h] = [layer[0], layer[3]];
  const screens = layer.slice(4);

  const canvas = document.createElement('canvas');
  [canvas.width, canvas.height] = [w * UNIT.w, h * UNIT.h];
  const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
  if (ctx) {
    ctx.fillStyle = `#C8C8C8`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (screens[y * w + x] !== unused) {
          ctx.fillStyle = `#FFFFFF`;
          ctx.fillRect(x * UNIT.w, y * UNIT.h, UNIT.w, UNIT.h);
          ctx.fillStyle = x === selected[0] && y === selected[1] ? `#F80000` : `#0000E0`;
          ctx.fillRect(x * UNIT.w + 1, y * UNIT.h + 1, UNIT.w - 2, UNIT.h - 2);
        }
      }
    }
  }

  const onClick = async (e: KonvaEventObject<MouseEvent>) => {
    const [x, y] = [Math.floor(e.evt.offsetX / UNIT.w), Math.floor(e.evt.offsetY / UNIT.h)];
    setSelected([x, y]);

    const { ok, data } = await window.electron.ipcRenderer.invoke('select-screen', x, y);
    if (!ok) return;
    setScreen(data[0]);
    setSheet(data[1]);
  };

  return (
    <Box width="480px" overflowX="scroll">
      <Stage width={canvas.width} height={canvas.height}>
        <Layer>
          <Image image={canvas} onClick={onClick} />
        </Layer>
      </Stage>
    </Box>
  );
};
