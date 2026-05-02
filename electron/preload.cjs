const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  minimize:         () => ipcRenderer.send('win:minimize'),
  maximize:         () => ipcRenderer.send('win:maximize'),
  close:            () => ipcRenderer.send('win:close'),
  startGitHubAuth:  () => ipcRenderer.invoke('github:start-auth'),
  cancelGitHubAuth: () => ipcRenderer.send('github:cancel-auth'),
})
