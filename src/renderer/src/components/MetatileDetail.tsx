import React, { useEffect, useState } from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';
import { useImageURL } from '../hooks/useImageURL';
import { Image, Layer, Stage } from 'react-konva';
import useImage from 'use-image';
import { toHex } from '@renderer/utils';

export const MetatileDetail: React.FC<{ sheetURL: string; metatileID: number }> = ({ sheetURL, metatileID }) => {
  const sheet = useImageURL(sheetURL);
  const [metatile, setMetatile] = useState<string>('');
  const [attr, setAttr] = useState<number>(0);
  const [palettes, setPalettes] = useState<number[]>([0]);
  const [image] = useImage(metatile);

  useEffect(() => {
    const getMetatileInfo = async () => {
      const { ok, data } = await window.electron.ipcRenderer.invoke('get-metatile-info', metatileID);
      if (!ok) return;
      console.log(data);
      setAttr(data.attr);
      const palettes = new Set<number>(data.tiles.map((t) => t.paletteID));
      setPalettes(Array.from(palettes));
    };
    getMetatileInfo();
  }, [metatileID]);

  useEffect(() => {
    const canvas = document.createElement('canvas');
    [canvas.width, canvas.height] = [16, 16];
    const ctx = canvas.getContext('2d', { alpha: false });
    if (ctx) {
      const id = metatileID;
      const [x, y] = [id % 16, Math.floor(id / 16)];
      ctx.drawImage(sheet, x * 16, y * 16, 16, 16, 0, 0, canvas.width, canvas.height);
      setMetatile(canvas.toDataURL());
    }
  }, [sheet, metatileID]);

  return (
    <Flex border="1px">
      <Stage width={16 * 4} height={16 * 4}>
        <Layer>
          <Image image={image} scaleX={4} scaleY={4} />
        </Layer>
      </Stage>
      <Box pl={2}>
        <Text fontSize="xs">ID: {metatileID}</Text>
        <Text fontSize="xs">Attr: {toHex(attr, 4, '0x')}</Text>
        <Text fontSize="xs">Palette: {Array.from(palettes).join(',')}</Text>
      </Box>
    </Flex>
  );
};
