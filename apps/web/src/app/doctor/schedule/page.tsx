'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { appointmentApi } from '@/lib/api';
import { formatTime, getStatusColor, getInitials, cn } from '@/lib/utils';
import { toast } from 'sonner';
import Link from 'next/link';

export default function DoctorSchedulePage() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSchedule();
  }, [date]);

  const loadSchedule = async () => {
    setIsLoading(true);
    try {
      const { data } = await appointmentApi.getDoctorSchedule(date);
      setAppointments(data.data);
    } catch {
      toast.error('Failed to load schedule');
    } finally {
      setIsLoading(false);
    }
  };

  const changeDate = (days: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    setDate(d.toISOString().split('T')[0]);
  };

  const dayLabel = new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Schedule</h1>
        <p className="text-neutral-muted">Your daily patient schedule</p>
      </div>

      {/* Date Navigator */}
      <div className="flex items-center justify-between bg-white rounded-2xl border border-neutral-border p-4">
        <button onClick={() => changeDate(-1)} className="p-2 hover:bg-neutral-bg rounded-xl">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <p className="font-semibold text-lg">{dayLabel}</p>
          <p className="text-sm text-neutral-muted">{appointments.length} appointments</p>
        </div>
        <button onClick={() => changeDate(1)} className="p-2 hover:bg-neutral-bg rounded-xl">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Timeline */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-10 h-10 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
        </div>
      ) : appointments.length === 0 ? (
        <div className="text-center py-16">
          <Calendar className="w-16 h-16 text-neutral-disabled mx-auto mb-4" />
          <p className="text-neutral-muted text-lg">No appointments scheduled</p>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((apt, i) => (
            <motion.div
              key={apt.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                href={`/doctor/appointments/${apt.id}`}
                className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-neutral-border hover:shadow-md hover:border-primary-300 transition-all"
              >
                {/* Time */}
                <div className="w-20 text-center">
                  <p className="font-semibold text-primary-500">{formatTime(apt.slotStart)}</p>
                  <p className="text-xs text-neutral-muted">{formatTime(apt.slotEnd)}</p>
                </div>

                {/* Divider */}
                <div className="w-1 h-14 rounded-full bg-primary-200" />

                {/* Patient Info */}
                <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center font-semibold text-primary-500">
                  {getInitials(
                    apt.patient?.user?.firstName || 'U',
                    apt.patient?.user?.lastName || 'N',
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium">
                    {apt.patient?.user?.firstName} {apt.patient?.user?.lastName}
                  </p>
                  <p className="text-sm text-neutral-muted">
                    {apt.chiefComplaint || 'General consultation'}
                  </p>
                </div>

                {/* Status */}
                <span className={cn('px-3 py-1 rounded-full text-xs font-medium', getStatusColor(apt.status))}>
                  {apt.status}
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}