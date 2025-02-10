import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import fs from 'fs'
import path from 'path'

// Get the project root directory
const projectRoot = process.cwd()
const dbFile = path.join(projectRoot, 'data', 'db.json')

// Ensure data directory exists
if (!fs.existsSync(path.join(projectRoot, 'data'))) {
  fs.mkdirSync(path.join(projectRoot, 'data'))
}

// Initialize database with default data
const defaultData = {
  rooms: [],
  messages: []
}

// Simple database implementation
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

// Helper function to read/write database
async function initializeDatabase() {
  try {
    await db.read()
    await db.write()
    console.log('Database initialized successfully')
    console.log('Database file location:', dbFile) // This will show the database location
  } catch (error) {
    console.error('Error initializing database:', error)
    throw error
  }
}

// IPC Handlers
ipcMain.handle('create-room', async (_, roomName) => {
  try {
    await db.read()
    
    const newRoom = {
      room_id: roomName,
      created_at: Date.now()
    }
    
    db.data.rooms.push(newRoom)
    await db.write()
    
    return { success: true }
  } catch (error) {
    console.error('Error creating room:', error)
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
    
    const newMessage = {
      room_id: roomId,
      timestamp: Date.now(),
      username,
      message
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
      .filter(msg => msg.room_id === roomId)
      .sort((a, b) => a.timestamp - b.timestamp)
  } catch (error) {
    console.error('Error getting messages:', error)
    return []
  }
})

// Add data validation
function validateMessage(message) {
  if (!message.roomId || !message.username || !message.message) {
    throw new Error('Invalid message format')
  }
  if (message.message.length > 1000) {
    throw new Error('Message too long')
  }
  return true
}

// Window management
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

// Application initialization
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

// Cleanup on app quit
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Add data backup functionality
async function backupDatabase() {
  try {
    const backupPath = path.join(projectRoot, 'data', `backup-${Date.now()}.json`)
    await fs.promises.copyFile(dbFile, backupPath)
    console.log('Database backup created successfully at:', backupPath)
  } catch (error) {
    console.error('Error creating database backup:', error)
  }
}

// Create periodic backups
setInterval(backupDatabase, 24 * 60 * 60 * 1000) // Daily backup

// Add IPC handler to get database location
ipcMain.handle('get-db-path', () => dbFile)

// Add IPC handler to open database location
ipcMain.handle('open-db-location', async () => {
  try {
    await shell.showItemInFolder(dbFile)
    return { success: true }
  } catch (error) {
    console.error('Error opening database location:', error)
    return { success: false, error: error.message }
  }
})