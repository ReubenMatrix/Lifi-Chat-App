import React, { useState, useEffect } from 'react'
import {
  Button,
  Stack,
  Title,
  Paper,
  Container,
  Grid,
  Text,
  Group,
  TextInput,
  Menu
} from '@mantine/core'
import { motion } from 'framer-motion'
import {
  FiPlus,
  FiUsers,
  FiMessageSquare,
  FiHash,
  FiRefreshCw,
  FiTrash,
  FiSearch
} from 'react-icons/fi'
import { scanForArduinoPorts } from './../helper/postScanning'

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
        border: '1px solid rgba(255, 255, 255, 0.2)'
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
          <Text color="white" size="sm">
            Click to Join
          </Text>
        </Group>
      </Stack>
    </Paper>
  </motion.div>
)

const RoomsScreen = ({ onJoinRoom }) => {
  const [rooms, setRooms] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [listPorts, setListPorts] = useState([])
  const [port, setPort] = useState('')

  useEffect(() => {
    const initializePorts = async () => {
      const ports = await scanForArduinoPorts()
      setListPorts(ports)
    }
    initializePorts()
  }, [])

  const loadRooms = async () => {
    setIsLoading(true)
    try {
      const roomsList = await window.api.getRooms()
      setRooms(roomsList)
    } catch (error) {
      console.error('Error loading rooms:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadRooms()
  }, [])

  const createRoom = async () => {
    const roomName = `Room-${Date.now()}`
    await window.api.createRoom(roomName)
    await loadRooms()
  }

  const handleScanPorts = async () => {
    const ports = await scanForArduinoPorts()
    setListPorts(ports)
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        padding: '2rem',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        overflow: 'auto',
        maxHeight: '100vh'
      }}
    >
      <Container
        styles={{
          width: '100%',
          maxWidth: '1400px',
          height: '100%',
          overflow: 'auto',
          root: {
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
          }
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            height: '100%',
            overflow: 'auto'
          }}
        >
          <Paper
            p="sm"
            style={{
              marginBottom: '2rem',
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <Title order={1} style={{ color: '#fff' }}>
              Available Rooms
            </Title>
          </Paper>

          <Group
            position="center"
            style={{
              width: '100%',
              marginBottom: '2rem',
              display: 'flex',
              justifyContent: 'space-evenly'
            }}
          >
            <Button
              onClick={createRoom}
              size="lg"
              style={{
                background: 'white',
                padding: '15px 20px',
                borderRadius: '10px',
                border: 'none'
              }}
            >
              Create New Room
            </Button>

            <Button
              size="lg"
              variant="outline"
              color="white"
              style={{
                borderColor: 'rgba(255, 255, 255, 0.2)',
                background: 'none',
                color: 'white',
                padding: '15px 20px',
                borderRadius: '10px'
              }}
            >
              <Group>
                <span>Refresh Rooms</span>
              </Group>
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
                <Button
                  size="lg"
                  variant="outline"
                  color="white"
                  style={{
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    padding: '15px 20px',
                    borderRadius: '10px',
                    position: 'relative'
                  }}
                >
                  Select Port
                </Button>
              </Menu.Target>

              <Menu.Dropdown
                style={{
                  padding: '10px',
                  borderRadius: '10px',
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'white'
                }}
              >
                <Menu.Label
                  style={{ color: 'white', fontWeight: 500, width: '100%', padding: '10px' }}
                >
                  Available Ports
                </Menu.Label>
                {Array.isArray(listPorts) ? (
                  listPorts.map((element, index) => (
                    <Menu.Item
                      key={index}
                      style={{
                        color: 'white',
                        width: '100%',
                        borderRadius: '5px',
                        background: '#228BE6',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                      onClick={() => {
                        console.log(element)
                      }}
                    >
                      {element}
                    </Menu.Item>
                  ))
                ) : (
                  <Menu.Item
                    style={{
                      color: 'white',
                      width: '100%',
                      borderRadius: '5px',
                      background: '#228BE6',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
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
                    border: 'black',
                    width: '100%',
                    display: 'flex',
                    background: '#228BE6',
                    alignItems: 'center',
                    justifyContent: 'center',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.05)'
                    }
                  }}
                >
                  <Button
                    style={{ backgroundColor: 'transparent', border: 'none', color: 'white' }}
                    onClick={handleScanPorts}
                  >
                    Scan Now
                  </Button>
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>

          <div
            style={{
              display: 'flex',
              gap: '2rem',
              width: '100%'
            }}
          >
            <div style={{ flex: 2 }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
                  gap: '2rem',
                  width: '100%',
                  justifyItems: 'center'
                }}
              >
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
                    <RoomCard
                      key={room.room_id}
                      room={room}
                      onClick={() => onJoinRoom(room.room_id)}
                    />
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
            </div>
          </div>
        </motion.div>
      </Container>
    </div>
  )
}

export default RoomsScreen
