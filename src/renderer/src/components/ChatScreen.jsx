import React, { useState, useEffect, useRef } from 'react'
import { 
  TextInput, 
  Button, 
  Stack, 
  Paper, 
  Group, 
  Title, 
  Container, 
  Box, 
  Text, 
} from '@mantine/core'
import { motion } from 'framer-motion'
import { FiArrowLeft, FiSend, FiLock } from 'react-icons/fi'

const ChatScreen = ({ roomId, username, selectedPort, portData, onBack }) => {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [menuOpened, setMenuOpened] = useState(false)
  const messagesEndRef = useRef(null)
  const pollingRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadMessages = async () => {
    try {
      const messagesList = await window.api.getMessages(roomId)
      console.log('Loaded and decrypted messages:', messagesList)
      setMessages(messagesList)
      scrollToBottom()
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }

  useEffect(() => {
    loadMessages()
    pollingRef.current = setInterval(loadMessages, 1000)

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
      }
    }
  }, [roomId])

  useEffect(() => {
    if (portData) {
      console.log('Received port data in chat:', portData)
      const saveMessage = async () => {
        try {
          const result = await window.api.sendMessage({
            roomId,
            username: 'rohan',
            encryptionType: 'AES-256',
            message: portData
          })
          console.log('Message save result:', result)
          if (result.success) {
            await loadMessages()
          }
        } catch (error) {
          console.error('Error saving Arduino message:', error)
        }
      }
      saveMessage()
    }
  }, [portData, roomId])

  const sendEncryptedMessage = async (encryptionMethod) => {
    if (newMessage.trim()) {
      try {
        // First try to send via serial port with encryption
        if (selectedPort) {
          console.log('Attempting to write encrypted message to port')
          const portResult = await window.api.writeAndEncryptToPort(newMessage.trim())
          console.log('Port write result:', portResult)
        }

        // Then send to chat system with encryption
        const result = await window.api.sendMessage({
          roomId,
          username,
          message: newMessage.trim(),
          encryptionType: encryptionMethod
        })

        if (result.success) {
          setNewMessage('')
          setMenuOpened(false)
          await loadMessages()
        } else {
          console.error('Failed to save message:', result.error)
        }
      } catch (error) {
        console.error('Error sending message:', error)
      }
    }
  }

  const handleSendClick = () => {
    if (newMessage.trim()) {
      setMenuOpened(true)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: '2rem',
        position: 'relative'
      }}
    >
   {menuOpened && (
  <div
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)', // Slightly darker overlay
      zIndex: 1000,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backdropFilter: 'blur(5px)', // Add blur effect
      pointerEvents: 'auto'
    }}
    onClick={() => setMenuOpened(false)}
  >
    <div
      style={{
        borderRadius: '15px', // More rounded corners
        boxShadow: '0 15px 35px rgba(0,0,0,0.2)', // Enhanced shadow
        padding: '25px',
        width: '350px', // Slightly wider
        maxWidth: '90%',
        transform: 'scale(1.05)', // Slight scale effect
        transition: 'transform 0.3s ease', // Smooth scale transition
        border: '1px solid rgba(0,0,0,0.05)' // Subtle border
      }}
      onClick={(e) => {
        e.stopPropagation();
        e.target.style.pointerEvents = 'auto';
      }}
    >
      <Text 
        size="lg" 
        fw={700} 
        ta="center" 
        mb={20}
        c="dark.8"
        style={{
          letterSpacing: '0.5px', // Slight letter spacing
          textTransform: 'uppercase' // Uppercase title
        }}
      >
        Encryption Methods
      </Text>
      
      <Stack spacing="md" style={{display: 'flex', flexDirection: 'column'}}>
        <Button 
          variant="gradient"
          gradient={{ from: 'blue', to: 'cyan', deg: 45 }}
          fullWidth 
          leftSection={<FiLock />}
          onClick={(e) => {
            e.stopPropagation();
            sendEncryptedMessage('AES-128');
          }}
          style={{
            height: '55px',
            borderRadius: '10px',
            fontSize: '16px',
            fontWeight: 600,
            boxShadow: '0 4px 10px rgba(0,0,255,0.2)' // Blue shadow
          }}
        >
          AES 128-bit Encryption
        </Button>
        
        <Button 
          variant="gradient"
          gradient={{ from: 'green', to: 'lime', deg: 45 }}
          fullWidth 
          leftSection={<FiLock />}
          onClick={(e) => {
            e.stopPropagation();
            sendEncryptedMessage('AES-192');
          }}
          style={{
            height: '55px',
            borderRadius: '10px',
            fontSize: '16px',
            fontWeight: 600,
            boxShadow: '0 4px 10px rgba(0,255,0,0.2)' // Green shadow
          }}
        >
          AES 192-bit Encryption
        </Button>
        
        <Button 
          variant="gradient"
          gradient={{ from: 'violet', to: 'pink', deg: 45 }}
          fullWidth 
          leftSection={<FiLock />}
          onClick={(e) => {
            e.stopPropagation();
            sendEncryptedMessage('AES-256');
          }}
          style={{
            height: '55px',
            borderRadius: '10px',
            fontSize: '16px',
            fontWeight: 600,
            boxShadow: '0 4px 10px rgba(255,0,255,0.2)' // Violet shadow
          }}
        >
          AES 256-bit Encryption
        </Button>
      </Stack>

      <Text 
        size="xs" 
        ta="center" 
        mt={15}
        c="dimmed"
        style={{
          fontStyle: 'italic',
          opacity: 0.7
        }}
      >
        Select an encryption method to secure your message
      </Text>
    </div>
  </div>
)}
      <Container
        size="lg"
        style={{
          height: 'calc(100vh - 4rem)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <Paper
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '15px',
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          {/* Header */}
          <Paper
            p="md"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              position: 'sticky',
              top: 0,
              zIndex: 2
            }}
          >
            <Group position="apart" align="center">
              <Group>
                <Button
                  variant="subtle"
                  color="gray"
                  onClick={onBack}
                  leftIcon={<FiArrowLeft size={16} />}
                  styles={{
                    root: {
                      color: 'black',
                      borderRadius: '15px',
                      '&:hover': {
                        background: 'rgba(255, 255, 255, 0.1)'
                      }
                    }
                  }}
                >
                  Back
                </Button>
                <Title order={3} style={{ color: 'white' }}>
                  {`Room ${roomId}`}
                </Title>
              </Group>
            </Group>
          </Paper>

          <Box
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1rem',
              paddingBottom: '80px'
            }}
            className="messages-container"
          >
            <Stack spacing="md">
              {messages.map((msg) => (
                <motion.div
                  key={msg.timestamp}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    alignSelf: msg.username === username ? 'flex-end' : 'flex-start',
                    maxWidth: '70%'
                  }}
                >
                  <Box>
                    <Text
                      size="xs"
                      color="white"
                      style={{
                        marginBottom: '4px',
                        opacity: 0.7,
                        textAlign: msg.username === username ? 'right' : 'left'
                      }}
                    >
                      {msg.username}
                    </Text>
                    <Paper
                      p="md"
                      style={{
                        background:
                          msg.username === username
                            ? 'linear-gradient(45deg, #FF6B6B 30%, #FFE66D 90%)'
                            : 'rgba(255, 255, 255, 0.1)',
                        color: 'white',
                        borderRadius:
                          msg.username === username ? '15px 15px 0 15px' : '15px 15px 15px 0',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                      }}
                    >
                      <Text style={{ padding: '5px', wordBreak: 'break-word' }}>{msg.message}</Text>
                    </Paper>
                    <Text
                      size="xs"
                      color="white"
                      style={{
                        marginTop: '4px',
                        opacity: 0.5,
                        textAlign: msg.username === username ? 'right' : 'left'
                      }}
                    >
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </Text>
                  </Box>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </Stack>
          </Box>

          <Paper
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '1rem',
              zIndex: 2
            }}
          >
            <Group
              spacing="sm"
              align="center"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <TextInput
                placeholder={selectedPort ? 'Type a message...' : 'Connect to a port'}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendClick()}
                style={{ flex: 1 }}
                styles={{
                  input: {
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    height: '35px',
                    width: '100%',
                    borderRadius: '15px',
                    '&::placeholder': {
                      color: 'rgba(255, 255, 255, 0.5)'
                    },
                    '&:focus': {
                      borderColor: 'rgba(255, 255, 255, 0.3)'
                    }
                  }
                }}
              />
              <Button
                onClick={handleSendClick}
                disabled={!newMessage.trim()}
                style={{
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                  background: 'white',
                  color: 'black',
                  borderRadius: '15px',
                  height: '35px',
                  minWidth: '100px'
                }}
              >
                Send
              </Button>
            </Group>
          </Paper>
        </Paper>
      </Container>
    </div>
  )
}

export default ChatScreen