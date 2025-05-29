const { app, BrowserWindow } = require('electron');
const path = require('path');
const { ipcMain, dialog } = require('electron');


app.disableHardwareAcceleration(); 

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
     preload: path.join(__dirname, 'preload.js'),
  contextIsolation: true,
  nodeIntegration: false,     
  sandbox: false    
    }
  });
  win.loadFile('renderer/index.html');

  ipcMain.handle('salvar-dialogo', async (event, { padrao, extensao }) => {
  const { canceled, filePath } = await dialog.showSaveDialog({
    defaultPath: padrao,
    filters: [{ name: extensao.toUpperCase(), extensions: [extensao] }]
  });

  if (canceled) return null;
  return filePath;
});

}


app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});