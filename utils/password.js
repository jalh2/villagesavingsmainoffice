const crypto = require('crypto');

const SALT_BYTES = 16;
const ITERATIONS = 10000;
const KEY_LENGTH = 64;
const DIGEST = 'sha512';

const hashPassword = (password) => {
  const salt = crypto.randomBytes(SALT_BYTES).toString('hex');
  const hash = crypto
    .pbkdf2Sync(String(password), salt, ITERATIONS, KEY_LENGTH, DIGEST)
    .toString('hex');
  return `${salt}:${hash}`;
};

const comparePassword = (password, storedValue) => {
  if (!storedValue || !storedValue.includes(':')) {
    return false;
  }
  const [salt, originalHash] = storedValue.split(':');
  if (!salt || !originalHash) {
    return false;
  }
  const hash = crypto
    .pbkdf2Sync(String(password), salt, ITERATIONS, KEY_LENGTH, DIGEST)
    .toString('hex');
  if (hash.length !== originalHash.length) {
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(originalHash, 'hex'));
};

module.exports = { hashPassword, comparePassword };
