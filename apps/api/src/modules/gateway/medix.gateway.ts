import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger, UnauthorizedException } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { GatewaySessionManager } from './gateway-session.manager';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000', 'https://medix.hospital'],
    credentials: true,
  },
  namespace: '/ws',
  pingInterval: 25000,
  pingTimeout: 10000,
})
export class MedixGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(MedixGateway.name);

  constructor(
    private config: ConfigService,
    private sessions: GatewaySessionManager,
  ) {}

  afterInit() {
    this.logger.log('WebSocket Gateway initialized');
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        client.disconnect();
        return;
      }

      const secret = this.config.get<string>('JWT_SECRET');
      const payload = jwt.verify(token, secret!) as any;

      client.userId = payload.sub;
      client.userRole = payload.role;

      this.sessions.setUserSocket(payload.sub, client);

      // Join role-based room
      client.join(`role:${payload.role}`);
      client.join(`user:${payload.sub}`);

      this.logger.log(
        `Client connected: ${payload.sub} (${payload.role}) — Socket: ${client.id}`,
      );

      // Send connection confirmation
      client.emit('connected', {
        userId: payload.sub,
        role: payload.role,
        onlineUsers: this.sessions.getOnlineUserIds().length,
      });
    } catch (error) {
      this.logger.warn(`Unauthorized socket connection: ${client.id}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      this.sessions.removeUserSocket(client.userId);
      this.logger.log(`Client disconnected: ${client.userId}`);
    }
  }

  // ==========================================
  // REAL-TIME EVENT EMITTERS (called by services)
  // ==========================================

  emitToUser(userId: string, event: string, data: any): void {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  emitToRole(role: string, event: string, data: any): void {
    this.server.to(`role:${role}`).emit(event, data);
  }

  emitToAll(event: string, data: any): void {
    this.server.emit(event, data);
  }

  // Appointment events
  emitAppointmentUpdate(appointmentData: any): void {
    const { patientUserId, doctorId, ...rest } = appointmentData;
    if (patientUserId) {
      this.emitToUser(patientUserId, 'appointment:updated', rest);
    }
    if (doctorId) {
      this.emitToUser(doctorId, 'appointment:updated', rest);
    }
    this.emitToRole('ADMIN', 'appointment:updated', rest);
    this.emitToRole('RECEPTIONIST', 'appointment:updated', rest);
  }

  // Lab report events
  emitLabReportUpdate(reportData: any): void {
    const { patientUserId, doctorId, ...rest } = reportData;
    if (patientUserId) {
      this.emitToUser(patientUserId, 'lab-report:updated', rest);
    }
    if (doctorId) {
      this.emitToUser(doctorId, 'lab-report:updated', rest);
    }
    this.emitToRole('LAB_TECH', 'lab-report:updated', rest);
  }

  // Notification events
  emitNotification(userId: string, notification: any): void {
    this.emitToUser(userId, 'notification:new', notification);
  }

  // Check-in events
  emitCheckIn(doctorId: string, patientData: any): void {
    this.emitToUser(doctorId, 'patient:checked-in', patientData);
  }

  // ==========================================
  // CLIENT-INITIATED EVENTS
  // ==========================================

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: AuthenticatedSocket): void {
    client.emit('pong', { timestamp: Date.now() });
  }

  @SubscribeMessage('notification:mark-read')
  async handleMarkRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { notificationId: string },
  ): Promise<void> {
    // Handled via REST API; this is for real-time UI sync
    client.emit('notification:read', { id: data.notificationId });
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { appointmentId: string },
  ): void {
    // Notify doctor/patient that the other party is typing notes
    client.to(`appointment:${data.appointmentId}`).emit('typing', {
      userId: client.userId,
    });
  }
}