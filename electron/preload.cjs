const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('fetchxApi', {
  sendRequest: (payload) => ipcRenderer.invoke('fetchx:send', payload),
  getPersistedState: () => ipcRenderer.invoke('fetchx:state:get'),
  setPersistedState: (payload) => ipcRenderer.invoke('fetchx:state:set', payload),
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close: () => ipcRenderer.send('window:close'),
});
