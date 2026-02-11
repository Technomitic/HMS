'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Users } from 'lucide-react';
import DataTable from '@/components/dashboard/DataTable';
import { patientApi } from '@/lib/api';
import { formatDate, getInitials } from '@/lib/utils';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function AdminPatientsPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const router = useRouter();

  useEffect(() => {
    loadPatients();
  }, [page, search]);

  const loadPatients = async () => {
    setIsLoading(true);
    try {
      const params: any = { page, limit: 20 };
      if (search) params.search = search;
      const { data } = await patientApi.getAll(params);
      setPatients(data.data);
      setMeta(data.meta);
    } catch {
      toast.error('Failed to load patients');
    } finally {
      setIsLoading(false);
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Patient',
      render: (row: any) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-xs font-semibold text-primary-500">
            {getInitials(row.user?.firstName || 'U', row.user?.lastName || 'N')}
          </div>
          <div>
            <p className="font-medium text-sm">{row.user?.firstName} {row.user?.lastName}</p>
            <p className="text-xs text-neutral-muted">{row.user?.email}</p>
          </div>
        </div>
      ),
    },
    { key: 'mrn', label: 'MRN', render: (row: any) => <span className="text-sm font-mono">{row.mrn}</span> },
    { key: 'gender', label: 'Gender', render: (row: any) => <span className="text-sm capitalize">{row.gender?.toLowerCase()}</span> },
    { key: 'bloodGroup', label: 'Blood', render: (row: any) => <span className="text-sm">{row.bloodGroup || '—'}</span> },
    { key: 'dob', label: 'DOB', render: (row: any) => <span className="text-sm">{formatDate(row.dateOfBirth)}</span> },
    { key: 'phone', label: 'Phone', render: (row: any) => <span className="text-sm">{row.user?.phone || '—'}</span> },
    {
      key: 'registered',
      label: 'Registered',
      render: (row: any) => <span className="text-sm text-neutral-muted">{formatDate(row.createdAt)}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-7 h-7 text-primary-500" /> Patients
          </h1>
          <p className="text-neutral-muted">{meta.total || 0} registered patients</p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="input-field pl-10 text-sm"
          placeholder="Search by name, MRN, email..."
        />
      </div>

      <DataTable columns={columns} data={patients} isLoading={isLoading} emptyMessage="No patients found" />

      {meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(page - 1)} disabled={page <= 1} className="px-4 py-2 rounded-lg border text-sm disabled:opacity-50">
            Previous
          </button>
          <span className="text-sm text-neutral-muted">Page {meta.page} of {meta.totalPages}</span>
          <button onClick={() => setPage(page + 1)} disabled={page >= meta.totalPages} className="px-4 py-2 rounded-lg border text-sm disabled:opacity-50">
            Next
          </button>
        </div>
      )}
    </div>
  );
}