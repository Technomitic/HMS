'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Plus } from 'lucide-react';
import Link from 'next/link';
import { appointmentApi, patientApi } from '@/lib/api';
import { formatDate, formatTime, getStatusColor, cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function PatientAppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      const patientRes = await patientApi.getMe();
      const patientId = patientRes.data.data.id;
      const { data } = await appointmentApi.getAll({ patientId, limit: 50 });
      setAppointments(data.data);
    } catch {
      toast.error('Failed to load appointments');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  const upcoming = appointments.filter(a => ['SCHEDULED', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS'].includes(a.status));
  const past = appointments.filter(a => ['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(a.status));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Appointments</h1>
          <p className="text-neutral-muted">{appointments.length} total appointments</p>
        </div>
        <Link href="/book" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Book New
        </Link>
      </div>

      {/* Upcoming */}
      <div>
        <h2 className="font-semibold text-lg mb-3">Upcoming ({upcoming.length})</h2>
        {upcoming.length === 0 ? (
          <div className="stat-card text-center py-8">
            <Calendar className="w-10 h-10 text-neutral-disabled mx-auto mb-2" />
            <p className="text-neutral-muted">No upcoming appointments</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map((apt, i) => (
              <motion.div
                key={apt.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="stat-card"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-primary-100 flex items-center justify-center text-lg font-bold text-primary-500">
                      {apt.doctor?.firstName?.[0]}{apt.doctor?.lastName?.[0]}
                    </div>
                    <div>
                      <p className="font-semibold">
                        Dr. {apt.doctor?.firstName} {apt.doctor?.lastName}
                      </p>
                      <p className="text-sm text-neutral-muted capitalize">
                        {apt.department?.replace('_', ' ').toLowerCase()}
                      </p>
                      {apt.chiefComplaint && (
                        <p className="text-xs text-neutral-muted mt-1">"{apt.chiefComplaint}"</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatDate(apt.slotStart)}</p>
                    <p className="text-sm text-neutral-muted">{formatTime(apt.slotStart)} - {formatTime(apt.slotEnd)}</p>
                    <span className={cn('mt-2 inline-block px-3 py-1 rounded-full text-xs font-medium', getStatusColor(apt.status))}>
                      {apt.status}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Past */}
      <div>
        <h2 className="font-semibold text-lg mb-3">Past ({past.length})</h2>
        <div className="space-y-3">
          {past.map((apt) => (
            <div key={apt.id} className="stat-card opacity-75">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-neutral-bg flex items-center justify-center text-sm font-bold text-neutral-muted">
                    {apt.doctor?.firstName?.[0]}{apt.doctor?.lastName?.[0]}
                  </div>
                  <div>
                    <p className="font-medium">Dr. {apt.doctor?.firstName} {apt.doctor?.lastName}</p>
                    <p className="text-sm text-neutral-muted capitalize">{apt.department?.replace('_', ' ').toLowerCase()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm">{formatDate(apt.slotStart)}</p>
                  <span className={cn('px-3 py-1 rounded-full text-xs font-medium', getStatusColor(apt.status))}>
                    {apt.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}