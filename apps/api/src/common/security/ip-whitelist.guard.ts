import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Guard to restrict admin API access to whitelisted IPs
 * Usage: @UseGuards(IpWhitelistGuard) on sensitive admin routes
 */
@Injectable()
export class IpWhitelistGuard implements CanActivate {
  private readonly allowedIps: string[];

  constructor(private config: ConfigService) {
    const ips = this.config.get<string>('ADMIN_WHITELIST_IPS') || '';
    this.allowedIps = ips
      .split(',')
      .map((ip) => ip.trim())
      .filter(Boolean);
  }

  canActivate(context: ExecutionContext): boolean {
    // If no whitelist configured, allow all (dev mode)
    if (this.allowedIps.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const clientIp =
      request.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      request.ip ||
      request.connection?.remoteAddress;

    if (!this.allowedIps.includes(clientIp)) {
      throw new ForbiddenException('Access denied from this IP');
    }

    return true;
  }
}