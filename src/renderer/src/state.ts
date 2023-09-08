import { atom, selectorFamily } from 'recoil';

export const metatileIDAtom = atom<Uint16Array>({
  key: 'MetatileID',
  default: new Uint16Array([0, 0, 0, 0]),
});

export const metatileAttrAtom = atom<Uint16Array>({
  key: 'MetatileAttr',
  default: new Uint16Array(0),
});

export const metatileSheet = atom<string>({
  key: 'MetatileSheet',
  default: '',
});

export const screenAtom = atom<Uint16Array>({
  key: 'Screen',
  default: new Uint16Array(0),
});

export const metatileFamily = selectorFamily<{ lt: number; rt: number; lb: number; rb: number }, number>({
  key: 'MetatileFamily',
  get:
    (index: number) =>
    ({ get }) => {
      const metatiles = get(metatileIDAtom);
      const metatile = metatiles.slice(index * 4, (index + 1) * 4);
      return {
        lt: metatile[0],
        rt: metatile[1],
        lb: metatile[2],
        rb: metatile[3],
      };
    },
});

export const screenFamily = selectorFamily<Uint16Array, number>({
  key: 'ScreenData',
  get:
    (index: number) =>
    ({ get }) => {
      const screen = get(screenAtom);
      return screen.slice(index * 150, (index + 1) * 150);
    },
});

export const layerState = atom<Uint8Array>({
  key: 'layer',
  default: new Uint8Array(0),
});

export const focusMetatileIDAtom = atom<number>({
  key: 'FocusMetatileID',
  default: 0,
});

export const currentScreenState = atom<string>({
  key: 'CurrentScreenStage',
  default: '',
});
