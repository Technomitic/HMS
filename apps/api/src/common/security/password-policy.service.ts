import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

interface PasswordValidation {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'fair' | 'strong' | 'very_strong';
}

@Injectable()
export class PasswordPolicyService {
  private readonly minLength = 8;
  private readonly maxLength = 128;

  // Top 100 most common passwords
  private readonly commonPasswords = new Set([
    'password', '123456', '12345678', 'qwerty', 'abc123',
    'monkey', 'master', 'dragon', 'login', 'princess',
    'letmein', 'welcome', 'shadow', 'sunshine', 'trustno1',
    'password1', 'iloveyou', 'batman', 'access', 'hello',
    'charlie', 'donald', '123456789', 'password123',
  ]);

  validate(password: string, email?: string): PasswordValidation {
    const errors: string[] = [];
    let score = 0;

    // Length checks
    if (password.length < this.minLength) {
      errors.push(`Password must be at least ${this.minLength} characters`);
    }
    if (password.length > this.maxLength) {
      errors.push(`Password must be at most ${this.maxLength} characters`);
    }
    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 1;

    // Character variety
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain a lowercase letter');
    } else {
      score += 1;
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain an uppercase letter');
    } else {
      score += 1;
    }

    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain a number');
    } else {
      score += 1;
    }

    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      score += 1;
    }

    // Common password check
    if (this.commonPasswords.has(password.toLowerCase())) {
      errors.push('This is a commonly used password');
    }

    // Email similarity check
    if (email) {
      const emailLocal = email.split('@')[0].toLowerCase();
      if (
        password.toLowerCase().includes(emailLocal) ||
        emailLocal.includes(password.toLowerCase())
      ) {
        errors.push('Password should not be similar to your email');
      }
    }

    // Sequential characters check
    if (/(.)\1{2,}/.test(password)) {
      errors.push('Password should not contain repeated characters');
    }

    // Determine strength
    let strength: PasswordValidation['strength'];
    if (score <= 2) strength = 'weak';
    else if (score <= 3) strength = 'fair';
    else if (score <= 5) strength = 'strong';
    else strength = 'very_strong';

    return {
      isValid: errors.length === 0,
      errors,
      strength,
    };
  }

  /**
   * Check if password has been breached (via k-Anonymity with HIBP API)
   * This method hashes the password and checks only the prefix
   */
  async isBreached(password: string): Promise<boolean> {
    try {
      const sha1 = crypto
        .createHash('sha1')
        .update(password)
        .digest('hex')
        .toUpperCase();

      const prefix = sha1.slice(0, 5);
      const suffix = sha1.slice(5);

      const response = await fetch(
        `https://api.pwnedpasswords.com/range/${prefix}`,
      );
      const text = await response.text();

      return text.split('\n').some((line) => {
        const [hash] = line.split(':');
        return hash.trim() === suffix;
      });
    } catch {
      // If API is unreachable, don't block the user
      return false;
    }
  }
}