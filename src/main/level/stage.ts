import { loadTileset } from '.';
import { createTile } from '../helper';
import { Tileset, Tilesets } from './tileset';
import { Canvas, createCanvas } from 'canvas';

const METATILE_SIZE = 16;

export const Stage = {
  metatiles: new Uint16Array([0, 0, 0, 0]),
  metatileAttr: new Uint16Array(0),
  screen: new Uint16Array(0),
  layer: new Uint8Array(0),
  tilesetPairs: new Uint8Array(0),
  tilesetPath: './',
  metatileSheets: new Map<number, Canvas>(),
};

export const ResetStage = () => {
  Stage.metatiles = new Uint16Array([0, 0, 0, 0]);
  Stage.metatileAttr = new Uint16Array(0);
  Stage.screen = new Uint16Array(0);
  Stage.layer = new Uint8Array(0);
  Stage.tilesetPairs = new Uint8Array(0);
  Stage.tilesetPath = './';
  Stage.metatileSheets.clear();

  Tilesets.clear();
};

export const getMetatileSheet = (tilesetPair: number, data: Uint16Array): Canvas => {
  if (Stage.metatileSheets.has(tilesetPair)) {
    return Stage.metatileSheets.get(tilesetPair)!;
  }
  const tileset1 = loadTileset((tilesetPair >> 4) & 0x0f);
  const tileset2 = loadTileset(tilesetPair & 0x0f);

  const canvas = createCanvas(METATILE_SIZE * 16, (data.length / 4 / 16) * METATILE_SIZE);
  const sheet = canvas.getContext('2d', { alpha: false });
  if (sheet) {
    const cache = new Map<number, ImageData>();
    for (let i = 0; i < data.length; i++) {
      const metatileID = Math.floor(i / 4);
      const mapData = data[i];
      let tileID = mapData & 0x3ff;
      const [xflip, yflip] = [mapData & (1 << 10), mapData & (1 << 11)];
      const paletteID = mapData >> 12;
      const x = (metatileID % 16) * 16 + (i % 2) * 8;
      const y = Math.floor(metatileID / 16) * 16 + (i % 4 < 2 ? 0 : 8);

      let tileset: Tileset;
      const cacheID = tileID | (paletteID << 12) | xflip | yflip;
      if (tileID > 511) {
        tileID -= 512;
        tileset = tileset2;
      } else {
        tileset = tileset1;
      }

      let tile: ImageData;
      if (cache.has(cacheID)) {
        tile = cache.get(cacheID)!;
      } else {
        tile = createTile(tileset.bpp.slice(tileID * 32, (tileID + 1) * 32), tileset.palettes.slice(paletteID * 16, (paletteID + 1) * 16), !!xflip, !!yflip);
        cache.set(cacheID, tile);
      }
      sheet.putImageData(tile, x, y);
    }
  }
  return canvas;
};
