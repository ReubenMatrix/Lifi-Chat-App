const { initializeKeys } = require('./../main/keyManager')

initializeKeys()
  .then(() => {
    console.log('Encryption Key and IV stored successfully in Keytar.')
  })
  .catch((err) => console.error('Error storing keys:', err))
