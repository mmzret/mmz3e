import { nativeImage } from 'electron';
import fs from 'fs';
import path from 'path';

export const PATH = {
  project: '',
  stage: 'data/stage',
  tileset: 'data/tilesets',
  sprites: 'sprites',
};

export const loadProject = (project_path: string) => {
  PATH.project = project_path;
};

export const loadLocalImage = (img_path: string): Electron.NativeImage => {
  const img = nativeImage.createFromPath(img_path);
  return img;
};
