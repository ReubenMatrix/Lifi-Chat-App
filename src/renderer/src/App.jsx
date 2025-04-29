import { useState, useEffect } from 'react'
import { MantineProvider } from '@mantine/core'
import WelcomeScreen from './components/WelcomeScreen'
import RoomsScreen from './components/RoomScreen'
import ChatScreen from './components/ChatScreen'

const App = () => {
  const [currentScreen, setCurrentScreen] = useState('welcome')
  const [username, setUsername] = useState('')
  const [currentRoom, setCurrentRoom] = useState(null)
  const [selectedPort, setSelectedPort] = useState('')
  const [portData, setPortData] = useState(null)

  const handleStart = (name) => {
    setUsername(name)
    setCurrentScreen('rooms')
  }

  const handleJoinRoom = (roomId) => {
    setCurrentRoom(roomId)
    setCurrentScreen('chat')
  }

  const handlePortSelect = async (port) => {
    setSelectedPort(port)
    try {
      const result = await window.api.initializePort(port)
      if (result.success) {
        console.log('Port initialized:', port)
      } else {
        console.error('Failed to initialize port:', result.error)
      }
    } catch (error) {
      console.error('Error initializing port:', error)
    }
  }

  useEffect(() => {
    let isSubscribed = true
    let readInterval

    const readFromPort = async () => {
      if (!selectedPort) return

      try {
        const result = await window.api.readAndDecryptFromPort()
        if (result.success && result.data && isSubscribed) {
          console.log(
            'Decrypted data:',
            result.data,
            'using encryption type:',
            result.encryptionType
          )
          setPortData(result)
        }
      } catch (error) {
        console.error('Error reading from port:', error)
      }
    }

    if (selectedPort) {
      readFromPort()
      readInterval = setInterval(readFromPort, 1000)
    }

    return () => {
      isSubscribed = false
      if (readInterval) {
        clearInterval(readInterval)
      }
    }
  }, [selectedPort])

  return (
    <MantineProvider withGlobalStyles withNormalizeCSS>
      {currentScreen === 'welcome' && <WelcomeScreen onStart={handleStart} />}
      {currentScreen === 'rooms' && (
        <RoomsScreen
          onJoinRoom={handleJoinRoom}
          onPortSelect={handlePortSelect}
          selectedPort={selectedPort}
        />
      )}
      {currentScreen === 'chat' && (
        <ChatScreen
          roomId={currentRoom}
          username={username}
          selectedPort={selectedPort}
          portData={portData}
          onBack={() => setCurrentScreen('rooms')}
        />
      )}
    </MantineProvider>
  )
}

export default App
