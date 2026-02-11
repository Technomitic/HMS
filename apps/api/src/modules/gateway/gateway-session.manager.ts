import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';

@Injectable()
export class GatewaySessionManager {
  private readonly sessions = new Map<string, Socket>();

  getUserSocket(userId: string): Socket | undefined {
    return this.sessions.get(userId);
  }

  setUserSocket(userId: string, socket: Socket): void {
    this.sessions.set(userId, socket);
  }

  removeUserSocket(userId: string): void {
    this.sessions.delete(userId);
  }

  getSockets(): Map<string, Socket> {
    return this.sessions;
  }

  getOnlineUserIds(): string[] {
    return Array.from(this.sessions.keys());
  }

  isUserOnline(userId: string): boolean {
    return this.sessions.has(userId);
  }

  broadcastToRole(role: string, event: string, data: any): void {
    // In production, store role mapping in Redis
    // For MVP, broadcast to all connected clients
    this.sessions.forEach((socket) => {
      socket.emit(event, data);
    });
  }
}