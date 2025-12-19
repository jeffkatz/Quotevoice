import { app, BrowserWindow } from 'electron';
import path from 'path';
import { setupIpcHandlers } from './ipcHandlers';
import { DatabaseManager } from './database';


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
DatabaseManager.getInstance();

app.whenReady().then(() => {
    setupIpcHandlers();

    // Create custom menu
    const { Menu } = require('electron');
    const template = [
        {
            label: 'File',
            submenu: [
                {
                    label: 'Create Document',
                    accelerator: 'CmdOrCtrl+N',
                    click: () => mainWindow?.webContents.send('navigate-to', '/invoices/new')
                },
                { type: 'separator' },
                { role: 'quit' }
            ]
        },
        {
            label: 'View',
            submenu: [
                {
                    label: 'Dashboard',
                    click: () => mainWindow?.webContents.send('navigate-to', '/')
                },
                {
                    label: 'Documents',
                    click: () => mainWindow?.webContents.send('navigate-to', '/invoices')
                },
                {
                    label: 'Clients',
                    click: () => mainWindow?.webContents.send('navigate-to', '/clients')
                },

                { type: 'separator' },
                { role: 'reload' },
                { role: 'toggledevtools' }
            ]
        },
        {
            label: 'Window',
            submenu: [
                { role: 'minimize' },
                { role: 'zoom' },
                { role: 'close' }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);

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
