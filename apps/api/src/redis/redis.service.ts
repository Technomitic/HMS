import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis | null = null;
  private readonly logger = new Logger(RedisService.name);
  private isConnected = false;

  constructor(private config: ConfigService) {}

  async onModuleInit() {
    const redisUrl = this.config.get<string>('REDIS_URL', 'redis://localhost:6379');

    try {
      this.client = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy(times) {
          if (times > 3) return null;
          return Math.min(times * 100, 3000);
        },
        lazyConnect: true,
        connectTimeout: 5000,
      });

      await this.client.connect();
      this.isConnected = true;
      this.logger.log('✅ Redis connected');
    } catch (error) {
      this.isConnected = false;
      this.logger.warn('⚠️ Redis connection failed — running without cache');
    }
  }

  async onModuleDestroy() {
    if (this.client && this.isConnected) {
      await this.client.quit();
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.isConnected || !this.client) return null;
    try {
      return await this.client.get(key);
    } catch {
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (!this.isConnected || !this.client) return;
    try {
      if (ttlSeconds) {
        await this.client.set(key, value, 'EX', ttlSeconds);
      } else {
        await this.client.set(key, value);
      }
    } catch {}
  }

  async del(key: string): Promise<void> {
    if (!this.isConnected || !this.client) return;
    try {
      await this.client.del(key);
    } catch {}
  }

  async incr(key: string): Promise<number> {
    if (!this.isConnected || !this.client) return 0;
    try {
      return await this.client.incr(key);
    } catch {
      return 0;
    }
  }

  // Alias for incr
  async increment(key: string): Promise<number> {
    return this.incr(key);
  }

  async expire(key: string, ttlSeconds: number): Promise<void> {
    if (!this.isConnected || !this.client) return;
    try {
      await this.client.expire(key, ttlSeconds);
    } catch {}
  }

  async getJson<T>(key: string): Promise<T | null> {
    const data = await this.get(key);
    if (!data) return null;
    try {
      return JSON.parse(data) as T;
    } catch {
      return null;
    }
  }

  async setJson<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const data = JSON.stringify(value);
    await this.set(key, data, ttlSeconds);
  }

  getClient(): Redis | null {
    return this.isConnected ? this.client : null;
  }
}