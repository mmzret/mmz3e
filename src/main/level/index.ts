import { BufferToUint16Array, BufferToUint8Array, decompressLZ77, readdirRecursively } from '../helper';
import { ResetStage, Stage, getMetatileSheet } from './stage';
import { getTileset } from './tileset';
import fs from 'fs';
import path from 'path';
import { createCanvas } from 'canvas';
import { PATH } from '../project';

export const loadTileset = (n: number) => {
  const tileset = getTileset(n);
  const dir = path.join(Stage.tilesetPath, String(n));
  const files = readdirRecursively(dir);

  for (const file of files) {
    const arr = file.split('/');
    const filename = arr[arr.length - 1] ?? '';

    switch (filename) {
      case 'tiles.4bpp': {
        tileset.bpp = new Uint8Array(fs.readFileSync(file));
        break;
      }

      case 'tiles.4bpp.lz': {
        tileset.bpp = decompressLZ77(BufferToUint8Array(fs.readFileSync(file)));
        break;
      }

      default: {
        if (filename.endsWith('.pal')) {
          const palID = Number(filename.split('.')[0]);
          tileset.palettes.set(BufferToUint16Array(fs.readFileSync(file)), palID * 16);
        }
        break;
      }
    }
  }

  return tileset;
};

export const loadStage = (dir: string): [string, Uint8Array, number[]] => {
  ResetStage();

  const files = readdirRecursively(dir);
  for (const file of files) {
    const arr = file.split('/');
    const filename = arr[arr.length - 1] ?? '';

    switch (filename) {
      case 'metatile.bin': {
        Stage.metatiles = BufferToUint16Array(fs.readFileSync(file));
        break;
      }

      case 'metatile_attr.bin': {
        Stage.metatileAttr = BufferToUint16Array(fs.readFileSync(file));
        break;
      }

      case 'screen.bin': {
        Stage.screen = BufferToUint16Array(fs.readFileSync(file));
        break;
      }

      case 'layer1.bin': {
        Stage.layer = BufferToUint8Array(fs.readFileSync(file));
        break;
      }

      case 'tileset_offset.bin': {
        Stage.tilesetPairs = BufferToUint8Array(fs.readFileSync(file)).slice(4);
        break;
      }

      case 'stage.json': {
        const stage = JSON.parse(fs.readFileSync(file, 'utf-8'));
        Stage.tilesetPath = path.join(PATH.project, PATH.tileset, stage.tileset);
        break;
      }
    }
  }

  const tilesetPairOptions = new Set<number>();
  for (const pair of Stage.tilesetPairs) {
    tilesetPairOptions.add(pair);
  }

  const defaultTilesetPair = Array.from(tilesetPairOptions)[0];
  return [getMetatileSheet(defaultTilesetPair, Stage.metatiles).toDataURL(), Stage.layer, Array.from(tilesetPairOptions)];
};

export const createScreen = (x: number, y: number): [string, string] => {
  const w = Stage.layer[0];
  const idx = y * w + x;
  const id = Stage.layer[4 + idx];
  const tilesetPair = Stage.tilesetPairs.at(idx) ?? 0;
  const sheet = getMetatileSheet(tilesetPair, Stage.metatiles);

  const screen = Stage.screen.slice(id * 150, (id + 1) * 150);

  const canvas = createCanvas(240, 160);
  const ctx = canvas.getContext('2d', { alpha: true });
  if (ctx) {
    if (screen.length === 150) {
      for (let i = 0; i < 150; i++) {
        const id = screen[i];
        const [x, y] = [id % 16, Math.floor(id / 16)];
        ctx.drawImage(sheet, x * 16, y * 16, 16, 16, (i % 15) * 16, Math.floor(i / 15) * 16, 16, 16);
      }
    }
  }

  const url = canvas.toDataURL();
  return [url, sheet.toDataURL()];
};

export const getStageList = (): string[] => {
  const results: string[] = [];
  const stages = fs.readdirSync(path.join(PATH.project, PATH.stage));
  for (const s of stages) {
    const stage = path.join(PATH.project, PATH.stage, s);
    const isDir = fs.statSync(stage).isDirectory();
    if (isDir) {
      const files = fs.readdirSync(stage);
      for (const f of files) {
        if (f === 'stage.json') {
          // const json = JSON.parse(fs.readFileSync(path.join(stage, f), 'utf-8'));
          results.push(s);
        }
      }
    }
  }
  return results;
};

export const getMetatileInfo = (metatileID: number) => {
  const tiles: any[] = [];
  for (let i = 0; i < 4; i++) {
    const mapData = Stage.metatiles[metatileID * 4 + i];
    const tileID = mapData & 0x3ff;
    const paletteID = mapData >> 12;
    const info = {
      tileID,
      paletteID,
    };
    tiles.push(info);
  }
  const attr = Stage.metatileAttr[metatileID] ?? 0;
  return {
    tiles,
    attr,
  };
};
