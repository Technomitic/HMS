'use client';

import { useState, useEffect } from 'react';
import { Stethoscope, Search } from 'lucide-react';
import DataTable from '@/components/dashboard/DataTable';
import { doctorApi } from '@/lib/api';
import { getInitials, cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function AdminDoctorsPage() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadDoctors();
  }, [page, search, department]);

  const loadDoctors = async () => {
    setIsLoading(true);
    try {
      const params: any = { page, limit: 20 };
      if (search) params.search = search;
      if (department) params.department = department;
      const { data } = await doctorApi.getAll(params);
      setDoctors(data.data);
      setMeta(data.meta);
    } catch {
      toast.error('Failed to load doctors');
    } finally {
      setIsLoading(false);
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Doctor',
      render: (row: any) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-sm font-semibold text-primary-500">
            {getInitials(row.user?.firstName || 'D', row.user?.lastName || 'R')}
          </div>
          <div>
            <p className="font-medium text-sm">Dr. {row.user?.firstName} {row.user?.lastName}</p>
            <p className="text-xs text-neutral-muted">{row.user?.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'department',
      label: 'Department',
      render: (row: any) => (
        <span className="text-sm capitalize">{row.department?.replace('_', ' ').toLowerCase()}</span>
      ),
    },
    { key: 'specialization', label: 'Specialization', render: (row: any) => <span className="text-sm">{row.specialization}</span> },
    { key: 'experience', label: 'Experience', render: (row: any) => <span className="text-sm">{row.experienceYears} years</span> },
    {
      key: 'fee',
      label: 'Fee',
      render: (row: any) => <span className="text-sm font-medium">${(row.consultationFee / 100).toFixed(0)}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (row: any) => (
        <span className={cn(
          'px-3 py-1 rounded-full text-xs font-medium',
          row.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        )}>
          {row.isAvailable ? 'Available' : 'Unavailable'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Stethoscope className="w-7 h-7 text-primary-500" /> Doctors
        </h1>
        <p className="text-neutral-muted">{meta.total || 0} registered doctors</p>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="input-field pl-10 text-sm"
            placeholder="Search by name or specialization..."
          />
        </div>
        <select
          value={department}
          onChange={(e) => { setDepartment(e.target.value); setPage(1); }}
          className="input-field max-w-[200px] text-sm"
        >
          <option value="">All Departments</option>
          <option value="CARDIOLOGY">Cardiology</option>
          <option value="NEUROLOGY">Neurology</option>
          <option value="ORTHOPEDICS">Orthopedics</option>
          <option value="PEDIATRICS">Pediatrics</option>
          <option value="DERMATOLOGY">Dermatology</option>
          <option value="GENERAL_MEDICINE">General Medicine</option>
          <option value="EMERGENCY">Emergency</option>
          <option value="OPHTHALMOLOGY">Ophthalmology</option>
        </select>
      </div>

      <DataTable columns={columns} data={doctors} isLoading={isLoading} emptyMessage="No doctors found" />

      {meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(page - 1)} disabled={page <= 1} className="px-4 py-2 rounded-lg border text-sm disabled:opacity-50">Previous</button>
          <span className="text-sm text-neutral-muted">Page {meta.page} of {meta.totalPages}</span>
          <button onClick={() => setPage(page + 1)} disabled={page >= meta.totalPages} className="px-4 py-2 rounded-lg border text-sm disabled:opacity-50">Next</button>
        </div>
      )}
    </div>
  );
}