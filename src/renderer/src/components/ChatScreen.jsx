import React, { useState, useEffect, useRef, useCallback } from 'react';
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
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { motion, AnimatePresence } from 'framer-motion';
import { FiArrowLeft, FiSend, FiBell, FiCheck, FiX } from 'react-icons/fi';
import './ChatScreen.css';

const ChatScreen = ({ roomId, username, onBack }) => {
  // State management
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [hasAccess, setHasAccess] = useState(false);
  const [isRoomOwner, setIsRoomOwner] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastMessageTimestamp, setLastMessageTimestamp] = useState(0);

  // Refs
  const messagesEndRef = useRef(null);
  const notificationPollingRef = useRef(null);

  // Scroll to bottom of messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Check room access
  useEffect(() => {
    const checkRoomAccess = async () => {
      try {
        const rooms = await window.api.getRooms();
        const currentRoom = rooms.find(r => r.room_id === roomId);
        
        if (currentRoom) {
          setIsRoomOwner(currentRoom.created_by === username);
          setHasAccess(currentRoom.users.includes(username));
        }
      } catch (error) {
        console.error('Error checking room access:', error);
        notifications.show({
          title: 'Error',
          message: 'Failed to check room access',
          color: 'red'
        });
      }
    };

    checkRoomAccess();
  }, [roomId, username]);

  // Load messages
  const loadMessages = useCallback(async () => {
    try {
      const messagesList = await window.api.getMessages(roomId);
      console.log('Received messages:', messagesList); // Debug log

      // Check if there are new messages
      const latestMessage = messagesList[messagesList.length - 1];
      if (!latestMessage || latestMessage.timestamp > lastMessageTimestamp) {
        setMessages(messagesList);
        if (latestMessage) {
          setLastMessageTimestamp(latestMessage.timestamp);
        }
        scrollToBottom();
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading messages:', error);
      setIsLoading(false);
    }
  }, [roomId, lastMessageTimestamp, scrollToBottom]);

  // Initial message load and periodic check
  useEffect(() => {
    loadMessages();
    
    const messageInterval = setInterval(() => {
      if (!isLoading) {
        loadMessages();
      }
    }, 3000);

    return () => clearInterval(messageInterval);
  }, [loadMessages, isLoading]);

  // Load notifications
  const loadNotifications = useCallback(async () => {
    try {
      const notifs = await window.api.getNotifications(username);
      setNotifications(notifs);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }, [username]);

  // Notification polling
  useEffect(() => {
    loadNotifications();
    notificationPollingRef.current = setInterval(loadNotifications, 5000);

    return () => {
      if (notificationPollingRef.current) {
        clearInterval(notificationPollingRef.current);
      }
    };
  }, [loadNotifications]);

  // Handle notification actions
  const handleMarkRead = async (notificationId) => {
    try {
      await window.api.markNotificationRead(notificationId);
      await loadNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to mark notification as read',
        color: 'red'
      });
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await Promise.all(
        notifications.map(notif => 
          window.api.markNotificationRead(notif.id)
        )
      );
      await loadNotifications();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to mark all notifications as read',
        color: 'red'
      });
    }
  };

  // Handle join requests
  const handleJoinRequest = async (notification, isApproved) => {
    try {
      if (isApproved) {
        await window.api.approveJoinRequest(
          notification.id,
          notification.from,
          notification.roomId
        );
        notifications.show({
          title: 'Success',
          message: `Approved ${notification.from}'s join request`,
          color: 'green'
        });
      } else {
        await window.api.rejectJoinRequest(
          notification.id,
          notification.from,
          notification.roomId
        );
        notifications.show({
          title: 'Success',
          message: `Rejected ${notification.from}'s join request`,
          color: 'blue'
        });
      }
      await handleMarkRead(notification.id);
      await loadNotifications();
    } catch (error) {
      console.error('Error handling join request:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to process join request',
        color: 'red'
      });
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!hasAccess) {
      notifications.show({
        title: 'Access Denied',
        message: 'You do not have access to send messages in this room',
        color: 'red'
      });
      return;
    }

    if (newMessage.trim()) {
      try {
        const result = await window.api.sendMessage({
          roomId,
          username,
          message: newMessage.trim()
        });

        if (result.success) {
          setNewMessage('');
          await loadMessages(); // Immediately load new messages
        }
      } catch (error) {
        console.error('Error sending message:', error);
        notifications.show({
          title: 'Error',
          message: 'Failed to send message',
          color: 'red'
        });
      }
    }
  };

  // Render notification
  const renderNotification = (notification) => {
    if (notification.type === 'JOIN_REQUEST' && isRoomOwner) {
      return (
        <Menu.Item key={notification.id} className="notification-item">
          <Box>
            <Group position="apart">
              <Text size="sm" color="white" weight={500}>
                Join Request
              </Text>
              <Text size="xs" color="dimmed">
                {new Date(notification.timestamp).toLocaleTimeString()}
              </Text>
            </Group>
            <Text 
              size="sm" 
              color="rgba(255, 255, 255, 0.7)"
              mt={4}
            >
              {`${notification.from} requested to join ${notification.roomId.replace('Room-', 'Room ')}`}
            </Text>
            <Group mt="sm" spacing="xs">
              <Button
                size="xs"
                color="green"
                leftIcon={<FiCheck size={14} />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleJoinRequest(notification, true);
                }}
              >
                Accept
              </Button>
              <Button
                size="xs"
                color="red"
                leftIcon={<FiX size={14} />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleJoinRequest(notification, false);
                }}
              >
                Reject
              </Button>
            </Group>
          </Box>
        </Menu.Item>
      );
    }

    return (
      <Menu.Item
        key={notification.id}
        onClick={() => handleMarkRead(notification.id)}
        className="notification-item"
      >
        <Box>
          <Group position="apart">
            <Text size="sm" color="white" weight={500}>
              {notification.type === 'JOIN_APPROVED' ? 'Join Request Approved' :
               notification.type === 'JOIN_REJECTED' ? 'Join Request Rejected' :
               'Notification'}
            </Text>
            <Text size="xs" color="dimmed">
              {new Date(notification.timestamp).toLocaleTimeString()}
            </Text>
          </Group>
          <Text 
            size="sm" 
            color="rgba(255, 255, 255, 0.7)"
            mt={4}
          >
            {notification.message || 
             (notification.type === 'JOIN_APPROVED' 
              ? `Your request to join ${notification.roomId.replace('Room-', 'Room ')} was approved`
              : notification.type === 'JOIN_REJECTED'
              ? `Your request to join ${notification.roomId.replace('Room-', 'Room ')} was rejected`
              : notification.message)}
          </Text>
        </Box>
      </Menu.Item>
    );
  };

  return (
    <div className="chat-container">
      <Container size="lg" className="main-container">
        <Paper className="chat-paper">
          {/* Header */}
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

                {/* Notifications Menu */}
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
                        {notifications.length > 0 && (
                          <Button 
                            variant="subtle" 
                            size="xs"
                            onClick={handleMarkAllRead}
                          >
                            Mark all read
                          </Button>
                        )}
                      </Group>
                    </Box>
                    
                    <AnimatePresence>
                      {notifications.length === 0 ? (
                        <Menu.Item>
                          <Box py="md" className="empty-notifications">
                            <Text size="sm">No new notifications</Text>
                          </Box>
                        </Menu.Item>
                      ) : (
                        notifications.map(notification => renderNotification(notification))
                      )}
                    </AnimatePresence>
                  </Menu.Dropdown>
                </Menu>
              </Group>
            </div>
          </Paper>

          {/* Access Warning */}
          {!hasAccess && (
            <Paper className="access-denied-message" p="md">
              <Text color="red" align="center">
                Waiting for room access approval...
              </Text>
            </Paper>
          )}

          {/* Messages */}
          <Box className="messages-container">
            <Stack spacing="md">
              {isLoading && messages.length === 0 ? (
                <Text color="dimmed" align="center">Loading messages...</Text>
              ) : messages.length > 0 ? (
                messages.map((msg) => (
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
                ))
              ) : (
                <Text color="dimmed" align="center">No messages yet</Text>
              )}
              <div ref={messagesEndRef} />
            </Stack>
          </Box>

          {/* Message Input */}
          <Paper className="message-input-container">
            <Group spacing="sm" align="center" style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <TextInput
                placeholder={hasAccess ? "Type a message..." : "Waiting for access..."}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                style={{ flex: 1 }}
                disabled={!hasAccess}
                classNames={{
                  input: 'message-input'
                }}
              />
              <Button
                onClick={sendMessage}
                disabled={!hasAccess || !newMessage.trim()}
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
  );
};

export default ChatScreen;