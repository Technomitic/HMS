import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';

/**
 * CSRF protection for cookie-based sessions
 * Uses double-submit cookie pattern
 */
@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  private readonly cookieName = 'medix_csrf';
  private readonly headerName = 'x-csrf-token';

  use(req: Request, res: Response, next: NextFunction) {
    // Only protect state-changing methods
    const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
    if (safeMethods.includes(req.method)) {
      // Set CSRF token cookie on GET requests
      if (!req.cookies?.[this.cookieName]) {
        const token = crypto.randomBytes(32).toString('hex');
        res.cookie(this.cookieName, token, {
          httpOnly: false, // Must be readable by JS
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 3600000, // 1 hour
          path: '/',
        });
      }
      return next();
    }

    // For API-only (Bearer token auth), CSRF is less relevant
    // But we validate for cookie-based auth
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      // JWT bearer auth — CSRF not needed (token in header is sufficient)
      return next();
    }

    // Cookie-based auth — validate CSRF token
    const cookieToken = req.cookies?.[this.cookieName];
    const headerToken = req.headers[this.headerName] as string;

    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
      throw new ForbiddenException('Invalid CSRF token');
    }

    next();
  }
}