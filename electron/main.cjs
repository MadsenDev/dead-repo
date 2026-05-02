const { app, BrowserWindow, ipcMain, Menu, safeStorage, shell } = require('electron')
const fs = require('fs')
const path = require('path')

const isDev = process.env.NODE_ENV === 'development'

Menu.setApplicationMenu(null)

let mainWindow = null

loadLocalEnv()

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    titleBarStyle: 'hidden',
    backgroundColor: '#0a0d0c',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
    },
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

// Window controls
ipcMain.on('win:minimize', () => mainWindow?.minimize())
ipcMain.on('win:maximize', () => mainWindow?.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize())
ipcMain.on('win:close', () => mainWindow?.close())
ipcMain.handle('shell:open-external', async (_event, url) => {
  if (typeof url !== 'string' || !/^https?:\/\//.test(url)) {
    throw new Error('Invalid external URL')
  }
  await shell.openExternal(url)
})
ipcMain.handle('auth:get-github-session', async () => readGitHubSession())
ipcMain.handle('auth:set-github-session', async (_event, session) => {
  writeGitHubSession(session)
  return true
})
ipcMain.handle('auth:clear-github-session', async () => {
  clearGitHubSession()
  return true
})

// GitHub OAuth — token exchange happens here so client_secret never reaches renderer
ipcMain.handle('github:start-auth', async () => {
  const { startOAuth } = require('./github-auth.cjs')
  return startOAuth()
})

ipcMain.on('github:cancel-auth', () => {
  const { cancelOAuth } = require('./github-auth.cjs')
  cancelOAuth()
})

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

function loadLocalEnv() {
  const envFiles = ['.env.local', '.env']

  for (const filename of envFiles) {
    const filePath = path.join(process.cwd(), filename)
    if (!fs.existsSync(filePath)) continue

    const content = fs.readFileSync(filePath, 'utf8')
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue

      const eqIndex = trimmed.indexOf('=')
      if (eqIndex === -1) continue

      const key = trimmed.slice(0, eqIndex).trim()
      let value = trimmed.slice(eqIndex + 1).trim()
      if (!key || process.env[key] != null) continue

      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }

      process.env[key] = value
    }
  }
}

function getGitHubSessionPath() {
  return path.join(app.getPath('userData'), 'github-session.json')
}

function readGitHubSession() {
  try {
    const filePath = getGitHubSessionPath()
    if (!fs.existsSync(filePath)) return null

    const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'))
    if (raw.encrypted && raw.data) {
      const decrypted = safeStorage.decryptString(Buffer.from(raw.data, 'base64'))
      return JSON.parse(decrypted)
    }
    return raw.data ?? null
  } catch {
    return null
  }
}

function writeGitHubSession(session) {
  const filePath = getGitHubSessionPath()
  fs.mkdirSync(path.dirname(filePath), { recursive: true })

  if (safeStorage.isEncryptionAvailable()) {
    const encrypted = safeStorage.encryptString(JSON.stringify(session)).toString('base64')
    fs.writeFileSync(filePath, JSON.stringify({ encrypted: true, data: encrypted }), 'utf8')
    return
  }

  fs.writeFileSync(filePath, JSON.stringify({ encrypted: false, data: session }), 'utf8')
}

function clearGitHubSession() {
  const filePath = getGitHubSessionPath()
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
}
