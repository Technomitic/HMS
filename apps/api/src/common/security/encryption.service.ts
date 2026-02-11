import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly logger = new Logger(EncryptionService.name);
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32;
  private readonly ivLength = 16;
  private readonly tagLength = 16;
  private readonly saltLength = 64;
  private readonly pbkdf2Iterations = 100000;
  private masterKey: Buffer;

  constructor(private config: ConfigService) {
    const key = this.config.get<string>('ENCRYPTION_MASTER_KEY');
    if (!key || key.length < 32) {
      this.logger.warn(
        'ENCRYPTION_MASTER_KEY not set or too short. Using derived key from JWT_SECRET.',
      );
      const fallback = this.config.get<string>('JWT_SECRET') || 'default-dev-key';
      this.masterKey = crypto
        .createHash('sha256')
        .update(fallback)
        .digest();
    } else {
      this.masterKey = Buffer.from(key, 'hex');
    }
  }

  /**
   * Encrypt sensitive data (PII, medical records)
   * Format: salt:iv:tag:ciphertext (all hex-encoded)
   */
  encrypt(plaintext: string): string {
    const salt = crypto.randomBytes(this.saltLength);
    const derivedKey = crypto.pbkdf2Sync(
      this.masterKey,
      salt,
      this.pbkdf2Iterations,
      this.keyLength,
      'sha512',
    );

    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipheriv(this.algorithm, derivedKey, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const tag = cipher.getAuthTag();

    return [
      salt.toString('hex'),
      iv.toString('hex'),
      tag.toString('hex'),
      encrypted,
    ].join(':');
  }

  /**
   * Decrypt sensitive data
   */
  decrypt(encryptedData: string): string {
    const parts = encryptedData.split(':');
    if (parts.length !== 4) {
      throw new Error('Invalid encrypted data format');
    }

    const [saltHex, ivHex, tagHex, ciphertext] = parts;
    const salt = Buffer.from(saltHex, 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');

    const derivedKey = crypto.pbkdf2Sync(
      this.masterKey,
      salt,
      this.pbkdf2Iterations,
      this.keyLength,
      'sha512',
    );

    const decipher = crypto.createDecipheriv(this.algorithm, derivedKey, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  /**
   * Hash data for indexing (deterministic, non-reversible)
   * Used for searching encrypted fields
   */
  hashForIndex(value: string): string {
    const pepper = this.config.get<string>('HASH_PEPPER') || 'medix-pepper';
    return crypto
      .createHmac('sha256', pepper)
      .update(value.toLowerCase().trim())
      .digest('hex');
  }

  /**
   * Generate cryptographically secure random token
   */
  generateSecureToken(length = 48): string {
    return crypto.randomBytes(length).toString('base64url');
  }

  /**
   * Constant-time string comparison to prevent timing attacks
   */
  secureCompare(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  }
}