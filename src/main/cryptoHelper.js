const crypto = require('crypto')
const { getEncryptionKeys } = require('./keyManager')

// Encrypt Function
async function encrypt(jsonData) {
  const { key, iv } = await getEncryptionKeys()

  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)
  const jsonString = JSON.stringify(jsonData)
  let encrypted = cipher.update(jsonString, 'utf8', 'base64')
  encrypted += cipher.final('base64')

  return encrypted
}

// Decrypt Function
async function decrypt(encryptedText) {
  const { key, iv } = await getEncryptionKeys()

  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)
  let decrypted = decipher.update(encryptedText, 'base64', 'utf8')
  decrypted += decipher.final('utf8')

  return JSON.parse(decrypted)
}

module.exports = { encrypt, decrypt }
