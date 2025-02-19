async function scanForArduinoPorts() {
  try {
    // Use IPC to call the main process
    const ports = await window.api.scanPorts()
    return ports
  } catch (error) {
    return error.message
  }
}

export { scanForArduinoPorts }
