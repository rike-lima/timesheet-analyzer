const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const remoteMain = require("@electron/remote/main");

app.disableHardwareAcceleration();

// Inicializa o remote antes de qualquer janela ser criada
remoteMain.initialize();

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 700,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  // Ativa o uso de @electron/remote para essa janela
  remoteMain.enable(win.webContents);

  win.loadFile("renderer/index.html");
}

// Diálogo customizado para salvar arquivo
ipcMain.handle("salvar-dialogo", async (event, { padrao, extensao }) => {
  const { canceled, filePath } = await dialog.showSaveDialog({
    defaultPath: padrao,
    filters: [{ name: extensao.toUpperCase(), extensions: [extensao] }],
  });

  return canceled ? null : filePath;
});

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
