const { app, BrowserWindow } = require('electron');
const path = require('path');
const dotenv = require('dotenv');
const { autoUpdater } = require('electron-updater');

// Load env before starting express
dotenv.config({ path: path.join(__dirname, '.env') });

function createWindow () {
  // Start the Express backend after Electron is fully ready
  // This fixes the Mongoose mongodb+srv:// DNS resolution bugs in Electron
  require('./index.js'); 
  
  const win = new BrowserWindow({
    title: "Advent Engineers Admin Panel",
    icon: path.join(__dirname, 'assets', 'advent_logo.ico'),
    autoHideMenuBar: true,
    show: false, // Hide until maximized
    webPreferences: {
      nodeIntegration: true
    }
  });

  win.maximize(); // Force it to fill the screen
  win.setResizable(false); // Prevent dragging edges
  win.setMaximizable(false); // Gray out the middle button
  win.show(); // Show it securely locked

  // The backend runs on process.env.PORT or 5000 by default (but index.js says 3002 default)
  // Let's use the actual port being listened to
  const PORT = process.env.PORT || 3002;

  // Give Express a tiny bit of time to start up, then load the URL
  setTimeout(() => {
    win.loadURL(`http://localhost:${PORT}`);
  }, 1000);
}

app.whenReady().then(() => {
  createWindow();
  // Check for updates silently in the background
  autoUpdater.checkForUpdatesAndNotify();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
