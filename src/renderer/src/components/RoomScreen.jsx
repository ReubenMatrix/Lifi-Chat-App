import React, { useState, useEffect } from 'react';
import { Button, Stack, Title, Paper, Container, Grid, Text, Group } from '@mantine/core';
import { motion } from 'framer-motion';
import { FiPlus, FiUsers, FiMessageSquare, FiHash, FiRefreshCw } from 'react-icons/fi';

const RoomCard = ({ room, onClick }) => (
  <motion.div
    whileHover={{ scale: 1.03 }}
    whileTap={{ scale: 0.98 }}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
  >
    <Paper
      className="glass-card"
      p="xl"
      onClick={onClick}
      style={{
        cursor: 'pointer',
        height: '200px',
        width: '500px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.1,
          background: 'linear-gradient(45deg, #FF6B6B 0%, #FFE66D 100%)',
          zIndex: 0
        }}
      />

      <Stack spacing="md" align="center" style={{ zIndex: 1 }}>
        <FiMessageSquare size={40} color="#fff" />
        <Title order={3} style={{ color: '#fff', textAlign: 'center' }}>
          {room.room_id.replace('Room-', 'Room ')}
        </Title>
        <Group spacing="xs" align="center">
          <FiUsers size={16} color="#fff" />
          <Text color="white" size="sm">Click to Join</Text>
        </Group>
      </Stack>
    </Paper>
  </motion.div>
);

const RoomsScreen = ({ onJoinRoom }) => {
  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

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
  }, []); // Only load rooms once when component mounts

  const createRoom = async () => {
    const roomName = `Room-${Date.now()}`;
    await window.api.createRoom(roomName);
    await loadRooms(); 
  };

  return (
    <div 
      style={{ 
        minHeight: '100vh', 
        width: '100vw',
        padding: '2rem',
        display: 'flex',
        alignItems: 'flex-start', // Changed from center to flex-start
        justifyContent: 'center',
        overflow: 'hidden' // Added to prevent horizontal scroll
      }}>
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '20px',
          textAlign: 'center',
          overflowY: 'auto', // Added to enable vertical scrolling
          maxHeight: 'calc(100vh - 4rem)' // Subtract padding from viewport height
        }}
      >
        <Container styles={{ width: '100%', maxWidth: '1200px' }}> {/* Increased maxWidth */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Header Section */}
            <div style={{ marginBottom: '2rem', position: 'sticky', top: 0, zIndex: 10 }}>
              <Paper
                p="sm"
                style={{
                  marginBottom: '2rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  width: '100%',
                }}
              >
                <Title order={1} style={{ color: '#fff' }}>
                  Available Rooms
                </Title>
              </Paper>
  
              <Group position="center" style={{ width: '100%' }}>
                <Button
                  onClick={createRoom}
                  size="lg"
                  style={{
                    background: 'white',
                    padding: '15px 20px',
                    borderRadius: '10px',
                    border: 'none',
                  }}
                >
                  Create New Room
                </Button>
                <Button
                  onClick={loadRooms}
                  size="lg"
                  variant="outline"
                  color="white"
                  style={{ 
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    background: 'none',
                    color: 'white',
                    padding: '15px 20px',
                    borderRadius: '10px',
                  }}
                >
                  Refresh Rooms
                </Button>
              </Group>
            </div>
  

            <div style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', 
              gap: '2rem',
              padding: '1rem',
              width: '100%',
              justifyItems: 'center'
            }}>
              {isLoading ? (
                [...Array(3)].map((_, index) => (
                  <Paper
                    key={index}
                    p="xl"
                    style={{
                      height: '200px',
                      width: '500px',
                      opacity: 0.5,
                      background: 'rgba(255, 255, 255, 0.1)',
                      animation: 'pulse 1.5s infinite'
                    }}
                  />
                ))
              ) : rooms.length > 0 ? (
                rooms.map((room) => (
                  <RoomCard key={room.room_id} room={room} onClick={() => onJoinRoom(room.room_id)} />
                ))
              ) : (
                <Paper
                  p="xl"
                  style={{ 
                    textAlign: 'center',
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    gridColumn: '1 / -1',
                    width: '100%'
                  }}
                >
                  <Text color="white" size="lg">
                    No rooms available. Create one to get started!
                  </Text>
                </Paper>
              )}
            </div>
          </motion.div>
        </Container>
      </div>
    </div>
  );
};




export default RoomsScreen;