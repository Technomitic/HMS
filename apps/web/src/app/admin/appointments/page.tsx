'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Filter, Download, Search } from 'lucide-react';
import DataTable from '@/components/dashboard/DataTable';
import { appointmentApi } from '@/lib/api';
import { formatDate, formatTime, getStatusColor, cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    status: '',
    department: '',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    loadAppointments();
  }, [filters]);

  const loadAppointments = async () => {
    setIsLoading(true);
    try {
      const params: any = { ...filters };
      if (!params.status) delete params.status;
      if (!params.department) delete params.department;
      if (!params.date) delete params.date;
      const { data } = await appointmentApi.getAll(params);
      setAppointments(data.data);
      setMeta(data.meta);
    } catch {
      toast.error('Failed to load appointments');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await appointmentApi.updateStatus(id, { status });
      toast.success('Status updated');
      loadAppointments();
    } catch {
      toast.error('Failed to update');
    }
  };

  const columns = [
    {
      key: 'patient',
      label: 'Patient',
      render: (row: any) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-xs font-semibold text-primary-500">
            {row.patient?.user?.firstName?.[0]}{row.patient?.user?.lastName?.[0]}
          </div>
          <div>
            <p className="font-medium text-sm">
              {row.patient?.user?.firstName} {row.patient?.user?.lastName}
            </p>
            <p className="text-xs text-neutral-muted">{row.patient?.mrn}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'doctor',
      label: 'Doctor',
      render: (row: any) => (
        <span className="text-sm">Dr. {row.doctor?.firstName} {row.doctor?.lastName}</span>
      ),
    },
    {
      key: 'department',
      label: 'Dept',
      render: (row: any) => (
        <span className="text-sm capitalize">{row.department?.replace('_', ' ').toLowerCase()}</span>
      ),
    },
    {
      key: 'time',
      label: 'Date & Time',
      render: (row: any) => (
        <div>
          <p className="text-sm font-medium">{formatDate(row.slotStart)}</p>
          <p className="text-xs text-neutral-muted">{formatTime(row.slotStart)} - {formatTime(row.slotEnd)}</p>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row: any) => (
        <span className={cn('px-3 py-1 rounded-full text-xs font-medium', getStatusColor(row.status))}>
          {row.status}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row: any) => (
        <div className="flex gap-1">
          {row.status === 'SCHEDULED' && (
            <button
              onClick={(e) => { e.stopPropagation(); handleStatusUpdate(row.id, 'CONFIRMED'); }}
              className="px-2 py-1 bg-green-50 text-success-500 text-xs rounded-lg font-medium hover:bg-green-100"
            >
              Confirm
            </button>
          )}
          {['SCHEDULED', 'CONFIRMED'].includes(row.status) && (
            <button
              onClick={(e) => { e.stopPropagation(); handleStatusUpdate(row.id, 'CANCELLED'); }}
              className="px-2 py-1 bg-red-50 text-danger-500 text-xs rounded-lg font-medium hover:bg-red-100"
            >
              Cancel
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Appointments</h1>
          <p className="text-neutral-muted">Manage all hospital appointments</p>
        </div>
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 flex-wrap"
      >
        <input
          type="date"
          value={filters.date}
          onChange={(e) => setFilters({ ...filters, date: e.target.value, page: 1 })}
          className="input-field max-w-[180px] text-sm"
        />
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
          className="input-field max-w-[180px] text-sm"
        >
          <option value="">All Statuses</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="CHECKED_IN">Checked In</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <select
          value={filters.department}
          onChange={(e) => setFilters({ ...filters, department: e.target.value, page: 1 })}
          className="input-field max-w-[180px] text-sm"
        >
          <option value="">All Departments</option>
          <option value="CARDIOLOGY">Cardiology</option>
          <option value="NEUROLOGY">Neurology</option>
          <option value="ORTHOPEDICS">Orthopedics</option>
          <option value="PEDIATRICS">Pediatrics</option>
          <option value="GENERAL_MEDICINE">General Medicine</option>
        </select>
      </motion.div>

      <DataTable columns={columns} data={appointments} isLoading={isLoading} emptyMessage="No appointments found" />

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
            disabled={filters.page <= 1}
            className="px-4 py-2 rounded-lg border border-neutral-border text-sm disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-neutral-muted">
            Page {meta.page} of {meta.totalPages} ({meta.total} total)
          </span>
          <button
            onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
            disabled={filters.page >= meta.totalPages}
            className="px-4 py-2 rounded-lg border border-neutral-border text-sm disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}