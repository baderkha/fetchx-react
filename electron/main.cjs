const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const ElectronStore = require('electron-store');

const isDev = !app.isPackaged;
let appStateStore = null;

function createWindow() {
  const win = new BrowserWindow({
    width: 1560,
    height: 980,
    minWidth: 1200,
    minHeight: 760,
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: 12, y: 10 },
    backgroundColor: '#000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    icon: path.join(__dirname, 'icon.png'),
  });

  if (isDev) {
    win.loadURL('http://localhost:5173');
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
}

const http = require('http');
const https = require('https');
const { URL } = require('url');

function sendNativeRequest(url, options, body) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol === 'https:' ? https : http;
    const startAt = performance.now();
    const marks = [];

    const mark = (label) => {
      marks.push({ label, ms: Math.max(0, Math.round(performance.now() - startAt)) });
    };

    mark('Request initialized');

    const reqOptions = {
      ...options,
      headers: options.headers || {},
    };

    let rawRequest = '';
    const req = protocol.request(url, reqOptions, (res) => {
      mark('First byte received (TTFB)');

      const responseHeaders = res.headers;
      let resBody = '';
      const chunks = [];

      res.on('data', (chunk) => {
        chunks.push(chunk);
      });

      res.on('end', () => {
        mark('Response fully received');
        const buffer = Buffer.concat(chunks);
        const textBody = buffer.toString('utf8');

        // Construct raw request preview
        const pathWithQuery = `${urlObj.pathname || '/'}${urlObj.search || ''}`;
        const requestHost = urlObj.port ? `${urlObj.hostname}:${urlObj.port}` : urlObj.hostname;

        const rawReqLines = [
          `${reqOptions.method || 'GET'} ${pathWithQuery} HTTP/1.1`,
          `Host: ${requestHost}`,
          ...Object.entries(reqOptions.headers).map(([k, v]) => `${k}: ${v}`),
        ];
        if (body) rawReqLines.push('', body);
        rawRequest = rawReqLines.join('\n');

        // Construct raw response preview
        const rawResLines = [
          `HTTP/1.1 ${res.statusCode} ${res.statusMessage || ''}`,
          ...Object.entries(responseHeaders).map(([k, v]) => `${k}: ${v}`),
          '',
          textBody,
        ];
        const rawResponse = rawResLines.join('\n');

        resolve({
          ok: true,
          status: res.statusCode,
          elapsedMs: Math.max(1, Math.round(performance.now() - startAt)),
          headers: responseHeaders,
          body: textBody,
          rawRequest,
          rawResponse,
          timeline: marks,
        });
      });
    });

    req.on('socket', (socket) => {
      mark('Socket assigned');

      socket.on('lookup', () => {
        mark('DNS Lookup complete');
      });

      socket.on('connect', () => {
        mark('TCP Connection established');
      });

      socket.on('secureConnect', () => {
        mark('TLS Handshake complete');
      });
    });

    req.on('finish', () => {
      mark('Request sent to server');
    });

    req.on('error', (error) => {
      mark('Socket error');
      reject(error);
    });

    if (body) {
      req.write(body);
    }
    req.end();
  });
}

app.setName('fetchx');
app.setAboutPanelOptions({
  applicationName: 'fetchx',
  applicationVersion: app.getVersion(),
  version: app.getVersion(),
  copyright: 'Copyright © Ahmad Baderkhan',
  iconPath: path.join(__dirname, 'icon.png'),
});

if (process.platform === 'darwin') {
  app.dock.setIcon(path.join(__dirname, 'icon.png'));
}

app.whenReady().then(() => {
  appStateStore = new ElectronStore({
    name: 'fetchx-state',
    clearInvalidConfig: true,
  });

  ipcMain.handle('fetchx:send', async (_event, payload) => {
    try {
      const url = String(payload.url || '').trim();
      const options = {
        method: (payload.method || 'GET').toUpperCase(),
        headers: payload.headers || {},
      };
      const body = typeof payload.body === 'string' ? payload.body : '';

      return await sendNativeRequest(url, options, body);
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
        elapsedMs: 0,
        timeline: [], // Note: marks are lost on extreme failure but sendNativeRequest handles most
      };
    }
  });

  ipcMain.handle('fetchx:state:get', async () => {
    try {
      return appStateStore?.get('state') || null;
    } catch {
      return null;
    }
  });

  ipcMain.handle('fetchx:state:set', async (_event, payload) => {
    try {
      if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return false;
      appStateStore?.set('state', payload);
      return true;
    } catch {
      return false;
    }
  });

  ipcMain.on('window:minimize', () => {
    BrowserWindow.getFocusedWindow()?.minimize();
  });

  ipcMain.on('window:maximize', () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win?.isMaximized()) {
      win.unmaximize();
    } else {
      win?.maximize();
    }
  });

  ipcMain.on('window:close', () => {
    BrowserWindow.getFocusedWindow()?.close();
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
