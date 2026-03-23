import { describe, it, expect } from 'vitest';
import { encrypt, decrypt, deriveKey } from './crypto';

describe('crypto utilities', () => {
  it('encrypt/decrypt roundtrip returns original plaintext', async () => {
    const plaintext = 'AIzaTestApiKey12345';
    const password = 'mySecretPassword';
    const salt = 'testuser';

    const ciphertext = await encrypt(plaintext, password, salt);
    expect(ciphertext).not.toBe(plaintext);
    expect(typeof ciphertext).toBe('string');
    expect(ciphertext.length).toBeGreaterThan(0);

    const decrypted = await decrypt(ciphertext, password, salt);
    expect(decrypted).toBe(plaintext);
  });

  it('two encryptions of same plaintext produce different ciphertexts (random IV)', async () => {
    const plaintext = 'AIzaSameKey';
    const password = 'password';
    const salt = 'user';

    const ct1 = await encrypt(plaintext, password, salt);
    const ct2 = await encrypt(plaintext, password, salt);
    expect(ct1).not.toBe(ct2);
  });

  it('decrypt with wrong password throws', async () => {
    const ciphertext = await encrypt('secret', 'correctPassword', 'user');
    await expect(decrypt(ciphertext, 'wrongPassword', 'user')).rejects.toThrow();
  });

  it('decrypt with wrong salt throws', async () => {
    const ciphertext = await encrypt('secret', 'password', 'correctSalt');
    await expect(decrypt(ciphertext, 'password', 'wrongSalt')).rejects.toThrow();
  });

  it('deriveKey returns a CryptoKey', async () => {
    const key = await deriveKey('password', 'salt');
    expect(key).toBeDefined();
    expect(key.type).toBe('secret');
  });

  it('encrypts empty string successfully', async () => {
    const ct = await encrypt('', 'pass', 'salt');
    const result = await decrypt(ct, 'pass', 'salt');
    expect(result).toBe('');
  });

  it('encrypts long strings', async () => {
    const longKey = 'A'.repeat(500);
    const ct = await encrypt(longKey, 'password', 'user');
    const result = await decrypt(ct, 'password', 'user');
    expect(result).toBe(longKey);
  });
});
