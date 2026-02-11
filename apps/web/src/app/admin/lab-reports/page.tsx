'use client';

import { useState, useEffect } from 'react';
import { FlaskConical } from 'lucide-react';
import DataTable from '@/components/dashboard/DataTable';
import { labReportApi } from '@/lib/api';
import { formatDate, getStatusColor, cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function AdminLabReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadReports();
  }, [page, statusFilter]);

  const loadReports = async () => {
    setIsLoading(true);
    try {
      const params: any = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      const { data } = await labReportApi.getAll(params);
      setReports(data.data);
      setMeta(data.meta);
    } catch {
      toast.error('Failed to load lab reports');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const results = status === 'COMPLETED' ? {
        hemoglobin: { value: '14.5', unit: 'g/dL', referenceRange: '12-17', isAbnormal: false },
        wbc: { value: '7200', unit: '/µL', referenceRange: '4000-11000', isAbnormal: false },
        platelets: { value: '260000', unit: '/µL', referenceRange: '150000-400000', isAbnormal: false },
      } : undefined;

      await labReportApi.updateStatus(id, { status, results });
      toast.success(`Report status updated to ${status}`);
      loadReports();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const columns = [
    {
      key: 'testType',
      label: 'Test',
      render: (row: any) => (
        <div>
          <p className="font-medium text-sm">{row.testType}</p>
          <p className="text-xs text-neutral-muted capitalize">{row.testCategory?.toLowerCase()}</p>
        </div>
      ),
    },
    {
      key: 'patient',
      label: 'Patient',
      render: (row: any) => (
        <span className="text-sm">{row.patient?.user?.firstName} {row.patient?.user?.lastName}</span>
      ),
    },
    {
      key: 'orderedBy',
      label: 'Ordered By',
      render: (row: any) => (
        <span className="text-sm">Dr. {row.orderedByUser?.firstName} {row.orderedByUser?.lastName}</span>
      ),
    },
    {
      key: 'date',
      label: 'Date',
      render: (row: any) => <span className="text-sm text-neutral-muted">{formatDate(row.createdAt)}</span>,
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
      render: (row: any) => {
        const transitions: Record<string, string[]> = {
          ORDERED: ['SAMPLE_COLLECTED'],
          SAMPLE_COLLECTED: ['PROCESSING'],
          PROCESSING: ['COMPLETED', 'REJECTED'],
        };
        const nextStatuses = transitions[row.status] || [];
        return (
          <div className="flex gap-1">
            {nextStatuses.map((status) => (
              <button
                key={status}
                onClick={(e) => { e.stopPropagation(); handleUpdateStatus(row.id, status); }}
                className={cn(
                  'px-2 py-1 text-xs rounded-lg font-medium',
                  status === 'COMPLETED' ? 'bg-green-50 text-success-500 hover:bg-green-100' :
                  status === 'REJECTED' ? 'bg-red-50 text-danger-500 hover:bg-red-100' :
                  'bg-blue-50 text-primary-500 hover:bg-blue-100'
                )}
              >
                {status.replace('_', ' ')}
              </button>
            ))}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FlaskConical className="w-7 h-7 text-primary-500" /> Lab Reports
        </h1>
        <p className="text-neutral-muted">Manage laboratory orders and results</p>
      </div>

      <div className="flex gap-4">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="input-field max-w-[200px] text-sm"
        >
          <option value="">All Statuses</option>
          <option value="ORDERED">Ordered</option>
          <option value="SAMPLE_COLLECTED">Sample Collected</option>
          <option value="PROCESSING">Processing</option>
          <option value="COMPLETED">Completed</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      <DataTable columns={columns} data={reports} isLoading={isLoading} emptyMessage="No lab reports found" />

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