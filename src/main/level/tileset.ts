export type Tileset = {
  bpp: Uint8Array;
  palettes: Uint16Array; // uint16[256]
};

const getDefaultTileset = (): Tileset => {
  return {
    bpp: Uint8Array.from([0]),
    palettes: new Uint16Array(256),
  };
};

export const getTileset = (n: number): Tileset => {
  if (Tilesets.has(n)) {
    return Tilesets.get(n)!;
  }
  const tileset = getDefaultTileset();
  Tilesets.set(n, tileset);
  return tileset;
};

export const Tilesets = new Map<number, Tileset>();
