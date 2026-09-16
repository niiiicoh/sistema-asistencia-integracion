const { randomBytes, scrypt } = require('node:crypto');
const { promisify } = require('node:util');
const derive = promisify(scrypt);
module.exports = async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = await derive(password, salt, 64);
  return `scrypt:${salt}:${hash.toString('hex')}`;
};
