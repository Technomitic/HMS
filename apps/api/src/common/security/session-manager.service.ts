import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';

interface SessionInfo {
  userId: string;
  ip: string;
  userAgent: string;
  createdAt: string;
  lastActiveAt: string;
}

@Injectable()
export class SessionManagerService {
  private readonly logger = new Logger(SessionManagerService.name);
  private readonly maxSessionsPerUser = 5;
  private readonly sessionTtl = 86400; // 24 hours

  constructor(private redis: RedisService) {}

  async createSession(
    userId: string,
    sessionId: string,
    ip: string,
    userAgent: string,
  ): Promise<void> {
    const sessionKey = `session:${sessionId}`;
    const userSessionsKey = `user_sessions:${userId}`;

    const session: SessionInfo = {
      userId,
      ip,
      userAgent,
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
    };

    await this.redis.setJson(sessionKey, session, this.sessionTtl);

    // Track sessions per user
    const existingSessions = await this.getUserSessions(userId);
    existingSessions.push(sessionId);

    // Enforce max sessions — remove oldest
    if (existingSessions.length > this.maxSessionsPerUser) {
      const toRemove = existingSessions.slice(
        0,
        existingSessions.length - this.maxSessionsPerUser,
      );
      for (const oldSession of toRemove) {
        await this.redis.del(`session:${oldSession}`);
      }
      existingSessions.splice(
        0,
        existingSessions.length - this.maxSessionsPerUser,
      );
    }

    await this.redis.setJson(userSessionsKey, existingSessions, this.sessionTtl);
  }

  async getSession(sessionId: string): Promise<SessionInfo | null> {
    return this.redis.getJson(`session:${sessionId}`);
  }

  async getUserSessions(userId: string): Promise<string[]> {
    return (await this.redis.getJson(`user_sessions:${userId}`)) || [];
  }

  async invalidateSession(sessionId: string): Promise<void> {
    const session = await this.getSession(sessionId);
    if (session) {
      await this.redis.del(`session:${sessionId}`);
      const sessions = await this.getUserSessions(session.userId);
      const updated = sessions.filter((s) => s !== sessionId);
      await this.redis.setJson(
        `user_sessions:${session.userId}`,
        updated,
        this.sessionTtl,
      );
    }
  }

  async invalidateAllUserSessions(userId: string): Promise<void> {
    const sessions = await this.getUserSessions(userId);
    for (const sessionId of sessions) {
      await this.redis.del(`session:${sessionId}`);
    }
    await this.redis.del(`user_sessions:${userId}`);
    this.logger.log(`All sessions invalidated for user: ${userId}`);
  }

  async touchSession(sessionId: string): Promise<void> {
    const session = await this.getSession(sessionId);
    if (session) {
      session.lastActiveAt = new Date().toISOString();
      await this.redis.setJson(`session:${sessionId}`, session, this.sessionTtl);
    }
  }
}