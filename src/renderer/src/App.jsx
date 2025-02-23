import React, { useState } from 'react'
import { MantineProvider } from '@mantine/core'
import WelcomeScreen from './components/WelcomeScreen'
import RoomsScreen from './components/RoomScreen'
import ChatScreen from './components/ChatScreen'

const App = () => {
  const [currentScreen, setCurrentScreen] = useState('welcome')
  const [username, setUsername] = useState('')
  const [currentRoom, setCurrentRoom] = useState(null)

  const handleStart = (name) => {
    setUsername(name)
    setCurrentScreen('rooms')
  }

  const handleRoomSelect = (roomId) => {
    setCurrentRoom(roomId)
    setCurrentScreen('chat')
  }

  const handleBack = () => {
    setCurrentRoom(null);
    setCurrentScreen('rooms');
  };

  return (
    <MantineProvider withGlobalStyles withNormalizeCSS>
      {currentScreen === 'welcome' && <WelcomeScreen onStart={handleStart} />}
      {currentScreen === 'rooms' && <RoomsScreen onRoomSelect={handleRoomSelect} username={username} />}
      {currentScreen === 'chat' && (
        <ChatScreen
          roomId={currentRoom}
          username={username}
          onBack={handleBack}
        />
      )}
    </MantineProvider>
  )
}

export default App