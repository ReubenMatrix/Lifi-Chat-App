import React, { useState } from 'react';
import { TextInput, Button, Title, Stack, Container, Text, Box } from '@mantine/core';
import { motion } from 'framer-motion';
import { FiMessageCircle, FiUser } from 'react-icons/fi';
import './WelcomeScreen.css';

const WelcomeScreen = ({ onStart }) => {
  const [username, setUsername] = useState('');

  const handleStart = () => {
    if (username.trim()) {
      onStart(username.trim());
    }
  };

  return (
    <div className="welcome-screen">
      <Container className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="motion-div"
        >
          <Box className="glass">
            <Title
              order={1}
              className="title"
            >
              LumiChat
            </Title>

            <Text
              color="white"
              size="lg"
              align="center"
              mb="xl"
              className="description"
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
                classNames={{
                  root: 'text-input'
                }}
              />

              <Button
                onClick={handleStart}
                disabled={!username.trim()}
                size="lg"
                className="start-button"
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