import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

contextBridge.exposeInMainWorld('electron', electronAPI)

contextBridge.exposeInMainWorld('api', {
  createRoom: (roomName) => ipcRenderer.invoke('create-room', roomName),
  getRooms: () => ipcRenderer.invoke('get-rooms'),
  sendMessage: (data) => ipcRenderer.invoke('send-message', data),
  getMessages: (roomId) => ipcRenderer.invoke('get-messages', roomId)
})