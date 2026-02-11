'use client';

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';

const WS_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface UseWebSocketOptions {
  onAppointmentUpdate?: (data: any) => void;
  onLabReportUpdate?: (data: any) => void;
  onNewNotification?: (data: any) => void;
  onPatientCheckIn?: (data: any) => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const socketRef = useRef<Socket | null>(null);

  const connect = useCallback(() => {
    const token = localStorage.getItem('medix_access_token');
    if (!token) return;

    if (socketRef.current?.connected) return;

    const socket = io(`${WS_URL}/ws`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 3000,
    });

    socket.on('connect', () => {
      console.log('🔌 WebSocket connected');
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 WebSocket disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      console.warn('🔌 WebSocket connection error:', error.message);
    });

    // Event handlers
    socket.on('appointment:updated', (data) => {
      options.onAppointmentUpdate?.(data);
    });

    socket.on('lab-report:updated', (data) => {
      options.onLabReportUpdate?.(data);
    });

    socket.on('notification:new', (data) => {
      toast.info(data.title, { description: data.body });
      options.onNewNotification?.(data);
    });

    socket.on('patient:checked-in', (data) => {
      toast.info('Patient Checked In', {
        description: `${data.patientName} has arrived for their appointment`,
      });
      options.onPatientCheckIn?.(data);
    });

    socketRef.current = socket;
  }, [options]);

  const disconnect = useCallback(() => {
    socketRef.current?.disconnect();
    socketRef.current = null;
  }, []);

  const emit = useCallback((event: string, data: any) => {
    socketRef.current?.emit(event, data);
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return {
    socket: socketRef.current,
    isConnected: socketRef.current?.connected ?? false,
    emit,
    disconnect,
    reconnect: connect,
  };
}