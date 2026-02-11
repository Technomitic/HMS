'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Users,
  ClipboardCheck,
  Clock,
  ChevronRight,
  Stethoscope,
  FileText,
} from 'lucide-react';
import StatsCard from '@/components/dashboard/StatsCard';
import { dashboardApi, appointmentApi } from '@/lib/api';
import { formatTime, formatDate, getStatusColor, getInitials, cn } from '@/lib/utils';
import { toast } from 'sonner';
import Link from 'next/link';

export default function DoctorDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { data } = await dashboardApi.doctor();
      setStats(data.data);
    } catch {
      toast.error('Failed to load dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (appointmentId: string, status: string) => {
    try {
      await appointmentApi.updateStatus(appointmentId, { status });
      toast.success(`Appointment marked as ${status.toLowerCase()}`);
      loadStats();
    } catch {
      toast.error('Failed to update status');
    }
  };

  if (isLoading || !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Doctor Dashboard</h1>
        <p className="text-neutral-muted">Your schedule and patients for today</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Today's Appointments"
          value={stats.todayAppointments}
          icon={Calendar}
          iconColor="text-primary-500"
          iconBg="bg-primary-50"
          index={0}
        />
        <StatsCard
          title="Completed Today"
          value={stats.completedToday}
          icon={ClipboardCheck}
          iconColor="text-success-500"
          iconBg="bg-green-50"
          index={1}
        />
        <StatsCard
          title="Pending Reviews"
          value={stats.pendingReviews}
          icon={FileText}
          iconColor="text-warning-500"
          iconBg="bg-yellow-50"
          index={2}
        />
        <StatsCard
          title="Patients This Week"
          value={stats.totalPatientsThisWeek}
          icon={Users}
          iconColor="text-accent-500"
          iconBg="bg-accent-50"
          index={3}
        />
      </div>

      {/* Upcoming Appointments */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="stat-card"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-semibold text-lg">Upcoming Appointments</h2>
          <Link href="/doctor/schedule" className="text-primary-500 text-sm font-medium flex items-center gap-1 hover:underline">
            View Full Schedule <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {stats.upcomingAppointments?.length === 0 ? (
          <div className="text-center py-12">
            <Stethoscope className="w-12 h-12 text-neutral-disabled mx-auto mb-3" />
            <p className="text-neutral-muted">No upcoming appointments</p>
          </div>
        ) : (
          <div className="space-y-3">
            {stats.upcomingAppointments?.map((apt: any, i: number) => (
              <motion.div
                key={apt.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between p-4 bg-neutral-bg rounded-xl hover:bg-neutral-bg/80 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center font-semibold text-primary-500">
                    {getInitials(
                      apt.patient?.user?.firstName || 'U',
                      apt.patient?.user?.lastName || 'N',
                    )}
                  </div>
                  <div>
                    <p className="font-medium">
                      {apt.patient?.user?.firstName} {apt.patient?.user?.lastName}
                    </p>
                    <p className="text-sm text-neutral-muted">
                      {apt.chiefComplaint || 'General consultation'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {formatTime(apt.slotStart)}
                    </p>
                    <p className="text-xs text-neutral-muted">{formatDate(apt.slotStart)}</p>
                  </div>
                  <span className={cn('px-3 py-1 rounded-full text-xs font-medium', getStatusColor(apt.status))}>
                    {apt.status}
                  </span>
                  <div className="flex gap-2">
                    {apt.status === 'CHECKED_IN' && (
                      <button
                        onClick={() => handleStatusUpdate(apt.id, 'IN_PROGRESS')}
                        className="px-3 py-1.5 bg-primary-500 text-white text-xs rounded-lg font-medium hover:bg-primary-700 transition-colors"
                      >
                        Start
                      </button>
                    )}
                    {apt.status === 'IN_PROGRESS' && (
                      <button
                        onClick={() => handleStatusUpdate(apt.id, 'COMPLETED')}
                        className="px-3 py-1.5 bg-success-500 text-white text-xs rounded-lg font-medium hover:bg-success-600 transition-colors"
                      >
                        Complete
                      </button>
                    )}
                    <Link
                      href={`/doctor/appointments/${apt.id}`}
                      className="px-3 py-1.5 bg-neutral-bg border border-neutral-border text-xs rounded-lg font-medium hover:bg-white transition-colors"
                    >
                      View
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}