import { Injectable } from '@nestjs/common';

@Injectable()
export class SanitizationService {
  /**
   * Strip HTML tags and dangerous characters from user input
   */
  sanitizeHtml(input: string): string {
    if (!input) return input;
    return input
      .replace(/<[^>]*>/g, '')                    // Remove HTML tags
      .replace(/javascript:/gi, '')               // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '')                 // Remove event handlers
      .replace(/&lt;script/gi, '')                // Remove encoded script tags
      .replace(/data:text\/html/gi, '')           // Remove data URIs
      .trim();
  }

  /**
   * Sanitize SQL-injectable strings (defense in depth; Prisma handles parameterization)
   */
  sanitizeSql(input: string): string {
    if (!input) return input;
    return input
      .replace(/['";\\]/g, '')                    // Remove SQL special chars
      .replace(/--/g, '')                         // Remove SQL comments
      .replace(/\/\*/g, '')                       // Remove block comment start
      .replace(/\*\//g, '')                       // Remove block comment end
      .replace(/\b(UNION|SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|EXEC)\b/gi, '')
      .trim();
  }

  /**
   * Sanitize object recursively (for request bodies)
   */
  sanitizeObject<T extends Record<string, any>>(obj: T): T {
    const sanitized = { ...obj };
    for (const key of Object.keys(sanitized)) {
      const value = sanitized[key];
      if (typeof value === 'string') {
        (sanitized as any)[key] = this.sanitizeHtml(value);
      } else if (value && typeof value === 'object' && !Array.isArray(value)) {
        (sanitized as any)[key] = this.sanitizeObject(value);
      } else if (Array.isArray(value)) {
        (sanitized as any)[key] = value.map((item) =>
          typeof item === 'string'
            ? this.sanitizeHtml(item)
            : typeof item === 'object'
              ? this.sanitizeObject(item)
              : item,
        );
      }
    }
    return sanitized;
  }

  /**
   * Sanitize email to prevent header injection
   */
  sanitizeEmail(email: string): string {
    return email
      .toLowerCase()
      .trim()
      .replace(/[\r\n]/g, '')        // Remove newlines (header injection)
      .replace(/[<>]/g, '')          // Remove angle brackets
      .slice(0, 255);                // Length limit
  }

  /**
   * Sanitize phone number
   */
  sanitizePhone(phone: string): string {
    return phone.replace(/[^0-9+\-() ]/g, '').slice(0, 20);
  }

  /**
   * Validate and sanitize UUID format
   */
  isValidUUID(id: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
  }
}