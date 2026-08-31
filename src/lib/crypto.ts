import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;  // 96-bit IV for GCM
const TAG_LENGTH = 16; // 128-bit auth tag

function getSecret(): Buffer {
  const secret = process.env.KEY_ENCRYPTION_SECRET;
  if (!secret || secret.length !== 64) {
    throw new Error(
      'KEY_ENCRYPTION_SECRET must be a 64-character hex string (32 bytes). ' +
      'Generate: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
  }
  return Buffer.from(secret, 'hex');
}

/**
 * Encrypts a plaintext license key.
 * Output format: iv(hex):authTag(hex):ciphertext(hex)
 */
export function encryptKey(plaintext: string): string {
  const key = getSecret();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return [
    iv.toString('hex'),
    tag.toString('hex'),
    encrypted.toString('hex'),
  ].join(':');
}

/**
 * Decrypts an encrypted license key produced by encryptKey().
 */
export function decryptKey(encryptedValue: string): string {
  const key = getSecret();
  const [ivHex, tagHex, ciphertextHex] = encryptedValue.split(':');

  if (!ivHex || !tagHex || !ciphertextHex) {
    throw new Error('Invalid encrypted key format.');
  }

  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const ciphertext = Buffer.from(ciphertextHex, 'hex');

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}
