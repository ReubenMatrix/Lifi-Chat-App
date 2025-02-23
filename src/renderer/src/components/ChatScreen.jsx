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
  Badge, 
  Menu, 
  ActionIcon 
} from '@mantine/core'
import { motion } from 'framer-motion'
import { FiArrowLeft, FiSend, FiBell } from 'react-icons/fi'

const ChatScreen = ({ roomId, username, onBack }) => {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [notifications, setNotifications] = useState([])
  const messagesEndRef = useRef(null)
  const pollingRef = useRef(null)
  const notificationPollingRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadMessages = async () => {
    try {
      const messagesList = await window.api.getMessages(roomId)
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

  const loadNotifications = async () => {
    try {
      const notifs = await window.api.getNotifications(username)
      setNotifications(notifs)
    } catch (error) {
      console.error('Error loading notifications:', error)
    }
  }

  useEffect(() => {
    loadNotifications()
    notificationPollingRef.current = setInterval(loadNotifications, 5000)

    return () => {
      if (notificationPollingRef.current) {
        clearInterval(notificationPollingRef.current)
      }
    }
  }, [username])

  const handleMarkRead = async (notificationId) => {
    try {
      await window.api.markNotificationRead(notificationId)
      await loadNotifications()
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await Promise.all(
        notifications.map(notif => 
          window.api.markNotificationRead(notif.id)
        )
      )
      await loadNotifications()
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  const sendMessage = async () => {
    if (newMessage.trim()) {
      try {
        await window.api.sendMessage({
          roomId,
          username,
          message: newMessage.trim()
        })
        setNewMessage('')
        await loadMessages()
      } catch (error) {
        console.error('Error sending message:', error)
      }
    }
  }

  return (
    <div 
      style={{ 
        minHeight: '100vh',
        padding: '2rem',
        position: 'relative',
        background: 'linear-gradient(135deg, #1e1e2e 0%, #2d2d44 100%)'
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
            position: 'relative',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }}
        >
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
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        background: 'rgba(255, 255, 255, 0.1)',
                        transform: 'translateX(-2px)'
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

              {/* Notifications Menu */}
              <Menu 
                position="bottom-end" 
                shadow="md"
                width={300}
                styles={{
                  dropdown: {
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '12px'
                  },
                  item: {
                    backgroundColor: 'transparent',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)'
                    }
                  }
                }}
              >
                <Menu.Target>
                  <ActionIcon 
                    variant="transparent" 
                    style={{ 
                      position: 'relative',
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        background: 'rgba(255, 255, 255, 0.1)'
                      }
                    }}
                  >
                    <FiBell 
                      size={20} 
                      color="black"
                      style={{
                        animation: notifications.length > 0 ? 'pulse 2s infinite' : 'none'
                      }}
                    />
                    {notifications.length > 0 && (
                      <Badge 
                        size="xs" 
                        variant="filled" 
                        color="red"
                        style={{
                          position: 'absolute',
                          top: -5,
                          right: -5,
                          borderRadius: '50%',
                          padding: '8px',
                          minWidth: '20px',
                          height: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          border: '2px solid rgba(255, 255, 255, 0.9)',
                          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                          animation: 'bounce 0.5s ease'
                        }}
                      >
                      <span>
                        {notifications.length}
                      </span>
                      </Badge>
                    )}
                  </ActionIcon>
                </Menu.Target>

                <Menu.Dropdown style={{padding: '10px'}}>
                  <Box p="xs">
                    <Group position="apart" mb="xs">
                      <Text weight={500} color="white">Notifications</Text>

                    </Group>
                  </Box>
                  
                  {notifications.length === 0 ? (
                    <Menu.Item>
                      <Box 
                        py="md" 
                        style={{ 
                          textAlign: 'left',
                          color: 'rgba(255, 255, 255, 0.5)'
                        }}
                      >
                        <Text size="sm">No new notifications</Text>
                      </Box>
                    </Menu.Item>
                  ) : (
                    notifications.map((notif) => (
                      <Menu.Item
                        key={notif.id}
                        onClick={() => handleMarkRead(notif.id)}
                        style={{
                          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                          padding: '12px'
                        }}
                      >
                        <Box>
                          <Group position="apart">
                            <Text size="sm" color="white" weight={500}>
                              {notif.type === 'JOIN_REQUEST' ? 'Join Request' : 'Notification'}
                            </Text>
                            <Text size="xs" color="dimmed">
                              {new Date(notif.timestamp).toLocaleTimeString()}
                            </Text>
                          </Group>
                          <Text 
                            size="sm" 
                            color="rgba(255, 255, 255, 0.7)"
                            mt={4}
                          >
                            {notif.type === 'JOIN_REQUEST' 
                              ? `${notif.from} requested to join ${notif.roomId.replace('Room-', 'Room ')}`
                              : notif.message}
                          </Text>
                        </Box>
                      </Menu.Item>
                    ))
                  )}
                </Menu.Dropdown>
              </Menu>
            </Group>
          </Paper>

          <Box
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1rem',
              paddingBottom: '80px',
              '&::-webkit-scrollbar': {
                width: '8px'
              },
              '&::-webkit-scrollbar-track': {
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '4px'
              },
              '&::-webkit-scrollbar-thumb': {
                background: 'rgba(255, 255, 255, 0.3)',
                borderRadius: '4px',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.4)'
                }
              }
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
                      <Text style={{ padding: '5px', wordBreak: 'break-word' }}>
                        {msg.message}
                      </Text>
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
                    padding: '10px',
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
                  minWidth: '100px',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
                  }
                }}
              >
                <Group spacing={2}>
                  <FiSend size={26} />
                </Group>
              </Button>
            </Group>
          </Paper>
        </Paper>
      </Container>

      <style>
        {`
          @keyframes pulse {
            0% {
              transform: scale(1);
            }
            50% {
              transform: scale(1.1);
            }
            100% {
              transform: scale(1);
            }
          }

          @keyframes bounce {
            0% {
              transform: scale(0);
            }
            50% {
              transform: scale(1.2);
            }
            100% {
              transform: scale(1);
            }
          }

          .notification-item {
            transition: all 0.2s ease;
          }

          .notification-item:hover {
            background-color: rgba(255, 255, 255, 0.05);
          }
        `}
      </style>
    </div>
  )
}

export default ChatScreen