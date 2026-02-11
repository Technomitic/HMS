'use client';

import { useState, useEffect } from 'react';
import { ScrollText, Filter } from 'lucide-react';
import DataTable from '@/components/dashboard/DataTable';
import { api } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import { toast } from 'sonner';

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ action: '', resourceType: '', startDate: '', endDate: '' });

  useEffect(() => {
    loadLogs();
  }, [page, filters]);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const params: any = { page, limit: 50 };
      if (filters.action) params.action = filters.action;
      if (filters.resourceType) params.resourceType = filters.resourceType;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const { data } = await api.get('/audit-logs', { params });
      setLogs(data.data);
      setMeta(data.meta);
    } catch {
      toast.error('Failed to load audit logs');
    } finally {
      setIsLoading(false);
    }
  };

  const columns = [
    {
      key: 'timestamp',
      label: 'Timestamp',
      render: (row: any) => (
        <span className="text-xs font-mono text-neutral-muted">{formatDateTime(row.createdAt)}</span>
      ),
    },
    {
      key: 'user',
      label: 'User',
      render: (row: any) => (
        <div>
          <p className="text-sm font-medium">{row.user?.firstName} {row.user?.lastName}</p>
          <p className="text-xs text-neutral-muted capitalize">{row.user?.role?.toLowerCase()}</p>
        </div>
      ),
    },
    {
      key: 'action',
      label: 'Action',
      render: (row: any) => <span className="text-sm font-mono">{row.action}</span>,
    },
    {
      key: 'resource',
      label: 'Resource',
      render: (row: any) => (
        <span className="text-sm">
          {row.resourceType} / <span className="font-mono text-xs">{row.resourceId?.slice(0, 8)}</span>
        </span>
      ),
    },
    {
      key: 'ip',
      label: 'IP Address',
      render: (row: any) => <span className="text-xs font-mono text-neutral-muted">{row.ipAddress}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ScrollText className="w-7 h-7 text-primary-500" /> Audit Logs
        </h1>
        <p className="text-neutral-muted">Immutable record of all system actions</p>
      </div>

      <div className="flex gap-4 flex-wrap">
        <input
          type="text"
          value={filters.action}
          onChange={(e) => { setFilters({ ...filters, action: e.target.value }); setPage(1); }}
          className="input-field max-w-[200px] text-sm"
          placeholder="Filter by action..."
        />
        <select
          value={filters.resourceType}
          onChange={(e) => { setFilters({ ...filters, resourceType: e.target.value }); setPage(1); }}
          className="input-field max-w-[180px] text-sm"
        >
          <option value="">All Resources</option>
          <option value="appointments">Appointments</option>
          <option value="patients">Patients</option>
          <option value="lab-reports">Lab Reports</option>
          <option value="billing">Billing</option>
        </select>
        <input
          type="date"
          value={filters.startDate}
          onChange={(e) => { setFilters({ ...filters, startDate: e.target.value }); setPage(1); }}
          className="input-field max-w-[180px] text-sm"
          placeholder="Start date"
        />
        <input
          type="date"
          value={filters.endDate}
          onChange={(e) => { setFilters({ ...filters, endDate: e.target.value }); setPage(1); }}
          className="input-field max-w-[180px] text-sm"
          placeholder="End date"
        />
      </div>

      <DataTable columns={columns} data={logs} isLoading={isLoading} emptyMessage="No audit logs found" />

      {meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(page - 1)} disabled={page <= 1} className="px-4 py-2 rounded-lg border text-sm disabled:opacity-50">Previous</button>
          <span className="text-sm text-neutral-muted">Page {meta.page} of {meta.totalPages} ({meta.total} records)</span>
          <button onClick={() => setPage(page + 1)} disabled={page >= meta.totalPages} className="px-4 py-2 rounded-lg border text-sm disabled:opacity-50">Next</button>
        </div>
      )}
    </div>
  );
}