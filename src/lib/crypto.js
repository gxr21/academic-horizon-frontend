/**
 * E2EE Crypto Utilities — Client-side only.
 *
 * Uses Web Crypto API:
 *   - RSA-OAEP (2048-bit) for key exchange
 *   - AES-GCM (256-bit) for message encryption
 *
 * Private keys NEVER leave the client. They are stored in IndexedDB.
 * Public keys are registered with the server for key exchange.
 */

// ─── Helpers ────────────────────────────────────────────

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export const toBase64 = (buffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

export const fromBase64 = (base64) => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

// ─── IndexedDB for Private Key Storage ──────────────────

const DB_NAME = 'AcademicHorizonCrypto';
const STORE_NAME = 'keys';
const DB_VERSION = 1;

const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const storeKey = async (id, key) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put({ id, key });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

const getKey = async (id) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).get(id);
    request.onsuccess = () => resolve(request.result?.key || null);
    request.onerror = () => reject(request.error);
  });
};

// ─── RSA Key Pair Generation ────────────────────────────

/**
 * Generate RSA-OAEP key pair (2048-bit).
 * Returns { publicKey, privateKey } as CryptoKey objects.
 */
export const generateRSAKeyPair = async () => {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true, // extractable
    ['encrypt', 'decrypt']
  );
  return keyPair;
};

/**
 * Export RSA public key to Base64 (for sending to server).
 */
export const exportPublicKey = async (publicKey) => {
  const exported = await crypto.subtle.exportKey('spki', publicKey);
  return toBase64(exported);
};

/**
 * Import RSA public key from Base64 (received from server).
 */
export const importPublicKey = async (base64Key) => {
  const keyData = fromBase64(base64Key);
  return crypto.subtle.importKey(
    'spki',
    keyData,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['encrypt']
  );
};

/**
 * Export RSA private key to Base64 (for IndexedDB storage).
 */
const exportPrivateKey = async (privateKey) => {
  const exported = await crypto.subtle.exportKey('pkcs8', privateKey);
  return toBase64(exported);
};

/**
 * Import RSA private key from Base64 (from IndexedDB).
 */
const importPrivateKey = async (base64Key) => {
  const keyData = fromBase64(base64Key);
  return crypto.subtle.importKey(
    'pkcs8',
    keyData,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['decrypt']
  );
};

// ─── Key Management ─────────────────────────────────────

/**
 * Generate and store key pair. Returns Base64-encoded public key.
 * Private key is stored in IndexedDB and NEVER sent to server.
 */
export const generateAndStoreKeyPair = async (userId) => {
  const keyPair = await generateRSAKeyPair();

  // Store private key in IndexedDB
  const privateKeyBase64 = await exportPrivateKey(keyPair.privateKey);
  await storeKey(`privateKey_${userId}`, privateKeyBase64);

  // Also store public key locally for reference
  const publicKeyBase64 = await exportPublicKey(keyPair.publicKey);
  await storeKey(`publicKey_${userId}`, publicKeyBase64);

  return publicKeyBase64;
};

/**
 * Get stored private key for decryption.
 */
export const getStoredPrivateKey = async (userId) => {
  const base64Key = await getKey(`privateKey_${userId}`);
  if (!base64Key) return null;
  return importPrivateKey(base64Key);
};

/**
 * Base64 public key stored next to the private key.
 * This is the key that can actually decrypt messages in THIS browser.
 */
export const getStoredPublicKeyBase64 = async (userId) => {
  return getKey(`publicKey_${userId}`);
};

/**
 * Get the user's own stored public key (as CryptoKey), used to wrap the
 * AES key for the sender so they can decrypt their own messages.
 */
export const getStoredPublicKey = async (userId) => {
  const base64Key = await getKey(`publicKey_${userId}`);
  if (!base64Key) return null;
  return importPublicKey(base64Key);
};

/**
 * Check if key pair exists for user.
 */
export const hasKeyPair = async (userId) => {
  const key = await getKey(`privateKey_${userId}`);
  return !!key;
};

// ─── AES Encryption / Decryption ────────────────────────

/**
 * Generate random AES-GCM key (256-bit).
 */
const generateAESKey = async () => {
  return crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true, // extractable (so we can wrap it with RSA)
    ['encrypt', 'decrypt']
  );
};

// ─── Hybrid Encrypt / Decrypt ───────────────────────────

/**
 * Encrypt a message using hybrid encryption:
 * 1. Generate random AES key
 * 2. Encrypt message with AES-GCM
 * 3. Wrap (encrypt) AES key with recipient's RSA public key
 *
 * @param {string} plaintext - The message to encrypt
 * @param {CryptoKey} recipientPublicKey - Recipient's RSA public key
 * @returns {{ encryptedMessage: string, iv: string, wrappedKey: string }}
 */
export const encryptMessage = async (
  plaintext,
  recipientPublicKey,
  senderPublicKey = null,
  adminKeys = []
) => {
  // 1. Generate random AES key
  const aesKey = await generateAESKey();

  // 2. Encrypt message with AES-GCM
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encodedMessage = encoder.encode(plaintext);
  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    encodedMessage
  );

  // 3. Wrap AES key with recipient's RSA public key
  const rawAESKey = await crypto.subtle.exportKey('raw', aesKey);
  const wrappedKeyBuffer = await crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    recipientPublicKey,
    rawAESKey
  );

  // 4. Also wrap the AES key with the sender's own public key (so the sender
  //    can read their own messages, including after a page reload)
  let senderWrappedKey;
  if (senderPublicKey) {
    const senderWrappedBuffer = await crypto.subtle.encrypt(
      { name: 'RSA-OAEP' },
      senderPublicKey,
      rawAESKey
    );
    senderWrappedKey = toBase64(senderWrappedBuffer);
  }

  // 5. Safety review: wrap the AES key for every admin too, so admins (and only they,
  //    using their private key) can read the conversation. `adminKeys` = [{ adminId, key: CryptoKey }]
  const adminWrappedKeys = [];
  for (const { adminId, key } of adminKeys) {
    const wrapped = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, key, rawAESKey);
    adminWrappedKeys.push({ adminId, wrappedKey: toBase64(wrapped) });
  }

  return {
    encryptedMessage: toBase64(encryptedBuffer),
    iv: toBase64(iv),
    wrappedKey: toBase64(wrappedKeyBuffer),
    senderWrappedKey,
    adminWrappedKeys,
  };
};

/**
 * Decrypt a message using hybrid decryption:
 * 1. Unwrap (decrypt) AES key with own RSA private key
 * 2. Decrypt message with AES-GCM
 *
 * @param {{ encryptedMessage: string, iv: string, wrappedKey: string }} encryptedData
 * @param {CryptoKey} privateKey - Own RSA private key
 * @returns {string} - The decrypted plaintext
 */
export const decryptMessage = async (encryptedData, privateKey) => {
  // 1. Unwrap AES key
  const wrappedKeyBuffer = fromBase64(encryptedData.wrappedKey);
  const rawAESKey = await crypto.subtle.decrypt(
    { name: 'RSA-OAEP' },
    privateKey,
    wrappedKeyBuffer
  );

  // Import AES key
  const aesKey = await crypto.subtle.importKey(
    'raw',
    rawAESKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );

  // 2. Decrypt message
  const iv = fromBase64(encryptedData.iv);
  const encryptedBuffer = fromBase64(encryptedData.encryptedMessage);
  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    encryptedBuffer
  );

  return decoder.decode(decryptedBuffer);
};
