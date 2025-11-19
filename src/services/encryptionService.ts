/**
 * Encryption Service
 *
 * Provides AES-GCM encryption/decryption for sensitive QA report drafts stored locally.
 * Uses the Web Crypto API for battle-tested cryptographic primitives.
 *
 * Security Features:
 * - AES-GCM (256-bit) encryption with authenticated encryption
 * - PBKDF2 key derivation from the master key
 * - Random IV generation for each encryption operation
 * - Integrity checking built into GCM mode
 *
 * @module encryptionService
 */

/**
 * Encrypted data structure returned by encrypt() and expected by decrypt()
 */
export interface EncryptedData {
  /** Base64-encoded ciphertext */
  ciphertext: string;
  /** Base64-encoded initialization vector */
  iv: string;
  /** Base64-encoded salt used for key derivation */
  salt: string;
  /** Version identifier for future compatibility */
  version: number;
}

/**
 * Configuration for encryption operations
 */
interface EncryptionConfig {
  /** Algorithm identifier */
  algorithm: 'AES-GCM';
  /** Key length in bits */
  keyLength: 256;
  /** IV length in bytes */
  ivLength: 12;
  /** Salt length in bytes for PBKDF2 */
  saltLength: 16;
  /** PBKDF2 iterations */
  pbkdf2Iterations: 100000;
  /** Current encryption version */
  version: 1;
}

/** Default encryption configuration */
const ENCRYPTION_CONFIG: EncryptionConfig = {
  algorithm: 'AES-GCM',
  keyLength: 256,
  ivLength: 12, // 96 bits recommended for GCM
  saltLength: 16, // 128 bits
  pbkdf2Iterations: 100000, // OWASP recommendation
  version: 1,
};

/**
 * Gets the encryption key from environment variables
 * @throws {Error} If the encryption key is not configured or is too weak
 */
function getEncryptionKey(): string {
  const key = import.meta.env.VITE_APP_ENCRYPTION_KEY;

  if (!key) {
    throw new Error(
      'VITE_APP_ENCRYPTION_KEY is not configured. Please set this environment variable.'
    );
  }

  if (key.length < 32) {
    throw new Error(
      'VITE_APP_ENCRYPTION_KEY must be at least 32 characters for adequate security.'
    );
  }

  return key;
}

/**
 * Derives a cryptographic key from the master key using PBKDF2
 *
 * @param masterKey - The master encryption key from environment
 * @param salt - Random salt for key derivation
 * @returns Promise resolving to a CryptoKey for AES-GCM
 */
async function deriveKey(masterKey: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(masterKey),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as any, // TypeScript strictness issue with BufferSource
      iterations: ENCRYPTION_CONFIG.pbkdf2Iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    {
      name: ENCRYPTION_CONFIG.algorithm,
      length: ENCRYPTION_CONFIG.keyLength,
    },
    false, // not extractable
    ['encrypt', 'decrypt']
  );
}

/**
 * Converts an ArrayBuffer to a Base64 string
 * @param buffer - The buffer to encode
 * @returns Base64-encoded string
 */
function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Converts a Base64 string to an ArrayBuffer
 * @param base64 - Base64-encoded string
 * @returns ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Encrypts data using AES-GCM
 *
 * @param data - The data to encrypt (will be JSON-stringified)
 * @returns Promise resolving to encrypted data structure
 * @throws {Error} If encryption fails or key is not configured
 *
 * @example
 * ```typescript
 * const qaPack = { /* QA pack data *\/ };
 * const encrypted = await encrypt(qaPack);
 * localStorage.setItem('draft', JSON.stringify(encrypted));
 * ```
 */
export async function encrypt(data: unknown): Promise<EncryptedData> {
  try {
    // Validate and get encryption key
    const masterKey = getEncryptionKey();

    // Generate random salt and IV
    const salt = crypto.getRandomValues(new Uint8Array(ENCRYPTION_CONFIG.saltLength));
    const iv = crypto.getRandomValues(new Uint8Array(ENCRYPTION_CONFIG.ivLength));

    // Derive encryption key from master key
    const key = await deriveKey(masterKey, salt);

    // Convert data to JSON and then to ArrayBuffer
    const encoder = new TextEncoder();
    const plaintext = encoder.encode(JSON.stringify(data));

    // Encrypt the data
    const ciphertext = await crypto.subtle.encrypt(
      {
        name: ENCRYPTION_CONFIG.algorithm,
        iv,
      },
      key,
      plaintext
    );

    // Return encrypted data with metadata
    return {
      ciphertext: arrayBufferToBase64(ciphertext),
      iv: arrayBufferToBase64(iv),
      salt: arrayBufferToBase64(salt),
      version: ENCRYPTION_CONFIG.version,
    };
  } catch (error) {
    // Ensure sensitive data doesn't leak in error messages
    const safeError = new Error('Encryption failed. Please check your configuration.');
    console.error('Encryption error:', error);
    throw safeError;
  }
}

/**
 * Decrypts data that was encrypted with encrypt()
 *
 * @param encryptedData - The encrypted data structure
 * @returns Promise resolving to the original decrypted data
 * @throws {Error} If decryption fails, data is corrupted, or wrong key is used
 *
 * @example
 * ```typescript
 * const encryptedStr = localStorage.getItem('draft');
 * if (encryptedStr) {
 *   const encrypted = JSON.parse(encryptedStr);
 *   const qaPack = await decrypt(encrypted);
 * }
 * ```
 */
export async function decrypt<T = unknown>(encryptedData: EncryptedData): Promise<T> {
  try {
    // Validate encrypted data structure
    if (!encryptedData.ciphertext || !encryptedData.iv || !encryptedData.salt) {
      throw new Error('Invalid encrypted data structure');
    }

    // Check version compatibility
    if (encryptedData.version !== ENCRYPTION_CONFIG.version) {
      throw new Error(
        `Unsupported encryption version: ${encryptedData.version}. Expected: ${ENCRYPTION_CONFIG.version}`
      );
    }

    // Get encryption key
    const masterKey = getEncryptionKey();

    // Convert Base64 strings back to ArrayBuffers
    const ciphertext = base64ToArrayBuffer(encryptedData.ciphertext);
    const iv = new Uint8Array(base64ToArrayBuffer(encryptedData.iv));
    const salt = new Uint8Array(base64ToArrayBuffer(encryptedData.salt));

    // Derive the same key using the stored salt
    const key = await deriveKey(masterKey, salt);

    // Decrypt the data
    const decrypted = await crypto.subtle.decrypt(
      {
        name: ENCRYPTION_CONFIG.algorithm,
        iv: iv as any, // TypeScript strictness issue with BufferSource
      },
      key,
      ciphertext as any // TypeScript strictness issue with BufferSource
    );

    // Convert ArrayBuffer back to string and parse JSON
    const decoder = new TextDecoder();
    const plaintext = decoder.decode(decrypted);

    return JSON.parse(plaintext) as T;
  } catch (error) {
    // Provide helpful error messages without leaking sensitive info
    if (error instanceof Error && error.message.includes('version')) {
      throw error; // Re-throw version errors as-is
    }

    const safeError = new Error(
      'Decryption failed. The data may be corrupted or encrypted with a different key.'
    );
    console.error('Decryption error:', error);
    throw safeError;
  }
}

/**
 * Checks if the encryption key is properly configured
 *
 * @returns true if the encryption key is configured and valid
 *
 * @example
 * ```typescript
 * if (isEncryptionAvailable()) {
 *   // Safe to use encryption
 *   await encrypt(data);
 * }
 * ```
 */
export function isEncryptionAvailable(): boolean {
  try {
    getEncryptionKey();
    return true;
  } catch {
    return false;
  }
}

/**
 * Tests the encryption/decryption round-trip
 * This is useful for verifying the encryption setup during development
 *
 * @returns Promise resolving to true if the test passes
 * @throws {Error} If the round-trip test fails
 *
 * @example
 * ```typescript
 * // In development console
 * await testEncryption();
 * console.log('Encryption is working correctly!');
 * ```
 */
export async function testEncryption(): Promise<boolean> {
  const testData = {
    message: 'Test encryption data',
    timestamp: Date.now(),
    nested: {
      array: [1, 2, 3],
      object: { key: 'value' },
    },
  };

  try {
    const encrypted = await encrypt(testData);
    const decrypted = await decrypt(encrypted);

    // Verify the data matches
    const originalJson = JSON.stringify(testData);
    const decryptedJson = JSON.stringify(decrypted);

    if (originalJson !== decryptedJson) {
      throw new Error('Decrypted data does not match original data');
    }

    // Verify that different encryptions of the same data produce different ciphertexts
    // (due to random IV)
    const encrypted2 = await encrypt(testData);
    if (encrypted.ciphertext === encrypted2.ciphertext) {
      throw new Error('Encryption is not using unique IVs');
    }

    console.log('Encryption test passed successfully!');
    return true;
  } catch (error) {
    console.error('Encryption test failed:', error);
    throw error;
  }
}

/**
 * Securely clears sensitive data from memory
 * Note: This is a best-effort approach as JavaScript doesn't provide
 * guaranteed memory clearing, but it helps reduce the attack surface
 *
 * @param obj - Object to clear (will be mutated)
 */
export function secureClear(obj: Record<string, unknown>): void {
  if (!obj || typeof obj !== 'object') return;

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      // Overwrite with random data first
      if (typeof obj[key] === 'string') {
        obj[key] = crypto.getRandomValues(new Uint8Array(32)).toString();
      }
      // Then delete
      delete obj[key];
    }
  }
}
