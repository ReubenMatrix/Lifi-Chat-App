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
import './ChatScreen.css'

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
    <div className="chat-container">
      <Container size="lg" className="main-container">
        <Paper className="chat-paper">
          <Paper p="md" className="header-paper">
            <div className="header-content">
              <Group spacing="md" position="center" align="center">
                <Button
                  variant="subtle"
                  color="gray"
                  onClick={onBack}
                  leftIcon={<FiArrowLeft size={16} />}
                  className="back-button"
                >
                  Back
                </Button>
                
                <Title order={3} style={{ color: 'white' }}>
                  {roomId.replace('Room-', 'Room ')}
                </Title>

                <Menu 
                  position="bottom-end" 
                  shadow="md"
                  width={300}
                  className="notification-menu"
                >
                  <Menu.Target>
                    <ActionIcon className="notification-icon">
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
                          className="notification-badge"
                        >
                          {notifications.length}
                        </Badge>
                      )}
                    </ActionIcon>
                  </Menu.Target>

                  <Menu.Dropdown className="notification-menu-dropdown">
                    <Box p="xs">
                      <Group position="apart" mb="xs">
                        <Text weight={500} color="white">Notifications</Text>
                      </Group>
                    </Box>
                    
                    {notifications.length === 0 ? (
                      <Menu.Item>
                        <Box py="md" className="empty-notifications">
                          <Text size="sm">No new notifications</Text>
                        </Box>
                      </Menu.Item>
                    ) : (
                      notifications.map((notif) => (
                        <Menu.Item
                          key={notif.id}
                          onClick={() => handleMarkRead(notif.id)}
                          className="notification-item"
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
            </div>
          </Paper>

          <Box className="messages-container">
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
                      className={msg.username === username ? 'message-outgoing' : 'message-incoming'}
                    >
                      <Text className="message-bubble">
                        {msg.message}
                      </Text>
                    </Paper>
                    <Text 
                      size="xs" 
                      color="white" 
                      className="message-timestamp"
                      style={{
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

          <Paper className="message-input-container">
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
                classNames={{
                  input: 'message-input'
                }}
              />
              <Button
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                className="send-button"
              >
                <Group spacing={2}>
                  <FiSend size={26} />
                </Group>
              </Button>
            </Group>
          </Paper>
        </Paper>
      </Container>
    </div>
  )
}

export default ChatScreen