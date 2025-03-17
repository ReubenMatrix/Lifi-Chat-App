const keytar = require('keytar')

const SERVICE_NAME = 'LumiChat'
const KEY_NAME = 'encryption_key'
const IV_NAME = 'encryption_iv'

const FIXED_KEY = '0123456789abcde89abcf01234567def'
const FIXED_IV = 'abc87654def93210'

async function initializeKeys() {
  await keytar.setPassword(SERVICE_NAME, KEY_NAME, FIXED_KEY)
  await keytar.setPassword(SERVICE_NAME, IV_NAME, FIXED_IV)
}

async function getEncryptionKeys() {
  const key = await keytar.getPassword(SERVICE_NAME, KEY_NAME)
  const iv = await keytar.getPassword(SERVICE_NAME, IV_NAME)

  if (!key || !iv) {
    throw new Error('Encryption key or IV not found. Run initializeKeys() first.')
  }

  return { key: Buffer.from(key, 'utf8'), iv: Buffer.from(iv, 'utf8') }
}

module.exports = { initializeKeys, getEncryptionKeys }
