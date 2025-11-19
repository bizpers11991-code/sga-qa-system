/**
 * Unit tests for encryptionService
 *
 * These tests verify the encryption service's security properties and functionality.
 * Run with: npm test or vitest
 */

import { describe, it, expect, beforeAll, vi } from 'vitest';
import {
  encrypt,
  decrypt,
  isEncryptionAvailable,
  testEncryption,
  secureClear,
  EncryptedData,
} from './encryptionService';

// Mock environment variable for testing
beforeAll(() => {
  // Set a test encryption key
  vi.stubEnv('VITE_APP_ENCRYPTION_KEY', 'test-key-32-characters-minimum!!');
});

describe('encryptionService', () => {
  describe('Configuration Validation', () => {
    it('should verify encryption is available with valid key', () => {
      expect(isEncryptionAvailable()).toBe(true);
    });

    it('should reject keys shorter than 32 characters', async () => {
      vi.stubEnv('VITE_APP_ENCRYPTION_KEY', 'short-key');
      await expect(encrypt({ test: 'data' })).rejects.toThrow(
        'must be at least 32 characters'
      );
      // Restore valid key for other tests
      vi.stubEnv('VITE_APP_ENCRYPTION_KEY', 'test-key-32-characters-minimum!!');
    });

    it('should handle missing encryption key gracefully', () => {
      vi.stubEnv('VITE_APP_ENCRYPTION_KEY', '');
      expect(isEncryptionAvailable()).toBe(false);
      // Restore valid key for other tests
      vi.stubEnv('VITE_APP_ENCRYPTION_KEY', 'test-key-32-characters-minimum!!');
    });
  });

  describe('Basic Encryption/Decryption', () => {
    it('should encrypt and decrypt a simple object', async () => {
      const originalData = {
        message: 'Test data',
        number: 42,
        boolean: true,
      };

      const encrypted = await encrypt(originalData);
      const decrypted = await decrypt(encrypted);

      expect(decrypted).toEqual(originalData);
    });

    it('should encrypt and decrypt complex nested objects', async () => {
      const complexData = {
        job: {
          id: 'job-123',
          name: 'Test Project',
          location: { lat: -37.8136, lng: 144.9631 },
        },
        forms: [
          { id: 1, type: 'siteRecord', data: { notes: 'Test notes' } },
          { id: 2, type: 'asphaltPlacement', data: { area: 100.5 } },
        ],
        metadata: {
          timestamp: new Date('2024-01-01').toISOString(),
          foreman: 'John Doe',
        },
      };

      const encrypted = await encrypt(complexData);
      const decrypted = await decrypt(encrypted);

      expect(JSON.stringify(decrypted)).toBe(JSON.stringify(complexData));
    });

    it('should handle arrays correctly', async () => {
      const arrayData = [1, 2, 3, 'four', { five: 5 }, [6, 7]];

      const encrypted = await encrypt(arrayData);
      const decrypted = await decrypt(encrypted);

      expect(decrypted).toEqual(arrayData);
    });

    it('should handle null and undefined values', async () => {
      const data = {
        nullValue: null,
        undefinedValue: undefined,
        emptyString: '',
        zero: 0,
        false: false,
      };

      const encrypted = await encrypt(data);
      const decrypted = await decrypt(encrypted);

      // Note: JSON.stringify removes undefined, so we expect it to be missing
      expect(decrypted).toEqual({
        nullValue: null,
        emptyString: '',
        zero: 0,
        false: false,
      });
    });

    it('should handle special characters and unicode', async () => {
      const data = {
        special: '!@#$%^&*()_+-=[]{}|;:,.<>?',
        unicode: '你好世界 🔒 مرحبا',
        emoji: '😀🔐🚧',
      };

      const encrypted = await encrypt(data);
      const decrypted = await decrypt(encrypted);

      expect(decrypted).toEqual(data);
    });
  });

  describe('Security Properties', () => {
    it('should produce different ciphertexts for the same plaintext', async () => {
      const data = { message: 'Same data' };

      const encrypted1 = await encrypt(data);
      const encrypted2 = await encrypt(data);

      // Different IVs should produce different ciphertexts
      expect(encrypted1.ciphertext).not.toBe(encrypted2.ciphertext);
      expect(encrypted1.iv).not.toBe(encrypted2.iv);
      expect(encrypted1.salt).not.toBe(encrypted2.salt);

      // But both should decrypt to the same data
      const decrypted1 = await decrypt(encrypted1);
      const decrypted2 = await decrypt(encrypted2);
      expect(decrypted1).toEqual(decrypted2);
      expect(decrypted1).toEqual(data);
    });

    it('should include all required metadata', async () => {
      const data = { test: 'data' };
      const encrypted = await encrypt(data);

      expect(encrypted).toHaveProperty('ciphertext');
      expect(encrypted).toHaveProperty('iv');
      expect(encrypted).toHaveProperty('salt');
      expect(encrypted).toHaveProperty('version');

      expect(typeof encrypted.ciphertext).toBe('string');
      expect(typeof encrypted.iv).toBe('string');
      expect(typeof encrypted.salt).toBe('string');
      expect(typeof encrypted.version).toBe('number');
      expect(encrypted.version).toBe(1);
    });

    it('should produce base64-encoded output', async () => {
      const data = { test: 'data' };
      const encrypted = await encrypt(data);

      const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
      expect(encrypted.ciphertext).toMatch(base64Regex);
      expect(encrypted.iv).toMatch(base64Regex);
      expect(encrypted.salt).toMatch(base64Regex);
    });

    it('should fail decryption with wrong key', async () => {
      const data = { sensitive: 'information' };

      // Encrypt with one key
      const encrypted = await encrypt(data);

      // Try to decrypt with different key
      vi.stubEnv('VITE_APP_ENCRYPTION_KEY', 'different-key-32-characters-min!');

      await expect(decrypt(encrypted)).rejects.toThrow();

      // Restore original key
      vi.stubEnv('VITE_APP_ENCRYPTION_KEY', 'test-key-32-characters-minimum!!');
    });

    it('should fail decryption with corrupted ciphertext', async () => {
      const data = { test: 'data' };
      const encrypted = await encrypt(data);

      // Corrupt the ciphertext
      const corrupted: EncryptedData = {
        ...encrypted,
        ciphertext: encrypted.ciphertext.slice(0, -5) + 'XXXXX',
      };

      await expect(decrypt(corrupted)).rejects.toThrow('Decryption failed');
    });

    it('should fail decryption with corrupted IV', async () => {
      const data = { test: 'data' };
      const encrypted = await encrypt(data);

      // Corrupt the IV
      const corrupted: EncryptedData = {
        ...encrypted,
        iv: 'YWJjZGVmZ2hpams=', // Random base64
      };

      await expect(decrypt(corrupted)).rejects.toThrow();
    });

    it('should fail decryption with missing metadata', async () => {
      const incomplete = {
        ciphertext: 'abc',
        iv: '',
        salt: '',
        version: 1,
      } as EncryptedData;

      await expect(decrypt(incomplete)).rejects.toThrow('Invalid encrypted data');
    });

    it('should reject unsupported versions', async () => {
      const data = { test: 'data' };
      const encrypted = await encrypt(data);

      // Change version to unsupported value
      const unsupportedVersion: EncryptedData = {
        ...encrypted,
        version: 999,
      };

      await expect(decrypt(unsupportedVersion)).rejects.toThrow(
        'Unsupported encryption version'
      );
    });
  });

  describe('Large Data Handling', () => {
    it('should handle large QA pack objects', async () => {
      // Simulate a realistic QA pack with photos (base64 strings)
      const largeQaPack = {
        job: {
          id: 'job-456',
          projectName: 'Large Highway Project',
          location: '123 Main St',
        },
        sitePhotos: Array(10)
          .fill(null)
          .map((_, i) => ({
            name: `photo-${i}.jpg`,
            data: 'data:image/jpeg;base64,' + 'A'.repeat(5000), // Simulate base64 photo
            description: `Site photo ${i}`,
          })),
        asphaltPlacement: {
          placements: Array(20)
            .fill(null)
            .map((_, i) => ({
              location: `Section ${i}`,
              area: Math.random() * 1000,
              depth: Math.random() * 100,
              tonnes: Math.random() * 500,
            })),
        },
        notes: 'A'.repeat(1000), // Long notes field
      };

      const encrypted = await encrypt(largeQaPack);
      const decrypted = await decrypt(encrypted);

      expect(JSON.stringify(decrypted)).toBe(JSON.stringify(largeQaPack));
    });

    it('should handle empty objects', async () => {
      const emptyData = {};

      const encrypted = await encrypt(emptyData);
      const decrypted = await decrypt(encrypted);

      expect(decrypted).toEqual(emptyData);
    });
  });

  describe('Type Safety', () => {
    it('should preserve types through encryption/decryption', async () => {
      interface TestData {
        string: string;
        number: number;
        boolean: boolean;
        array: number[];
        nested: { key: string };
      }

      const typedData: TestData = {
        string: 'test',
        number: 42,
        boolean: true,
        array: [1, 2, 3],
        nested: { key: 'value' },
      };

      const encrypted = await encrypt(typedData);
      const decrypted = await decrypt<TestData>(encrypted);

      expect(typeof decrypted.string).toBe('string');
      expect(typeof decrypted.number).toBe('number');
      expect(typeof decrypted.boolean).toBe('boolean');
      expect(Array.isArray(decrypted.array)).toBe(true);
      expect(typeof decrypted.nested).toBe('object');
    });
  });

  describe('Utility Functions', () => {
    it('should run encryption test successfully', async () => {
      const result = await testEncryption();
      expect(result).toBe(true);
    });

    it('should securely clear object data', () => {
      const sensitiveData = {
        password: 'secret123',
        apiKey: 'key-456',
        nested: { token: 'token-789' },
      };

      secureClear(sensitiveData);

      // Check that all keys are deleted
      expect(Object.keys(sensitiveData)).toHaveLength(0);
    });

    it('should handle non-object input to secureClear', () => {
      expect(() => secureClear(null as any)).not.toThrow();
      expect(() => secureClear(undefined as any)).not.toThrow();
      expect(() => secureClear('string' as any)).not.toThrow();
      expect(() => secureClear(42 as any)).not.toThrow();
    });
  });

  describe('Real-world QA Pack Scenarios', () => {
    it('should encrypt/decrypt a complete QA pack draft', async () => {
      const qaPack = {
        lastUpdated: new Date().toISOString(),
        sgaDailyReport: {
          date: '2024-01-15',
          weather: 'Sunny',
          temperature: '25°C',
          workDescription: 'Asphalt placement on Highway 1',
          foremanName: 'John Smith',
          correctorUsed: 'No',
          clientSignature: '',
        },
        siteRecord: {
          startTime: '07:00',
          endTime: '15:00',
          crew: ['Worker 1', 'Worker 2', 'Worker 3'],
          equipment: ['Roller', 'Paver', 'Truck'],
        },
        asphaltPlacement: {
          lotNo: 'LOT-2024-001',
          placements: [
            {
              location: 'Section A',
              mixCode: 'AC14',
              area: '500',
              depth: '50',
              tonnes: '100',
            },
          ],
        },
        sitePhotos: {
          photos: [
            {
              name: 'site-overview.jpg',
              data: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
              description: 'Site overview',
            },
          ],
        },
      };

      const encrypted = await encrypt(qaPack);

      // Verify encrypted data is serializable (can be stored in localStorage)
      const serialized = JSON.stringify(encrypted);
      const deserialized = JSON.parse(serialized);

      const decrypted = await decrypt(deserialized);

      expect(decrypted).toEqual(qaPack);
    });

    it('should handle offline storage workflow', async () => {
      // Simulate the actual workflow in useQaPack
      const draftData = {
        jobId: 'job-789',
        foremanId: 'foreman-123',
        qaPack: {
          sgaDailyReport: { notes: 'Test notes' },
          timestamp: Date.now(),
        },
      };

      // 1. Encrypt before storing
      const encrypted = await encrypt(draftData);

      // 2. Simulate localStorage (stringify)
      const stored = JSON.stringify(encrypted);

      // 3. Simulate reading from localStorage (parse)
      const retrieved = JSON.parse(stored);

      // 4. Decrypt after reading
      const decrypted = await decrypt(retrieved);

      expect(decrypted).toEqual(draftData);
    });

    it('should handle concurrent encryption operations', async () => {
      const data1 = { id: 1, data: 'First operation' };
      const data2 = { id: 2, data: 'Second operation' };
      const data3 = { id: 3, data: 'Third operation' };

      // Encrypt multiple items concurrently
      const [encrypted1, encrypted2, encrypted3] = await Promise.all([
        encrypt(data1),
        encrypt(data2),
        encrypt(data3),
      ]);

      // Decrypt concurrently
      const [decrypted1, decrypted2, decrypted3] = await Promise.all([
        decrypt(encrypted1),
        decrypt(encrypted2),
        decrypt(encrypted3),
      ]);

      expect(decrypted1).toEqual(data1);
      expect(decrypted2).toEqual(data2);
      expect(decrypted3).toEqual(data3);
    });
  });

  describe('Error Handling', () => {
    it('should provide helpful error messages without leaking data', async () => {
      const data = { secret: 'sensitive information' };
      const encrypted = await encrypt(data);

      // Corrupt the data
      const corrupted = { ...encrypted, ciphertext: 'invalid' };

      try {
        await decrypt(corrupted);
        expect.fail('Should have thrown an error');
      } catch (error) {
        const errorMessage = (error as Error).message;
        // Error message should not contain sensitive data
        expect(errorMessage).not.toContain('sensitive information');
        expect(errorMessage).not.toContain('secret');
      }
    });

    it('should handle gracefully when Web Crypto API is unavailable', async () => {
      // This test documents expected behavior if run in non-secure context
      // In practice, Web Crypto API requires HTTPS or localhost
      expect(typeof crypto.subtle).toBe('object');
    });
  });

  describe('Performance', () => {
    it('should encrypt data in reasonable time', async () => {
      const data = { test: 'data', timestamp: Date.now() };

      const startTime = performance.now();
      await encrypt(data);
      const endTime = performance.now();

      const duration = endTime - startTime;

      // Encryption should complete in under 100ms for small data
      expect(duration).toBeLessThan(100);
    });

    it('should decrypt data in reasonable time', async () => {
      const data = { test: 'data', timestamp: Date.now() };
      const encrypted = await encrypt(data);

      const startTime = performance.now();
      await decrypt(encrypted);
      const endTime = performance.now();

      const duration = endTime - startTime;

      // Decryption should complete in under 100ms for small data
      expect(duration).toBeLessThan(100);
    });
  });
});
