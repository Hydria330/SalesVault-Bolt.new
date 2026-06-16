/**
 * Crypto Module - AES-256-GCM Encryption with PBKDF2 Key Derivation
 *
 * Architecture follows 1Password/Bitwarden mature patterns:
 * - PBKDF2-SHA256 with 100,000+ iterations for key derivation
 * - AES-256-GCM for authenticated encryption (confidentiality + integrity)
 * - Random salt per user, random IV per encryption operation
 * - Encryption key exists ONLY in device memory, never persisted
 *
 * All crypto operations use the browser-native Web Crypto API.
 * No third-party crypto libraries are used.
 */

const PBKDF2_ITERATIONS = 100000;
const AES_KEY_LENGTH = 256;
const IV_LENGTH = 12; // 12 bytes for AES-GCM
const SALT_LENGTH = 16; // 16 bytes

// ============ Salt Management ============

/**
 * Generate a cryptographically random salt.
 * The salt is stored in plaintext (it's not secret) and is used
 * to ensure the same password produces different keys for different users.
 */
export function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
}

/**
 * Store salt in localStorage (not secret, just needs to be persistent).
 */
export function storeSalt(salt: Uint8Array): void {
  localStorage.setItem('crypto_salt', arrayBufferToBase64(salt.buffer));
}

/**
 * Retrieve stored salt. Returns null if not found.
 */
export function getStoredSalt(): Uint8Array | null {
  const stored = localStorage.getItem('crypto_salt');
  if (!stored) return null;
  return new Uint8Array(base64ToArrayBuffer(stored));
}

// ============ Key Derivation (PBKDF2) ============

/**
 * Derive an AES-256 encryption key from the user's master password.
 *
 * Process:
 * 1. Encode password as UTF-8 bytes
 * 2. Import as raw key material
 * 3. Use PBKDF2 with SHA-256, 100,000 iterations, and the user's salt
 * 4. Output: CryptoKey object (AES-256-GCM)
 *
 * The derived key exists ONLY in memory. It is never stored anywhere.
 */
export async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: AES_KEY_LENGTH },
    false, // not extractable - key cannot be exported
    ['encrypt', 'decrypt']
  );
}

// ============ Encryption (AES-256-GCM) ============

/**
 * Encrypt plaintext string using AES-256-GCM.
 *
 * Returns: { encryptedData (base64), iv (base64) }
 * - IV is random per operation (never reuse IV with same key)
 * - GCM provides both confidentiality and integrity (authenticated encryption)
 */
export async function encrypt(plaintext: string, key: CryptoKey): Promise<{ data: string; iv: string }> {
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  const encrypted = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    encoder.encode(plaintext)
  );

  return {
    data: arrayBufferToBase64(encrypted),
    iv: arrayBufferToBase64(iv.buffer),
  };
}

/**
 * Decrypt ciphertext using AES-256-GCM.
 *
 * Throws if decryption fails (wrong key, tampered data, corrupted IV).
 * This is by design - GCM authentication tag verification ensures data integrity.
 */
export async function decrypt(ciphertext: string, iv: string, key: CryptoKey): Promise<string> {
  const decrypted = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: new Uint8Array(base64ToArrayBuffer(iv)),
    },
    key,
    base64ToArrayBuffer(ciphertext)
  );

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

// ============ Batch Operations ============

/**
 * Encrypt a JSON-serializable object.
 * Serializes to JSON string, then encrypts.
 */
export async function encryptObject<T>(obj: T, key: CryptoKey): Promise<{ data: string; iv: string }> {
  return encrypt(JSON.stringify(obj), key);
}

/**
 * Decrypt and deserialize a JSON object.
 */
export async function decryptObject<T>(ciphertext: string, iv: string, key: CryptoKey): Promise<T> {
  const plaintext = await decrypt(ciphertext, iv, key);
  return JSON.parse(plaintext) as T;
}

// ============ Password Verification ============

/**
 * Create a verification token to check if the entered password is correct.
 * Stores an encrypted known string. If decryption succeeds, password is correct.
 */
export async function createVerificationToken(key: CryptoKey): Promise<{ data: string; iv: string }> {
  return encrypt('__VERIFIED__', key);
}

/**
 * Verify the master password by attempting to decrypt the verification token.
 * Returns true if decryption succeeds (correct password).
 * Returns false if decryption fails (wrong password).
 */
export async function verifyPassword(key: CryptoKey, token: { data: string; iv: string }): Promise<boolean> {
  try {
    const result = await decrypt(token.data, token.iv, key);
    return result === '__VERIFIED__';
  } catch {
    return false;
  }
}

// ============ Encoding Helpers ============

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// ============ Security Demo Helpers ============

/**
 * Demo encryption: encrypt a sample string and return both plaintext and ciphertext.
 * Used in the Trust Enhancement module to visually demonstrate encryption.
 */
export async function demoEncrypt(plaintext: string, key: CryptoKey): Promise<{
  original: string;
  encrypted: string;
  iv: string;
}> {
  const result = await encrypt(plaintext, key);
  return {
    original: plaintext,
    encrypted: result.data,
    iv: result.iv,
  };
}

/**
 * Demo decrypt: decrypt a ciphertext and return both forms.
 */
export async function demoDecrypt(ciphertext: string, iv: string, key: CryptoKey): Promise<{
  encrypted: string;
  decrypted: string;
}> {
  const plaintext = await decrypt(ciphertext, iv, key);
  return {
    encrypted: ciphertext,
    decrypted: plaintext,
  };
}

// ============ Constants Export ============

export const CRYPTO_CONFIG = {
  algorithm: 'AES-256-GCM',
  keyDerivation: 'PBKDF2-SHA256',
  iterations: PBKDF2_ITERATIONS,
  keyLength: AES_KEY_LENGTH,
  ivLength: IV_LENGTH,
  saltLength: SALT_LENGTH,
} as const;
