import React from 'react';
import { Box } from '@chakra-ui/react';
import useImage from 'use-image';
import { Image, Layer, Stage } from 'react-konva';
import { focusMetatileIDAtom } from '../state';
import { useSetRecoilState } from 'recoil';
import { KonvaEventObject } from 'konva/lib/Node';
import { Grid } from './Grid';

export const MetatileSheet: React.FC<{ sheetURL: string }> = ({ sheetURL }) => {
  const [image] = useImage(sheetURL);
  const setMetatileID = useSetRecoilState(focusMetatileIDAtom);

  const onClick = (e: KonvaEventObject<MouseEvent>) => {
    const [x, y] = [Math.floor(e.evt.offsetX / 32), Math.floor(e.evt.offsetY / 32)];
    setMetatileID(y * 16 + x);
  };

  const [w, h] = [image?.width ?? 0, image?.height ?? 0];

  return (
    <Box height="512px" overflowY="scroll">
      <Stage width={w * 2} height={h * 2}>
        <Layer>
          <Image image={image} scaleX={2} scaleY={2} />
          <Grid size={32} pixelW={w * 2} pixelH={h * 2} onClick={onClick} />
        </Layer>
      </Stage>
    </Box>
  );
};
