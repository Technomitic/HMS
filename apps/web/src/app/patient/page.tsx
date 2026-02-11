'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  FileText,
  CreditCard,
  Clock,
  ChevronRight,
  Pill,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { dashboardApi } from '@/lib/api';
import { formatDate, formatTime, formatCurrency, getStatusColor, cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function PatientDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { data } = await dashboardApi.patient();
      setStats(data.data);
    } catch {
      toast.error('Failed to load dashboard');
    } finally {
      setIsLoading(false);
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
        <h1 className="text-2xl font-bold">Welcome Back!</h1>
        <p className="text-neutral-muted">Manage your appointments and health records</p>
      </div>

      {/* Next Appointment Highlight */}
      {stats.nextAppointment && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="gradient-primary rounded-2xl p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-sm font-medium">Next Appointment</p>
              <h2 className="text-2xl font-bold mt-1">
                Dr. {stats.nextAppointment.doctor?.firstName} {stats.nextAppointment.doctor?.lastName}
              </h2>
              <p className="text-white/80 mt-1">
                {stats.nextAppointment.department?.replace('_', ' ')} · {stats.nextAppointment.chiefComplaint || 'Consultation'}
              </p>
              <div className="flex items-center gap-4 mt-3">
                <span className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-lg text-sm">
                  <Calendar className="w-4 h-4" />
                  {formatDate(stats.nextAppointment.slotStart)}
                </span>
                <span className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-lg text-sm">
                  <Clock className="w-4 h-4" />
                  {formatTime(stats.nextAppointment.slotStart)}
                </span>
              </div>
            </div>
            <Link
              href={`/patient/appointments`}
              className="px-6 py-3 bg-white text-primary-500 font-semibold rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              View Details <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upcoming Appointments */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="stat-card"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary-500" />
              Upcoming Appointments
            </h2>
            <Link href="/patient/appointments" className="text-primary-500 text-sm font-medium">
              View All
            </Link>
          </div>

          {stats.upcomingAppointments?.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-10 h-10 text-neutral-disabled mx-auto mb-2" />
              <p className="text-neutral-muted text-sm">No upcoming appointments</p>
              <Link href="/book" className="btn-primary text-sm mt-3 inline-block">
                Book Now
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.upcomingAppointments.map((apt: any) => (
                <div key={apt.id} className="flex items-center justify-between p-3 bg-neutral-bg rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-sm font-semibold text-primary-500">
                      {apt.doctor?.firstName?.[0]}{apt.doctor?.lastName?.[0]}
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        Dr. {apt.doctor?.firstName} {apt.doctor?.lastName}
                      </p>
                      <p className="text-xs text-neutral-muted">{apt.department?.replace('_', ' ')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatDate(apt.slotStart)}</p>
                    <p className="text-xs text-neutral-muted">{formatTime(apt.slotStart)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Pending Invoices */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="stat-card"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-warning-500" />
              Pending Bills
            </h2>
            <Link href="/patient/billing" className="text-primary-500 text-sm font-medium">
              View All
            </Link>
          </div>

          {stats.pendingInvoices?.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="w-10 h-10 text-neutral-disabled mx-auto mb-2" />
              <p className="text-neutral-muted text-sm">No pending bills</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.pendingInvoices.map((inv: any) => (
                <div key={inv.id} className="flex items-center justify-between p-3 bg-neutral-bg rounded-xl">
                  <div>
                    <p className="font-medium text-sm">{inv.invoiceNumber}</p>
                    <p className="text-xs text-neutral-muted">Due: {formatDate(inv.dueDate)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-danger-500">{formatCurrency(inv.totalCents)}</p>
                    <span className={cn('text-xs font-medium', getStatusColor(inv.status))}>
                      {inv.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Recent Lab Reports */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="stat-card"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2">
              <FileText className="w-5 h-5 text-accent-500" />
              Recent Lab Reports
            </h2>
            <Link href="/patient/lab-reports" className="text-primary-500 text-sm font-medium">
              View All
            </Link>
          </div>

          {stats.recentLabReports?.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-10 h-10 text-neutral-disabled mx-auto mb-2" />
              <p className="text-neutral-muted text-sm">No lab reports yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.recentLabReports.map((report: any) => (
                <div key={report.id} className="flex items-center justify-between p-3 bg-neutral-bg rounded-xl">
                  <div>
                    <p className="font-medium text-sm">{report.testType}</p>
                    <p className="text-xs text-neutral-muted">
                      By Dr. {report.orderedByUser?.firstName} {report.orderedByUser?.lastName}
                    </p>
                  </div>
                  <span className={cn('px-3 py-1 rounded-full text-xs font-medium', getStatusColor(report.status))}>
                    {report.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="stat-card"
        >
          <h2 className="font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Book Appointment', href: '/book', icon: Calendar, color: 'bg-primary-50 text-primary-500' },
              { label: 'View Lab Reports', href: '/patient/lab-reports', icon: FileText, color: 'bg-accent-50 text-accent-500' },
              { label: 'Pay Bills', href: '/patient/billing', icon: CreditCard, color: 'bg-green-50 text-success-500' },
              { label: 'Prescriptions', href: '/patient/prescriptions', icon: Pill, color: 'bg-purple-50 text-purple-500' },
            ].map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="flex items-center gap-3 p-4 rounded-xl border border-neutral-border hover:shadow-md transition-all"
              >
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', action.color)}>
                  <action.icon className="w-5 h-5" />
                </div>
                <span className="font-medium text-sm">{action.label}</span>
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}