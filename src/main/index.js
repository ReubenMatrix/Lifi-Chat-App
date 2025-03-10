import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import fs from 'fs'
import path from 'path'
const { SerialPort } = require('serialport')

const projectRoot = process.cwd()
const dbFile = path.join(projectRoot, 'data', 'db.json')

if (!fs.existsSync(path.join(projectRoot, 'data'))) {
  fs.mkdirSync(path.join(projectRoot, 'data'))
}


const defaultData = {
  rooms: [],
  messages: [],
  users: {},  
  notifications: [],
  pendingRequests: []
}

class Database {
  constructor(filePath, defaultData) {
    this.filePath = filePath
    this.defaultData = defaultData
    this.data = null
  }

  async read() {
    try {
      if (fs.existsSync(this.filePath)) {
        const data = await fs.promises.readFile(this.filePath, 'utf8')
        this.data = JSON.parse(data)
      } else {
        this.data = this.defaultData
      }
    } catch (error) {
      console.error('Error reading database:', error)
      this.data = this.defaultData
    }
  }

  async write() {
    try {
      await fs.promises.writeFile(this.filePath, JSON.stringify(this.data, null, 2))
    } catch (error) {
      console.error('Error writing database:', error)
      throw error
    }
  }
}

const db = new Database(dbFile, defaultData)

async function initializeDatabase() {
  try {
    await db.read()
    await db.write()
    console.log('Database initialized successfully')
    console.log('Database file location:', dbFile)
  } catch (error) {
    console.error('Error initializing database:', error)
    throw error
  }
}

ipcMain.handle('create-room', async (_, roomName, username) => {
  try {
    await db.read()

    const newRoom = {
      room_id: roomName,
      created_at: Date.now(),
      created_by: username,
      users: [username],
      pendingRequests: []
    }

    db.data.rooms.push(newRoom)
    await db.write()

    return { success: true }
  } catch (error) {
    console.error('Error creating room:', error)
    return { success: false, error: error.message }
  }
})



ipcMain.handle('join-room', async (_, roomId, username) => {
  try {
    await db.read()
    
    const room = db.data.rooms.find(r => r.room_id === roomId)
    if (!room) {
      throw new Error('Room not found')
    }


    if (room.created_by === username) {
      if (!room.users.includes(username)) {
        room.users.push(username)
        await db.write()
      }
      return { success: true, immediate: true }
    }


    if (room.users.includes(username)) {
      return { success: true, immediate: true }
    }


    if (room.pendingRequests && room.pendingRequests.includes(username)) {
      return { 
        success: false, 
        error: 'Join request already pending'
      }
    }


    if (!room.pendingRequests) {
      room.pendingRequests = []
    }
    room.pendingRequests.push(username)
    await db.write()

  
    return { 
      success: true, 
      immediate: false,
      notification: {
        creatorUsername: room.created_by,
        joiningUsername: username
      }
    }
  } catch (error) {
    console.error('Error joining room:', error)
    return { success: false, error: error.message }
  }
})




ipcMain.handle('get-rooms', async () => {
  try {
    await db.read()
    return db.data.rooms
  } catch (error) {
    console.error('Error getting rooms:', error)
    return []
  }
})

ipcMain.handle('send-message', async (_, { roomId, username, message }) => {
  try {
    await db.read()

    const room = db.data.rooms.find(r => r.room_id === roomId)
    if (!room) {
      throw new Error('Room not found')
    }

    if (!room.users.includes(username)) {
      throw new Error('You are not a member of this room')
    }


    const newMessage = {
      room_id: roomId,
      timestamp: Date.now(),
      username,
      message,
      message_type:"CHAT-MESSAGE"
    }

    db.data.messages.push(newMessage)
    await db.write()

    return { success: true, timestamp: newMessage.timestamp }
  } catch (error) {
    console.error('Error sending message:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('get-messages', async (_, roomId) => {
  try {
    await db.read()

    return db.data.messages
      .filter((msg) => msg.room_id === roomId)
      .sort((a, b) => a.timestamp - b.timestamp)
  } catch (error) {
    console.error('Error getting messages:', error)
    return []
  }
})

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon: join(__dirname, '../../build/icon.png') } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return mainWindow
}

app.whenReady().then(async () => {
  try {
    console.log('Initializing database...')
    await initializeDatabase()
    console.log('Database initialization complete')

    electronApp.setAppUserModelId('com.electron.chat')
    app.on('browser-window-created', (_, window) => {
      optimizer.watchWindowShortcuts(window)
    })

    createWindow()

    app.on('activate', function () {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  } catch (error) {
    console.error('Failed to initialize application:', error)
    app.quit()
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

async function backupDatabase() {
  try {
    const backupPath = path.join(projectRoot, 'data', `backup-${Date.now()}.json`)
    await fs.promises.copyFile(dbFile, backupPath)
    console.log('Database backup created successfully at:', backupPath)
  } catch (error) {
    console.error('Error creating database backup:', error)
  }
}

setInterval(backupDatabase, 24 * 60 * 60 * 1000)

ipcMain.handle('get-db-path', () => dbFile)

ipcMain.handle('open-db-location', async () => {
  try {
    await shell.showItemInFolder(dbFile)
    return { success: true }
  } catch (error) {
    console.error('Error opening database location:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('scan-ports', async () => {
  try {
    const ports = await SerialPort.list()
    const arduinoPorts = ports.filter((port) => {
      const manufacturer = (port.manufacturer || '').toLowerCase()
      return (
        manufacturer.includes('arduino') ||
        manufacturer.includes('wch') || // CH340 chip
        manufacturer.includes('ftdi')
      )
    })

    if (arduinoPorts.length > 0) {
      return arduinoPorts.map((port) => port.path)
    }
    return 'NO PORTS Detected'
  } catch (error) {
    return error.message
  }
})

ipcMain.handle('add-notification', async (_, { from, to, type, roomId }) => {
  try {
    await db.read()
    
    const notification = {
      id: `notif-${Date.now()}`,
      from,
      to,
      type,
      roomId,
      timestamp: Date.now(),
      read: false,
      message_type:"NOTIFICATION"
    }
    
    db.data.notifications.push(notification)
    await db.write()
    
    return { success: true, notification }
  } catch (error) {
    console.error('Error adding notification:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('get-notifications', async (_, username) => {
  try {
    await db.read()
    return db.data.notifications.filter(n => n.to === username && !n.read)
  } catch (error) {
    console.error('Error getting notifications:', error)
    return []
  }
})

ipcMain.handle('mark-notification-read', async (_, notificationId) => {
  try {
    await db.read()
    const notification = db.data.notifications.find(n => n.id === notificationId)
    if (notification) {
      notification.read = true
      await db.write()
    }
    return { success: true }
  } catch (error) {
    console.error('Error marking notification as read:', error)
    return { success: false, error: error.message }
  }
})


ipcMain.handle('approve-join-request', async (_, notificationId, username, roomId) => {
  try {
    await db.read()
    
    const room = db.data.rooms.find(r => r.room_id === roomId)
    if (!room) {
      throw new Error('Room not found')
    }

    room.pendingRequests = room.pendingRequests.filter(u => u !== username)
    
    if (!room.users.includes(username)) {
      room.users.push(username)
    }


    db.data.notifications.push({
      id: `notif-${Date.now()}`,
      from: room.created_by,
      to: username,
      type: 'JOIN_APPROVED',
      roomId,
      timestamp: Date.now(),
      read: false,
      message: `Your request to join ${roomId} has been approved`,
      message_type:"NOTIFICATION"
    })

    await db.write()
    return { success: true }
  } catch (error) {
    console.error('Error approving join request:', error)
    return { success: false, error: error.message }
  }
})



ipcMain.handle('reject-join-request', async (_, notificationId, username, roomId) => {
  try {
    await db.read()
    
    const room = db.data.rooms.find(r => r.room_id === roomId)
    if (!room) {
      throw new Error('Room not found')
    }

    room.pendingRequests = room.pendingRequests.filter(u => u !== username)

    db.data.notifications.push({
      id: `notif-${Date.now()}`,
      from: room.created_by,
      to: username,
      type: 'JOIN_REJECTED',
      roomId,
      timestamp: Date.now(),
      read: false,
      message: `Your request to join ${roomId} has been rejected`,
      message_type:"NOTIFICATION"
    })

    await db.write()
    return { success: true }
  } catch (error) {
    console.error('Error rejecting join request:', error)
    return { success: false, error: error.message }
  }
})