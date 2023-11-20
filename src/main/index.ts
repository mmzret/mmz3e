import { app, shell, BrowserWindow, dialog, ipcMain } from 'electron';
import path, { join } from 'path';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import icon from '../../resources/icon.png?asset';
import { PATH, loadProject } from './project';
import { createScreen, getMetatileInfo, getStageList, loadStage } from './level';
import { loadSprite } from './sprite';
import { loadJSON, zipDataURLs } from './helper';

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
    },
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

// このメソッドは、Electronの初期化が終了し、ブラウザウィンドウを作成する準備ができたときに呼び出されます。
// いくつかのAPIは、このイベントが発生した後にのみ使用できます。
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron');

  // 開発環境ではF12でDevToolsをデフォルトでオープンまたはクローズし、本番環境では CommandOrControl + R を無視します。
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  createWindow();

  app.on('activate', function () {
    // macOSでは、ドックアイコンがクリックされ、他に開いているウィンドウがない場合、アプリでウィンドウを再作成するのが一般的だ。
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// macOSを除き、すべてのウィンドウが閉じたら終了する。
// macOSでは、ユーザーがCmd + Qで明示的に終了するまで、アプリケーションとそのメニューバーがアクティブなままであることが一般的です。
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// このファイルに、アプリ固有のメイン・プロセス・コードの残りを含めることができる。別のファイルにして、ここで要求することもできる。

ipcMain.handle('load-project', () => {
  const result = dialog.showOpenDialogSync({ properties: ['openDirectory'] });
  if (!result) return { ok: false };
  loadProject(result[0]);

  return { ok: true };
});

ipcMain.handle('load-stage', (_, name: string) => {
  const stage = path.join(PATH.project, PATH.stage, name);

  return { ok: true, data: loadStage(stage) };
});

ipcMain.handle('get-stage-list', () => {
  return { ok: true, data: getStageList() };
});

ipcMain.handle('select-screen', (_, x: number, y: number) => {
  return { ok: true, data: createScreen(x, y) };
});

ipcMain.handle('load-sprite', async (_, name: string) => {
  const result = await loadSprite(name);
  return { ok: true, data: result };
});

ipcMain.handle('get-sprite-list', async (_, dynamicOrStatic: 'dynamic' | 'static') => {
  let sprites: any;
  if (dynamicOrStatic === 'dynamic') {
    sprites = loadJSON(path.join(PATH.project, PATH.sprites, 'dynamic', 'sprite.json'));
  } else {
    sprites = loadJSON(path.join(PATH.project, PATH.sprites, 'static', 'sprite.json'));
  }
  const result = [...sprites.data];
  return { ok: true, data: result };
});

ipcMain.handle('get-metatile-info', (_, metatileID: number) => {
  return { ok: true, data: getMetatileInfo(metatileID) };
});

ipcMain.handle('download', (_, urls: string[]) => {
  zipDataURLs('./output.zip', urls);
  return { ok: true };
});
