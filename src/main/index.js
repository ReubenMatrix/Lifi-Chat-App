import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { DynamoDBClient, DescribeTableCommand, CreateTableCommand } from '@aws-sdk/client-dynamodb'
import { 
  DynamoDBDocumentClient, 
  PutCommand, 
  QueryCommand, 
  ScanCommand
} from '@aws-sdk/lib-dynamodb'


const client = new DynamoDBClient({
  region: 'us-west-2',
  endpoint: 'http://localhost:8000',
  credentials: {
    accessKeyId: 'AKIA5CBGTFZWWHDWKUOW',
    secretAccessKey: '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'
  }
})

const dynamodb = DynamoDBDocumentClient.from(client)


async function tableExists(tableName) {
  try {
    await client.send(new DescribeTableCommand({ TableName: tableName }))
    return true
  } catch (error) {
    if (error.name === 'ResourceNotFoundException') {
      return false
    }
    throw error
  }
}


async function initializeTables() {
  try {
    const roomsTableExists = await tableExists('Rooms')
    if (!roomsTableExists) {
      console.log('Creating Rooms table...')
      await client.send(new CreateTableCommand({
        TableName: 'Rooms',
        KeySchema: [
          { AttributeName: 'room_id', KeyType: 'HASH' }
        ],
        AttributeDefinitions: [
          { AttributeName: 'room_id', AttributeType: 'S' }
        ],
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        }
      }))
      console.log('Rooms table created successfully')
    } else {
      console.log('Rooms table already exists')
    }


    const messagesTableExists = await tableExists('Messages')
    if (!messagesTableExists) {
      console.log('Creating Messages table...')
      await client.send(new CreateTableCommand({
        TableName: 'Messages',
        KeySchema: [
          { AttributeName: 'room_id', KeyType: 'HASH' },
          { AttributeName: 'timestamp', KeyType: 'RANGE' }
        ],
        AttributeDefinitions: [
          { AttributeName: 'room_id', AttributeType: 'S' },
          { AttributeName: 'timestamp', AttributeType: 'N' }
        ],
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        }
      }))
      console.log('Messages table created successfully')
    } else {
      console.log('Messages table already exists')
    }

  } catch (error) {
    console.error('Error initializing tables:', error)
    throw error
  }
}


ipcMain.handle('create-room', async (_, roomName) => {
  try {
    await dynamodb.send(new PutCommand({
      TableName: 'Rooms',
      Item: {
        room_id: roomName,
        created_at: Date.now()
      }
    }))
    return { success: true }
  } catch (error) {
    console.error('Error creating room:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('get-rooms', async () => {
  try {
    const result = await dynamodb.send(new ScanCommand({
      TableName: 'Rooms',
      ConsistentRead: true 
    }))
    return result.Items || []
  } catch (error) {
    console.error('Error getting rooms:', error)
    return []
  }
})

ipcMain.handle('send-message', async (_, { roomId, username, message }) => {
  try {
    const timestamp = Date.now()
    await dynamodb.send(new PutCommand({
      TableName: 'Messages',
      Item: {
        room_id: roomId,
        timestamp,
        username,
        message
      }
    }))
    return { success: true, timestamp }
  } catch (error) {
    console.error('Error sending message:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('get-messages', async (_, roomId) => {
  try {
    const result = await dynamodb.send(new QueryCommand({
      TableName: 'Messages',
      KeyConditionExpression: 'room_id = :rid',
      ExpressionAttributeValues: {
        ':rid': roomId
      },
      ScanIndexForward: true,
      ConsistentRead: true
    }))
    return result.Items || []
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
}

// Application initialization
app.whenReady().then(async () => {
  try {
    console.log('Initializing database...')
    await initializeTables()
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