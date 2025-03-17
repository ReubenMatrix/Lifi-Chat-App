const { encrypt, decrypt } = require('../main/cryptoHelper')

async function testEncryption() {
  const mssg = {
    type: 'chat',
    message: 'newMessage.trim()',
  }

  console.log('🔹 Original JSON:', mssg)

  const encrypted = await encrypt(mssg)
  console.log('Encrypted:', encrypted)

  const decrypted = await decrypt(encrypted)
  console.log('Decrypted JSON:', decrypted)
}

testEncryption()
