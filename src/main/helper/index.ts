import fs from 'fs';
import path from 'path';
import archiver from 'archiver';

export * from './bpp';

export type GraphicProp = '4bpp' | '8bpp' | 'lz77' | 'no_pal' | 'chunked';

export type GraphicHeader = {
  name: string;
  ofs: number;
  chunkSize: number;
  props: GraphicProp[];
  palette?: {
    color: number;
    id: number;
  };
  files?: string[];
};

export const readdirRecursively = (dir: string, files: string[] = []) => {
  const paths = fs.readdirSync(dir);
  const dirs: string[] = [];
  for (const path of paths) {
    const stats = fs.statSync(`${dir}/${path}`);
    if (stats.isDirectory()) {
      dirs.push(`${dir}/${path}`);
    } else {
      files.push(`${dir}/${path}`);
    }
  }
  for (const d of dirs) {
    files = readdirRecursively(d, files);
  }
  return files;
};

/**
 * Decompresse LZ77 compressed data.
 * @param data Compressed data
 * @returns `Uint8Array` of decompressed data
 */
export const decompressLZ77 = (data: Uint8Array): Uint8Array => {
  let ofs = 0;
  const id = data[ofs++];
  if (id !== 0x10) {
    return new Uint8Array(0);
  }
  const decompressedSize = data[ofs] | (data[ofs + 1] << 8) | (data[ofs + 2] << 16);
  ofs += 3;
  const result = new Uint8Array(decompressedSize);
  let resultOfs = 0;

  const BUFFER_LENGTH = 0x1000;
  const buffer = new Uint8Array(BUFFER_LENGTH);
  let bufferOffset = 0;
  let currentOutsize = 0;
  let flags = 0;
  let mask = 1;

  while (currentOutsize < decompressedSize) {
    if (mask == 1) {
      flags = data[ofs++] & 0xff;
      mask = 0x80;
    } else {
      mask = mask >> 1;
    }

    if ((flags & mask) > 0) {
      const byte1 = data[ofs++];
      const byte2 = data[ofs++];
      const len = (byte1 >> 4) + 3;
      const disp = (((byte1 & 0xf) << 8) | byte2) + 1;
      if (disp > currentOutsize) {
        throw new Error(`Size Error: ${disp} > ${currentOutsize}`);
      }

      let bufIdx = bufferOffset + BUFFER_LENGTH - disp;
      for (let i = 0; i < len; i++) {
        const next = buffer[bufIdx % BUFFER_LENGTH];
        bufIdx++;
        result[resultOfs++] = next;
        buffer[bufferOffset] = next;
        bufferOffset = (bufferOffset + 1) % BUFFER_LENGTH;
      }
      currentOutsize += len;
    } else {
      const next = data[ofs++];
      currentOutsize++;
      result[resultOfs++] = next;
      buffer[bufferOffset] = next;
      bufferOffset = (bufferOffset + 1) % BUFFER_LENGTH;
    }
  }

  return result;
};

export const BufferToUint16Array = (buffer: Buffer): Uint16Array => {
  const result = new Uint16Array(buffer.buffer, buffer.byteOffset, buffer.length / 2);
  return result;
};

export const BufferToUint8Array = (buffer: Buffer): Uint8Array => {
  const result = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.length);
  return result;
};

export const loadJSON = (json_path: string) => {
  const data = JSON.parse(fs.readFileSync(json_path, 'utf-8'));
  return data;
};

export const ReadGraphicHeader = (path: string): { data: GraphicHeader[] } => {
  return loadJSON(path) as { data: GraphicHeader[] };
};

export const getBackdropColor = (png: Uint8Array): [number, number, number] => {
  let ofs = 8;
  while (ofs < png.length) {
    const chunkSize = png[ofs + 3] | (png[ofs + 2] << 8) | (png[ofs + 1] << 16) | (png[ofs] << 24);
    ofs += 4;
    const chunkType = String.fromCharCode(png[ofs], png[ofs + 1], png[ofs + 2], png[ofs + 3]);
    ofs += 4;
    if (chunkType === 'PLTE') {
      const r = png[ofs];
      const g = png[ofs + 1];
      const b = png[ofs + 2];
      return [r, g, b];
    }
    ofs += chunkSize;
    ofs += 4; // crc
  }
  return [0, 0, 0];
};

export const zipDataURLs = (outputPath: string, urls: string[]) => {
  let archive = archiver.create('zip', {});
  const output = fs.createWriteStream(outputPath);
  archive.pipe(output);
  urls.forEach((dataURL, i) => {
    const raw = Buffer.from(dataURL.split(',')[1], 'base64');
    archive.append(raw, { name: `${i}.png` });
  });
  archive.finalize();
  output.on('close', function () {
    // zip圧縮完了すると発火する
    var archive_size = archive.pointer();
    console.log(`complete! total size : ${archive_size} bytes`);
  });
};
