import React, { useState } from 'react';
import { TextInput, Button, Title, Stack, Container, Text, Box } from '@mantine/core';
import { motion } from 'framer-motion';
import { FiMessageCircle, FiUser } from 'react-icons/fi';

const WelcomeScreen = ({ onStart }) => {
  const [username, setUsername] = useState('');

  const handleStart = () => {
    if (username.trim()) {
      onStart(username.trim());
    }
  };

  return (
    <div 
      style={{ 
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <Container styles={{ width: '100%', maxWidth: '500px' }}>
      <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ width: '100%' }} 
        >
        <Box className='glass'>
          <Title
            order={1}
            style={{
              color: '#fff',
              textAlign: 'center',
            }}
          >
            LumiChat
          </Title>

          <Text
            color="white"
            size="lg"
            align="center"
            mb="xl"
            style={{
              fontSize: 'clamp(0.875rem, 2vw, 1.125rem)',
              lineHeight: 1.6
            }}
          >
            Real-time chat application with seamless communication across devices.
            Join rooms, connect with others, and chat instantly.



            <TextInput
              icon={<FiUser />}
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleStart()}
              size="lg"
              styles={(theme) => ({
                root: {
                  width: '100%',
                  maxWidth: '300px',
                  padding: '10px',
                },
                input: {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  height: '28px',
                  borderRadius: '5px',
                  padding: '5px 10px',
                  fontSize: 'clamp(0.875rem, 2vw, 1rem)',
                  '&::placeholder': {
                    color: 'rgba(255, 255, 255, 0.7)'
                  },
                  '&:focus': {
                    borderColor: theme.colors.blue[5]
                  }
                }
              })}
            />


            <Button
              onClick={handleStart}
              disabled={!username.trim()}
              size="lg"
              style={{
                background: 'white',
                color: 'black',
                padding: '5px',
                borderRadius: '5px',
                width: '100%', 
                maxWidth: '200px', 
                height: '50px',
                fontSize: 'clamp(0.875rem, 2vw, 1rem)', 
                transition: 'transform 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-2px)'
                }
              }}
            >
              Start Chatting
            </Button>
          </Text>

        </Box>
        </motion.div>
      </Container>
    </div>
  );
};

export default WelcomeScreen;