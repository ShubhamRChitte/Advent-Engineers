const { app, BrowserWindow } = require('electron');
const path = require('path');
const dotenv = require('dotenv');
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');

// Configure electron-log
Object.assign(console, log.functions);
log.transports.file.level = 'info';

// Load env before starting express
dotenv.config({ path: path.join(__dirname, '.env') });

// Force Express to use a dynamic port so we don't crash on EADDRINUSE
process.env.PORT = 0;

let mainWindow = null;

function createWindow () {
  // Start the Express backend after Electron is fully ready
  // This fixes the Mongoose mongodb+srv:// DNS resolution bugs in Electron
  const server = require('./index.js'); 
  
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

  // Wait for the Express server to actually start listening on its dynamic port
  const loadFrontend = () => {
    const port = server.address().port;
    console.log(`Electron detected Express running on dynamically assigned port ${port}`);
    mainWindow.loadURL(`http://localhost:${port}`).catch((err) => {
      console.error("Failed to load React frontend:", err);
      mainWindow.loadFile(path.join(__dirname, 'assets', 'error.html'));
    });
  };

  if (server.listening) {
    loadFrontend();
  } else {
    server.on('listening', loadFrontend);
  }
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
    
    // Auto-Updater Events
    autoUpdater.on('update-available', () => {
      require('electron').dialog.showMessageBox({
        type: 'info',
        title: 'Update Available',
        message: 'A new version of Advent Admin Panel is available. Downloading now...'
      });
    });

    autoUpdater.on('update-downloaded', () => {
      require('electron').dialog.showMessageBox({
        type: 'info',
        title: 'Update Ready',
        message: 'Update downloaded! The application will now restart to install the latest version.',
        buttons: ['Restart Now']
      }).then(() => {
        setImmediate(() => autoUpdater.quitAndInstall());
      });
    });

    autoUpdater.on('error', (err) => {
      log.error('AutoUpdater Error: ', err);
    });

    // Check for updates silently in the background
    autoUpdater.checkForUpdatesAndNotify();
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
