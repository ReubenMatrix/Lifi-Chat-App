const { encrypt, decrypt } = require('../main/cryptoHelper')

async function testEncryption() {
  const mssg = {
    type: 'CHAT-MESSAGE',
    data: {
      room_id: 'Room-1739857968879',
      timestamp: 1739858328845,
      username: 'reuben',
      message: 'GWGSW'
    }
  }

  console.log('🔹 Original JSON:', mssg)

  const encrypted = await encrypt(mssg)
  console.log('Encrypted:', encrypted)

  const decrypted = await decrypt(encrypted)
  console.log('Decrypted JSON:', decrypted)
}

testEncryption()
