'use client';

import { useState, useEffect } from 'react';
import { FileText, Download, Eye } from 'lucide-react';
import DataTable from '@/components/dashboard/DataTable';
import { labReportApi, patientApi } from '@/lib/api';
import { formatDate, getStatusColor, cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function PatientLabReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<any>(null);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const patientRes = await patientApi.getMe();
      const patientId = patientRes.data.data.id;
      const { data } = await labReportApi.getByPatient(patientId, { limit: 50 });
      setReports(data.data);
    } catch {
      toast.error('Failed to load lab reports');
    } finally {
      setIsLoading(false);
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
      key: 'orderedBy',
      label: 'Ordered By',
      render: (row: any) => (
        <span className="text-sm">Dr. {row.orderedByUser?.firstName} {row.orderedByUser?.lastName}</span>
      ),
    },
    {
      key: 'date',
      label: 'Date',
      render: (row: any) => <span className="text-sm">{formatDate(row.createdAt)}</span>,
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
      label: '',
      render: (row: any) => (
        row.status === 'COMPLETED' ? (
          <button
            onClick={(e) => { e.stopPropagation(); setSelectedReport(row); }}
            className="flex items-center gap-1 px-3 py-1 bg-primary-50 text-primary-500 text-xs rounded-lg font-medium hover:bg-primary-100"
          >
            <Eye className="w-3.5 h-3.5" /> View Results
          </button>
        ) : (
          <span className="text-xs text-neutral-muted">Pending</span>
        )
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="w-7 h-7 text-primary-500" /> Lab Reports
        </h1>
        <p className="text-neutral-muted">View your laboratory test results</p>
      </div>

      <DataTable columns={columns} data={reports} isLoading={isLoading} emptyMessage="No lab reports yet" />

      {/* Results Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">{selectedReport.testType} Results</h2>
              <button onClick={() => setSelectedReport(null)} className="p-1 hover:bg-neutral-bg rounded-lg">✕</button>
            </div>

            <div className="text-sm text-neutral-muted">
              Completed: {selectedReport.completedAt ? formatDate(selectedReport.completedAt) : 'N/A'}
            </div>

            {selectedReport.results && (
              <div className="space-y-2">
                {Object.entries(selectedReport.results).map(([key, result]: [string, any]) => (
                  <div key={key} className="flex items-center justify-between p-3 bg-neutral-bg rounded-xl">
                    <div>
                      <p className="font-medium text-sm capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                      <p className="text-xs text-neutral-muted">Ref: {result.referenceRange} {result.unit}</p>
                    </div>
                    <div className="text-right">
                      <p className={cn(
                        'font-semibold',
                        result.isAbnormal ? 'text-danger-500' : 'text-success-500'
                      )}>
                        {result.value} {result.unit}
                      </p>
                      {result.isAbnormal && <p className="text-xs text-danger-500">⚠ Abnormal</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedReport.notes && (
              <div className="p-3 bg-yellow-50 rounded-xl">
                <p className="text-sm font-medium">Notes</p>
                <p className="text-sm text-neutral-muted">{selectedReport.notes}</p>
              </div>
            )}

            <button onClick={() => setSelectedReport(null)} className="btn-primary w-full">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}