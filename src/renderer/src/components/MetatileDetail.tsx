import React, { useEffect } from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';
import { useImageURL } from '../hooks/useImageURL';
import { useRecoilValue } from 'recoil';
import { metatileAttrAtom, metatileFamily, metatileSheet } from '../state';
import { Image, Layer, Stage } from 'react-konva';

export const MetatileDetail: React.FC<{ metatileID: number }> = ({ metatileID }) => {
  const canvas = document.createElement('canvas');
  [canvas.width, canvas.height] = [16, 16];
  const sheet = useImageURL(useRecoilValue(metatileSheet));
  const metatile = useRecoilValue(metatileFamily(metatileID));
  const attr = useRecoilValue(metatileAttrAtom)[metatileID] ?? 0;

  const palettes = new Set<number>();
  palettes.add(metatile.lt >> 12);
  palettes.add(metatile.rt >> 12);
  palettes.add(metatile.lb >> 12);
  palettes.add(metatile.rb >> 12);

  useEffect(() => {
    const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
    if (ctx) {
      const id = metatileID;
      const [x, y] = [id % 16, Math.floor(id / 16)];
      ctx.drawImage(sheet, x * 16, y * 16, 16, 16, 0, 0, canvas.width, canvas.height);
    }
  }, [sheet]);

  return (
    <Flex border="1px">
      <Stage width={canvas.width * 4} height={canvas.height * 4}>
        <Layer>
          <Image image={canvas} scaleX={4} scaleY={4} />
        </Layer>
      </Stage>
      <Box pl={2}>
        <Text fontSize="xs">ID: {metatileID}</Text>
        <Text fontSize="xs">Attr: {attr}</Text>
        <Text fontSize="xs">Palette: {Array.from(palettes).join(',')}</Text>
      </Box>
    </Flex>
  );
};
