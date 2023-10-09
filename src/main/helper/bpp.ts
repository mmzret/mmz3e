import { createCanvas } from 'canvas';

export type RGB = [number, number, number];

export const createTile = (bpp: Uint8Array, pal: Uint16Array, xflip: boolean, yflip: boolean): ImageData => {
  const canvas = createCanvas(8, 8);
  const tile = canvas.getContext('2d', { alpha: false });
  if (tile) {
    const rgb = convert4BppToRGB(bpp, pal);
    const imageData = tile.createImageData(8, 8);
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        let [col, row] = [x, y];
        if (xflip) {
          col = 7 - x;
        }
        if (yflip) {
          row = 7 - y;
        }
        const i = row * 8 + col;
        if (i >= rgb.length) {
          continue;
        }
        imageData.data[(y * 8 + x) * 4] = rgb[i][0];
        imageData.data[(y * 8 + x) * 4 + 1] = rgb[i][1];
        imageData.data[(y * 8 + x) * 4 + 2] = rgb[i][2];
        imageData.data[(y * 8 + x) * 4 + 3] = 255;
      }
    }
    tile.putImageData(imageData, 0, 0);
  }
  const imageData = tile!.getImageData(0, 0, 8, 8) as ImageData;
  return imageData;
};

const convert4BppToRGB = (bpp: Uint8Array, pal: Uint16Array): RGB[] => {
  let ofs = 0;
  const result: RGB[] = new Array(bpp.length * 2);
  for (;;) {
    if (ofs >= bpp.length) {
      return result;
    }

    const data = bpp[ofs];
    const [lo, hi] = convert1ByteToRGB(data, pal);
    result[ofs * 2] = lo;
    result[ofs * 2 + 1] = hi;
    ofs++;
  }
};

const convert1ByteToRGB = (byteData: number, pal: Uint16Array): [RGB, RGB] => {
  const [hi, lo] = [(byteData >> 4) & 0xf, byteData & 0xf];

  return [convert4BitToRGB(lo, pal), convert4BitToRGB(hi, pal)];
};

const convert4BitToRGB = (palIdx4Bit: number, pal: Uint16Array): RGB => {
  const c = pal[palIdx4Bit];
  const result: RGB = [0, 0, 0];
  result[0] = (c & 0x1f) * 8; // R
  result[1] = ((c >> 5) & 0x1f) * 8; // G
  result[2] = ((c >> 10) & 0x1f) * 8; // B

  return result;
};
