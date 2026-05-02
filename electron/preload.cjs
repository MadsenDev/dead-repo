const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  minimize:         () => ipcRenderer.send('win:minimize'),
  maximize:         () => ipcRenderer.send('win:maximize'),
  close:            () => ipcRenderer.send('win:close'),
  openExternal:     (url) => ipcRenderer.invoke('shell:open-external', url),
  getGitHubSession: () => ipcRenderer.invoke('auth:get-github-session'),
  setGitHubSession: (session) => ipcRenderer.invoke('auth:set-github-session', session),
  clearGitHubSession: () => ipcRenderer.invoke('auth:clear-github-session'),
  startGitHubAuth:  () => ipcRenderer.invoke('github:start-auth'),
  cancelGitHubAuth: () => ipcRenderer.send('github:cancel-auth'),
})
