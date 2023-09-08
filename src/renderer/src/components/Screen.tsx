import { currentScreenState } from '../state';
import { useRecoilValue } from 'recoil';
import React from 'react';
import { Image as KonvaImage, Layer, Stage } from 'react-konva';
import { useImageURL } from '../hooks/useImageURL';
import { Grid } from './Grid';
import { Box } from '@chakra-ui/react';

export const Screen: React.FC = React.memo(() => {
  const image = useImageURL(useRecoilValue(currentScreenState));

  return (
    <Box>
      <Stage width={480} height={320}>
        <Layer>
          <KonvaImage image={image} scaleX={2} scaleY={2} x={0} y={0} />
          <Grid size={32} pixelW={480} pixelH={320} />
        </Layer>
      </Stage>
    </Box>
  );
});
