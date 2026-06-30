const { app, BrowserWindow } = require('electron');
const path = require('path');
const dotenv = require('dotenv');
const { autoUpdater } = require('electron-updater');

// Load env before starting express
dotenv.config({ path: path.join(__dirname, '.env') });

let mainWindow = null;

function createWindow () {
  // Start the Express backend after Electron is fully ready
  // This fixes the Mongoose mongodb+srv:// DNS resolution bugs in Electron
  require('./index.js'); 
  
  mainWindow = new BrowserWindow({
    title: "Advent Engineers Admin Panel",
    icon: path.join(__dirname, 'assets', 'advent_logo.ico'),
    autoHideMenuBar: true,
    show: false, // Hide until maximized
    webPreferences: {
      nodeIntegration: true
    }
  });

  mainWindow.maximize(); // Force it to fill the screen
  mainWindow.setResizable(false); // Prevent dragging edges
  mainWindow.setMaximizable(false); // Gray out the middle button
  mainWindow.show(); // Show it securely locked

  // The backend runs on process.env.PORT or 5000 by default (but index.js says 3002 default)
  // Let's use the actual port being listened to
  const PORT = process.env.PORT || 3002;

  // Give Express a tiny bit of time to start up, then load the URL
  setTimeout(() => {
    mainWindow.loadURL(`http://localhost:${PORT}`);
  }, 1000);
}

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, we should focus our window.
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    createWindow();
    // Check for updates silently in the background
    autoUpdater.checkForUpdatesAndNotify();
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
