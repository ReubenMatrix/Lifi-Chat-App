import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

contextBridge.exposeInMainWorld('electron', electronAPI)

contextBridge.exposeInMainWorld('api', {
  createRoom: (roomName, username) => ipcRenderer.invoke('create-room', roomName, username),
  getRooms: () => ipcRenderer.invoke('get-rooms'),
  sendMessage: (data) => ipcRenderer.invoke('send-message', data),
  getMessages: (roomId) => ipcRenderer.invoke('get-messages', roomId),
  scanPorts: () => ipcRenderer.invoke('scan-ports'),
  joinRoom: (roomId, username) => ipcRenderer.invoke('join-room', roomId, username),
  addNotification: (data) => ipcRenderer.invoke('add-notification', data),
  getNotifications: (username) => ipcRenderer.invoke('get-notifications', username),
  markNotificationRead: (id) => ipcRenderer.invoke('mark-notification-read', id),
  approveJoinRequest: (notificationId, username, roomId) => ipcRenderer.invoke('approve-join-request', notificationId, username, roomId),
  rejectJoinRequest: (notificationId, username, roomId) => ipcRenderer.invoke('reject-join-request', notificationId, username, roomId),
})
