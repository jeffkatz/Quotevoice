import { app, BrowserWindow } from 'electron';
import path from 'path';
import { setupIpcHandlers } from './ipcHandlers';
import { initDatabase } from './db';


let mainWindow: BrowserWindow | null = null;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
        // Customize your window frame/style here if you want a custom titlebar
        // titleBarStyle: 'hidden',
    });

    if (process.env.VITE_DEV_SERVER_URL) {
        mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }

    // Open the DevTools.
    mainWindow.webContents.openDevTools();
}

// Initialize things
initDatabase();

app.whenReady().then(() => {
    setupIpcHandlers();
    createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
