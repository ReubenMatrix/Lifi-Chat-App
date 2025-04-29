import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import fs from 'fs'
import path from 'path'
import { shell } from 'electron'
const { SerialPort } = require('serialport')
const { ReadlineParser } = require('@serialport/parser-readline')
const keytar = require('keytar')
const crypto = require('crypto')

const SERVICE_NAME = 'LumiChat'

const keys = {
  'aes-128-cbc_key': 'On2QEio9j4rG/l0yQ4uwMA==',
  'aes-192-cbc_key': '5yUxinmTgtYthq8Nl1uI83bv0fpYd7JP',
  'aes-256-cbc_key': 'AIMBanH9cb/pNdvSxmiEblKgpS7znTlM7O9+uihYNvw='
}

const ivs = {
  'aes-128-cbc_iv': 'ZeFP/Ll2Y761qNXtatmauQ==',
  'aes-192-cbc_iv': 'tjDoMPX+4v8Q5egH9pG0Yw==',
  'aes-256-cbc_iv': 'sUpaIBBNJz7nqCyOaDR78g=='
}
const variants = ['aes-128-cbc', 'aes-192-cbc', 'aes-256-cbc']

async function initializeKeys() {
  for (let variant of variants) {
    const key = keys[`${variant}_key`]
    const iv = ivs[`${variant}_iv`]

    await keytar.setPassword(SERVICE_NAME, `${variant}_key`, key)
    await keytar.setPassword(SERVICE_NAME, `${variant}_iv`, iv)
  }
}

async function getEncryptionKeys(variant) {
  const key = await keytar.getPassword(SERVICE_NAME, `${variant}_key`)
  const iv = await keytar.getPassword(SERVICE_NAME, `${variant}_iv`)

  if (!key || !iv) {
    throw new Error(
      `Encryption key or IV not found for variant ${variant}. Run initializeKeys() first.`
    )
  }

  return {
    key: Buffer.from(key, 'base64'),
    iv: Buffer.from(iv, 'base64')
  }
}

// Encrypt Function
async function encrypt(text, variant) {
  const { key, iv } = await getEncryptionKeys(variant)
  const cipher = crypto.createCipheriv(variant, key, iv)
  let encrypted = cipher.update(text, 'utf8', 'base64')
  encrypted += cipher.final('base64')
  return encrypted
}

// Decrypt Function
async function decrypt(encryptedText, variant) {
  const { key, iv } = await getEncryptionKeys(variant)
  const decipher = crypto.createDecipheriv(variant, key, iv)
  let decrypted = decipher.update(encryptedText, 'base64', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}

let activePort = null
let parser = null
const projectRoot = process.cwd()
const dbFile = path.join(projectRoot, 'data', 'db.json')

if (!fs.existsSync(path.join(projectRoot, 'data'))) {
  fs.mkdirSync(path.join(projectRoot, 'data'))
}

// Initialize database with default data
const defaultData = {
  rooms: [],
  messages: []
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

ipcMain.handle('create-room', async (_, roomName) => {
  try {
    await db.read()

    const newRoom = {
      room_id: roomName
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

ipcMain.handle('send-message', async (_, { roomId, username, message, encryptionType }) => {
  try {
    await db.read()

    // Encrypt the message before storing
    const encryptedMessage = await encrypt(message, encryptionType)

    const newMessage = {
      room_id: roomId,
      timestamp: Date.now(),
      username,
      message: encryptedMessage,
      encryptionType: encryptionType
    }

    if (!db.data.messages) {
      db.data.messages = []
    }

    db.data.messages.push(newMessage)
    await db.write()

    console.log('Encrypted message saved:', newMessage)
    return { success: true, timestamp: newMessage.timestamp }
  } catch (error) {
    console.error('Error saving message:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('get-messages', async (_, roomId) => {
  try {
    await db.read()

    const messages = db.data.messages
      .filter((msg) => msg.room_id === roomId)
      .sort((a, b) => a.timestamp - b.timestamp)

    // Decrypt all messages
    const decryptedMessages = await Promise.all(
      messages.map(async (msg) => ({
        ...msg,
        message: await decrypt(msg.message, msg.encryptionType) // Decrypt only the message content
      }))
    )

    return decryptedMessages
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

    console.log('Initializing keys...')
    await initializeKeys()
    console.log('Keys initialization complete')

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

ipcMain.handle('serial:initialize', async (_, portName) => {
  try {
    if (activePort) {
      await activePort.close()
    }

    activePort = new SerialPort({
      path: portName,
      baudRate: 9600,
      dataBits: 8,
      parity: 'none',
      stopBits: 1
    })

    parser = new ReadlineParser({ delimiter: '\r\n' })
    activePort.pipe(parser)

    return new Promise((resolve) => {
      activePort.on('open', () => {
        console.log('Serial port opened:', portName)
        resolve({ success: true })
      })

      activePort.on('error', (err) => {
        console.error('Error opening port:', err)
        resolve({ success: false, error: err.message })
      })
    })
  } catch (error) {
    console.error('Failed to initialize port:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('serial:read', async () => {
  return new Promise((resolve) => {
    if (!activePort || !activePort.isOpen) {
      resolve({ success: false, error: 'No active port connection' })
      return
    }

    // Set up the data listener
    const dataHandler = (data) => {
      console.log('Received data:', data) // Debug log
      parser.removeListener('data', dataHandler)
      resolve({ success: true, data: data.toString() })
    }

    // Set up error handler
    const errorHandler = (error) => {
      console.error('Port read error:', error)
      parser.removeListener('data', dataHandler)
      parser.removeListener('error', errorHandler)
      resolve({ success: false, error: error.message })
    }

    // Add listeners
    parser.once('data', dataHandler)
    parser.once('error', errorHandler)

    // Set timeout
    setTimeout(() => {
      parser.removeListener('data', dataHandler)
      parser.removeListener('error', errorHandler)
      resolve({ success: true, data: null }) // Return null instead of error on timeout
    }, 1000)
  })
})

ipcMain.handle('serial:decrypt-read', async () => {
  try {
    if (!activePort || !activePort.isOpen) {
      return { success: false, error: 'No active port connection' }
    }

    return new Promise((resolve) => {
      const dataHandler = async (data) => {
        try {
          console.log('Raw data received:', data)
          if (data && data.trim()) {
            // Try each variant until successful decryption
            for (const variant of variants) {
              try {
                const decryptedData = await decrypt(data.trim(), variant)
                console.log('Successfully decrypted with variant:', variant)
                parser.removeListener('data', dataHandler)
                resolve({ success: true, data: decryptedData, encryptionType: variant })
                return
              } catch (error) {
                console.log(`Failed to decrypt with ${variant}, trying next variant...`)
                continue
              }
            }
            // If we get here, none of the variants worked
            throw new Error('Failed to decrypt with any variant')
          }
        } catch (error) {
          console.error('Decryption error:', error)
          parser.removeListener('data', dataHandler)
          resolve({ success: false, error: 'Failed to decrypt data' })
        }
      }

      parser.once('data', dataHandler)

      setTimeout(() => {
        parser.removeListener('data', dataHandler)
        resolve({ success: true, data: null })
      }, 2000)
    })
  } catch (error) {
    console.error('Read error:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('serial:encrypt-write', async (_, data, encryptionType) => {
  try {
    if (!activePort || !activePort.isOpen) {
      throw new Error('No active port connection')
    }

    const encryptedData = await encrypt(data, encryptionType)
    console.log('Sending encrypted data:', encryptedData)

    return new Promise((resolve, reject) => {
      activePort.write(encryptedData + '\r\n', (error) => {
        if (error) {
          console.error('Write error:', error)
          reject({ success: false, error: error.message })
        } else {
          activePort.drain(() => {
            console.log('Write completed')
            resolve({ success: true })
          })
        }
      })
    })
  } catch (error) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('serial:write', (_, data) => {
  return new Promise((resolve) => {
    if (!activePort || !activePort.isOpen) {
      console.error('No active port connection')
      resolve({ success: false, error: 'No active port connection' })
      return
    }

    console.log('Writing to port:', data)
    activePort.write(data + '\r\n', (error) => {
      if (error) {
        console.error('Write error:', error)
        resolve({ success: false, error: error.message })
      } else {
        activePort.drain(() => {
          console.log('Write completed')
          resolve({ success: true })
        })
      }
    })
  })
})

ipcMain.handle('serial:close', async () => {
  try {
    if (activePort && activePort.isOpen) {
      await activePort.close()
      activePort = null
      parser = null
      return { success: true }
    }
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
})
