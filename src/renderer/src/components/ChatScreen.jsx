import React, { useState, useEffect, useRef } from 'react'
import { TextInput, Button, Stack, Paper, Group, Title, Container, Box, Text } from '@mantine/core'
import { motion } from 'framer-motion'
import { FiArrowLeft, FiSend } from 'react-icons/fi'

const ChatScreen = ({ roomId, username, onBack }) => {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const messagesEndRef = useRef(null)
  const pollingRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadMessages = async () => {
    const messagesList = await window.api.getMessages(roomId)
    setMessages(messagesList)
    scrollToBottom()
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

  const sendMessage = async () => {
    if (newMessage.trim()) {
      await window.api.sendMessage({
        roomId,
        username,
        message: newMessage.trim()
      })
      setNewMessage('')
      await loadMessages()
    }
  }

  return (
    <div 
      style={{ 
        minHeight: '100vh',
        padding: '2rem',
        position: 'relative',
      }}
    >
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
            backdropFilter: 'blur(10px)',
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
                  {roomId.replace('Room-', 'Room ')}
                </Title>
              </Group>
            </Group>
          </Paper>

          {/* Messages Area */}
          <Box
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1rem',
              paddingBottom: '80px', // Space for input area
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
                        background: msg.username === username 
                          ? 'linear-gradient(45deg, #FF6B6B 30%, #FFE66D 90%)'
                          : 'rgba(255, 255, 255, 0.1)',
                        color: 'white',
                        borderRadius: msg.username === username 
                          ? '15px 15px 0 15px'
                          : '15px 15px 15px 0',
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

          {/* Input Area */}
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
            <Group spacing="sm" align="center" style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <TextInput
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
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
                onClick={sendMessage}
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

// Add this to your CSS file
const styles = `
  .messages-container {
    scrollbar-width: thin;
    scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
  }

  .messages-container::-webkit-scrollbar {
    width: 6px;
  }

  .messages-container::-webkit-scrollbar-track {
    background: transparent;
  }

  .messages-container::-webkit-scrollbar-thumb {
    background-color: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
  }

  .messages-container::-webkit-scrollbar-thumb:hover {
    background-color: rgba(255, 255, 255, 0.3);
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .new-message {
    animation: fadeIn 0.3s ease-out;
  }
`

export default ChatScreen