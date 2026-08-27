// ============================================
// KASHOMBA ELECTRICAL SYSTEM - ELECTRON MAIN
// ============================================

const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

// Disable F12 DevTools kabisa
let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1000,
        minHeight: 700,
        icon: path.join(__dirname, 'assets', 'logo.png'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            devTools: false  // Hii inafunga F12 kabisa
        }
    });

    // Load index.html
    mainWindow.loadFile('index.html');

    // Remove menu bar (hii inazuia access ya DevTools kupitia menu)
    Menu.setApplicationMenu(null);

    // Prevent opening devtools kwa njia yoyote
    mainWindow.webContents.on('devtools-opened', () => {
        mainWindow.webContents.closeDevTools();
    });

    // Prevent right click (context menu)
    mainWindow.webContents.on('context-menu', (e) => {
        e.preventDefault();
    });

    // Prevent keyboard shortcuts za devtools (F12, Ctrl+Shift+I, Ctrl+U)
    mainWindow.webContents.on('before-input-event', (event, input) => {
        if (
            input.key === 'F12' ||
            (input.control && input.shift && (input.key === 'I' || input.key === 'i' || input.key === 'J' || input.key === 'j' || input.key === 'C' || input.key === 'c')) ||
            (input.control && (input.key === 'U' || input.key === 'u'))
        ) {
            event.preventDefault();
        }
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});