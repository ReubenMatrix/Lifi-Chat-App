import React, { useState, useEffect } from 'react';
import { notifications } from '@mantine/notifications';
import { Button, Stack, Title, Paper, Container, Text, Group, Menu } from '@mantine/core';
import { motion } from 'framer-motion';
import { FiUsers, FiMessageSquare, FiSearch } from 'react-icons/fi';
import { scanForArduinoPorts } from './../helper/postScanning';
import './RoomScreen.css';

const RoomCard = ({ room, onClick, username }) => {
  const [joinStatus, setJoinStatus] = useState('none'); 

  useEffect(() => {
    const checkJoinStatus = async () => {
      try {
        const notifications = await window.api.getNotifications(username);
        const joinNotification = notifications.find(
          n => n.roomId === room.room_id && 
          (n.type === 'JOIN_REQUEST' || n.type === 'JOIN_APPROVED' || n.type === 'JOIN_REJECTED')
        );
        
        if (joinNotification) {
          setJoinStatus(joinNotification.type.split('_')[1].toLowerCase());
        }
      } catch (error) {
        console.error('Error checking join status:', error);
      }
    };
    
    checkJoinStatus();
  }, [room.room_id, username]);


  const handleJoinRoom = async () => {
    try {
      if (room.created_by === username) {
        onClick(room.room_id);
        return;
      }

      if (room.users.includes(username)) {
        onClick(room.room_id);
        return;
      }

      if (joinStatus === 'pending') {
        notifications.show({
          title: 'Pending Request',
          message: 'Your join request is still pending approval',
          color: 'yellow'
        });
        return;
      }

      const result = await window.api.joinRoom(room.room_id, username);
      
      if (result.success && result.notification) {
        if (result.notification.creatorUsername !== username) {
          await window.api.addNotification({
            from: username,
            to: result.notification.creatorUsername,
            type: 'JOIN_REQUEST',
            roomId: room.room_id,
            status: 'PENDING'
          });
          
          notifications.show({
            title: 'Join Request Sent',
            message: `Request sent to ${result.notification.creatorUsername}`,
            color: 'blue'
          });
        }
      }
      
    } catch (error) {
      console.error('Error joining room:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to join room',
        color: 'red'
      });
    }
  };


  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Paper className="glass-card" p="xl" onClick={handleJoinRoom}>
        <div className="card-gradient" />
        <Stack spacing="md" align="center" style={{ zIndex: 1 }}>
          <FiMessageSquare size={40} color="#fff" />
          <Title order={3} style={{ color: '#fff', textAlign: 'center' }}>
            {room.room_id.replace('Room-', 'Room ')}
          </Title>
          <Group spacing="xs" align="center">
            <FiUsers size={16} color="#fff" />
            <Text color="white" size="sm">
              Click to Join
            </Text>
          </Group>
        </Stack>
      </Paper>
    </motion.div>
  );
};




const RoomsScreen = ({ roomId, username, onRoomSelect }) => {
  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [listPorts, setListPorts] = useState([]);
  const [port, setPort] = useState('');

  useEffect(() => {
    const initializePorts = async () => {
      const ports = await scanForArduinoPorts();
      setListPorts(ports);
    };
    initializePorts();
  }, []);

  useEffect(() => {
    if (roomId && username) {
      window.api.joinRoom(roomId, username)
        .catch(error => console.error('Error joining room:', error));

      window.api.getMessages(roomId);
    }
  }, [roomId, username]);

  const loadRooms = async () => {
    setIsLoading(true);
    try {
      const roomsList = await window.api.getRooms();
      setRooms(roomsList);
    } catch (error) {
      console.error('Error loading rooms:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRooms();
  }, []);

  const createRoom = async () => {
    const roomName = `Room-${Date.now()}`;
    try {
      await window.api.createRoom(roomName, username);
      await loadRooms();
    } catch (error) {
      console.error('Error creating room:', error);
    }
  };

  const handleScanPorts = async () => {
    const ports = await scanForArduinoPorts();
    setListPorts(ports);
  };

  return (
    <div className="rooms-container">
      <Container className="main-container">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ height: '100%', overflow: 'auto' }}
        >
          <Paper className="header-paper" p="sm">
            <Title order={1} style={{ color: '#fff', textAlign: 'center' }}>
              Available Rooms
            </Title>
          </Paper>

          <Group className="buttons-group">
            <Button onClick={createRoom} size="lg" className="create-button">
              Create New Room
            </Button>

            <Button onClick={loadRooms} size="lg" variant="outline" color="white" className="refresh-button">
                Refresh Rooms
            </Button>

            <Menu
              shadow="md"
              width={200}
              position="bottom-end"
              styles={(theme) => ({
                dropdown: {
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  zIndex: 1000,
                  position: 'absolute'
                },
                item: {
                  '&:hover': {
                    backgroundColor: theme.colors.gray[1]
                  }
                }
              })}
              offset={5}
              withArrow
              trigger="hover"
            >
              <Menu.Target>
                <Button size="lg" variant="outline" color="white" className="port-button">
                  Select Port
                </Button>
              </Menu.Target>

              <Menu.Dropdown className="menu-dropdown">
                <Menu.Label style={{ color: 'black', fontWeight: 500, width: '100%', padding: '10px' }}>
                  Available Ports
                </Menu.Label>
                {Array.isArray(listPorts) ? (
                  listPorts.map((element, index) => (
                    <Menu.Item
                      key={index}
                      className="menu-item"
                      onClick={() => console.log(element)}
                    >
                      {element}
                    </Menu.Item>
                  ))
                ) : (
                  <Menu.Item className="menu-item">
                    {listPorts}
                  </Menu.Item>
                )}
                <Menu.Divider />
                <Menu.Item
                  leftSection={<FiSearch size={14} />}
                  style={{
                    borderRadius: '5px',
                    marginTop: '5px',
                    color: 'white',
                    width: '100%',
                    display: 'flex',
                    background: '#228BE6',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Button
                    className="scan-button"
                    onClick={handleScanPorts}
                  >
                    Scan Now
                  </Button>
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>

          <div className="rooms-grid">
            {isLoading ? (
              [...Array(3)].map((_, index) => (
                <Paper key={index} p="xl" className="loading-card" />
              ))
            ) : rooms.length > 0 ? (
              rooms.map((room) => (
                <RoomCard
                  key={room.room_id}
                  room={room}
                  onClick={onRoomSelect}
                  onJoinRoom={async (roomId) => {
                    try {
                      await window.api.joinRoom(roomId, username);
                    } catch (error) {
                      console.error('Error joining room:', error);
                    }
                  }}
                  username={username}
                />
              ))
            ) : (
              <Paper p="xl" className="empty-rooms-message">
                <Text color="white" size="lg">
                  No rooms available. Create one to get started!
                </Text>
              </Paper>
            )}
          </div>
        </motion.div>
      </Container>
    </div>
  );
};

export default RoomsScreen;