const RoomCard = ({ room, onClick }) => (
    <motion.div
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ width: '100%' }}
    >
      <Paper
        className="glass-card"
        p="xl"
        onClick={onClick}
        style={{
          cursor: 'pointer',
          height: '200px',
          width: '100%',
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
export default RoomCard;