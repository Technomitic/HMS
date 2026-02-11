import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';

@Injectable()
export class BruteForceGuard implements CanActivate {
  private readonly logger = new Logger(BruteForceGuard.name);
  private readonly maxAttempts = 5;
  private readonly windowSeconds = 300; // 5 minutes
  private readonly blockDurationSeconds = 900; // 15 minutes

  constructor(private redis: RedisService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const ip =
      request.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      request.ip;
    const email = request.body?.email?.toLowerCase() || 'unknown';

    // Check if IP is blocked
    const ipBlockKey = `brute:block:ip:${ip}`;
    const isIpBlocked = await this.redis.get(ipBlockKey);
    if (isIpBlocked) {
      this.logger.warn(`Blocked IP attempted login: ${ip}`);
      throw new HttpException(
        'Too many failed attempts. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Check if email is blocked
    const emailBlockKey = `brute:block:email:${email}`;
    const isEmailBlocked = await this.redis.get(emailBlockKey);
    if (isEmailBlocked) {
      throw new HttpException(
        'Account temporarily locked. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }

  /**
   * Called by auth service on failed login
   */
  async recordFailedAttempt(ip: string, email: string): Promise<void> {
    const ipKey = `brute:attempts:ip:${ip}`;
    const emailKey = `brute:attempts:email:${email}`;

    const [ipAttempts, emailAttempts] = await Promise.all([
      this.redis.increment(ipKey),
      this.redis.increment(emailKey),
    ]);

    // Set expiry on first attempt
    if (ipAttempts === 1) {
      await this.redis.set(ipKey, String(ipAttempts), this.windowSeconds);
    }
    if (emailAttempts === 1) {
      await this.redis.set(emailKey, String(emailAttempts), this.windowSeconds);
    }

    // Block IP after max attempts
    if (ipAttempts >= this.maxAttempts) {
      await this.redis.set(
        `brute:block:ip:${ip}`,
        'true',
        this.blockDurationSeconds,
      );
      this.logger.warn(`IP blocked for brute force: ${ip}`);
    }

    // Block email after max attempts
    if (emailAttempts >= this.maxAttempts) {
      await this.redis.set(
        `brute:block:email:${email}`,
        'true',
        this.blockDurationSeconds,
      );
      this.logger.warn(`Email blocked for brute force: ${email}`);
    }
  }

  /**
   * Called by auth service on successful login
   */
  async clearAttempts(ip: string, email: string): Promise<void> {
    await Promise.all([
      this.redis.del(`brute:attempts:ip:${ip}`),
      this.redis.del(`brute:attempts:email:${email}`),
      this.redis.del(`brute:block:ip:${ip}`),
      this.redis.del(`brute:block:email:${email}`),
    ]);
  }
}