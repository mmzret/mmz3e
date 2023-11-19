import { Canvas, createCanvas, loadImage } from 'canvas';
import fs from 'fs';
import path from 'path';
import { PATH, loadLocalImage } from '../project';
import { getBackdropColor } from '../helper';
import { nativeImage } from 'electron';

type Sequence = {
  frameIndex: number;
  duration: number;
}[];

type Metasprite = {
  sheetIdx: number;
  subsprites: Subsprite[];
};

type Subsprite = {
  tileNum: number;
  xflip: boolean;
  yflip: boolean;
  size: [number, number];
  x: number;
  y: number;
};

type SpriteFrame = {
  x: number;
  y: number;
  w: number;
  h: number;
  url: string;
};

export const loadSprite = async (sprite_path: string): Promise<{ frames: SpriteFrame[]; sequences: Sequence[] }> => {
  const metasprites = JSON.parse(fs.readFileSync(path.join(PATH.project, PATH.sprites, sprite_path, 'metasprite.json'), 'utf-8')).data as Metasprite[];
  const sprites: SpriteFrame[] = [];

  let sheets: string[] = [];
  const sheetDir = path.join(PATH.project, PATH.sprites, sprite_path, 'sheet');
  if (fs.existsSync(sheetDir)) {
    sheets = fs.readdirSync(sheetDir).filter((f) => f.endsWith('.png'));
  } else {
    sheets = fs.readdirSync(path.join(PATH.project, PATH.sprites, sprite_path)).filter((f) => f.endsWith('.png'));
  }

  for (let i = 0; i < metasprites.length; i++) {
    const m = metasprites[i];
    const idx = m.sheetIdx;
    for (const f of sheets) {
      if (idx === parseInt(f.split('.')[0])) {
        sprites.push(await createMetasprite(path.join(sheetDir, f), m));
        break;
      } else if (idx === 0 && sheets[0].startsWith('sheet')) {
        sprites.push(await createMetasprite(path.join(PATH.project, PATH.sprites, sprite_path, sheets[0]), m));
      }
    }
  }

  const size = [0, 0];
  for (const m of sprites) {
    if (m.w > size[0]) size[0] = m.w;
    if (m.h > size[1]) size[1] = m.h;
  }
  for (const m of sprites) {
    const canvas = createCanvas(size[0], size[1]);
    const ctx = canvas.getContext('2d', { alpha: true });
    if (ctx) {
      ctx.drawImage(await loadImage(m.url), size[0] - m.w, size[1] - m.h);
    }
    m.url = canvas.toDataURL();
  }

  const sequences = JSON.parse(fs.readFileSync(path.join(PATH.project, PATH.sprites, sprite_path, 'sequence.json'), 'utf-8')).data as Sequence[];
  return {
    frames: sprites,
    sequences,
  };
};

export const createMetasprite = async (sheet_path: string, m: Metasprite): Promise<SpriteFrame> => {
  const raw = fs.readFileSync(sheet_path);
  const backdrop = getBackdropColor(raw);

  const sheet = await makeBackdropTransparentForNativeImage(loadLocalImage(sheet_path), backdrop);
  const w = Math.floor(sheet.getSize().width / 8);

  const start = [0, 0];
  for (const s of m.subsprites) {
    if (s.x < start[0]) {
      start[0] = s.x;
    }
    if (s.y < start[1]) {
      start[1] = s.y;
    }
  }

  let size = [0, 0];
  for (const s of m.subsprites) {
    if (s.x + s.size[0] - start[0] > size[0]) {
      size[0] = s.x + s.size[0] - start[0];
    }
    if (s.y + s.size[1] - start[1] > size[1]) {
      size[1] = s.y + s.size[1] - start[1];
    }
  }
  // console.log(size);

  const metasprite = createCanvas(size[0], size[1]);

  for (const s of m.subsprites) {
    const subsprite = createCanvas(s.size[0], s.size[1]);

    if (s.xflip) {
      const ctx = subsprite.getContext('2d', { alpha: true });
      if (ctx) {
        ctx.translate(s.size[0], 0);
        ctx.scale(-1, 1);
      }
    }
    if (s.yflip) {
      const ctx = subsprite.getContext('2d', { alpha: true });
      if (ctx) {
        ctx.translate(0, s.size[1]);
        ctx.scale(1, -1);
      }
    }

    for (let yTile = 0; yTile < s.size[1] / 8; yTile++) {
      for (let xTile = 0; xTile < s.size[0] / 8; xTile++) {
        const tileNum = s.tileNum + xTile + yTile * (s.size[0] / 8);
        const x = (tileNum % w) * 8;
        const y = Math.floor(tileNum / w) * 8;
        const url = sheet.crop({ x, y, width: 8, height: 8 }).toDataURL();

        if (url !== 'data:image/png;base64,') {
          try {
            const img = await loadImage(url);
            subsprite.getContext('2d', { alpha: true })?.drawImage(img, xTile * 8, yTile * 8);
          } catch (e) {
            console.error(url, s);
            console.error(e);
            throw e;
          }
        }
      }
    }

    const ctx = metasprite.getContext('2d', { alpha: true });
    ctx?.drawImage(subsprite, s.x - start[0], s.y - start[1]);
  }

  // Replace backdrop color to transparent
  // metasprite = makeBackdropTransparent(metasprite, backdrop);

  const url = metasprite.toDataURL();
  return {
    x: start[0],
    y: start[1],
    w: size[0],
    h: size[1],
    url,
  };
};

// Replace backdrop color to transparent
const makeBackdropTransparent = (canvas: Canvas, backdrop: [number, number, number]): Canvas => {
  const ctx = canvas.getContext('2d', { alpha: true });
  if (ctx) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < imageData.data.length; i += 4) {
      if (imageData.data[i] === backdrop[0] && imageData.data[i + 1] === backdrop[1] && imageData.data[i + 2] === backdrop[2]) {
        imageData.data[i + 3] = 0;
      }
    }
    ctx.putImageData(imageData, 0, 0);
  }
  return canvas;
};

const makeBackdropTransparentForNativeImage = async (img: Electron.NativeImage, backdrop: [number, number, number]): Promise<Electron.NativeImage> => {
  const canvas = await getCanvasFromImage(img);
  const ctx = canvas.getContext('2d', { alpha: true });
  if (ctx) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < imageData.data.length; i += 4) {
      if (imageData.data[i] === backdrop[0] && imageData.data[i + 1] === backdrop[1] && imageData.data[i + 2] === backdrop[2]) {
        imageData.data[i + 3] = 0;
      }
    }
    ctx.putImageData(imageData, 0, 0);
  }
  const result = nativeImage.createFromDataURL(canvas.toDataURL());
  return result;
};

const getCanvasFromImage = async (img: Electron.NativeImage): Promise<Canvas> => {
  const raw = await loadImage(img.toDataURL());
  const canvas = createCanvas(img.getSize().width, img.getSize().height);
  const ctx = canvas.getContext('2d', { alpha: true });
  if (ctx) {
    ctx.drawImage(raw, 0, 0);
  }
  return canvas;
};
