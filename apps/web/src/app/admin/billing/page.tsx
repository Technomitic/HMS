'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';
import DataTable from '@/components/dashboard/DataTable';
import StatsCard from '@/components/dashboard/StatsCard';
import { billingApi } from '@/lib/api';
import { formatDate, formatCurrency, getStatusColor, cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function AdminBillingPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadInvoices();
  }, [page, statusFilter]);

  const loadInvoices = async () => {
    setIsLoading(true);
    try {
      const params: any = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      const { data } = await billingApi.getAll(params);
      setInvoices(data.data);
      setMeta(data.meta);
    } catch {
      toast.error('Failed to load invoices');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkPaid = async (id: string) => {
    try {
      await billingApi.markPaid(id, 'cash');
      toast.success('Invoice marked as paid');
      loadInvoices();
    } catch {
      toast.error('Failed to update');
    }
  };

  const totalBilled = invoices.reduce((s, i) => s + i.totalCents, 0);
  const totalPaid = invoices.filter(i => i.status === 'PAID').reduce((s, i) => s + i.totalCents, 0);
  const totalUnpaid = invoices.filter(i => i.status === 'UNPAID').reduce((s, i) => s + i.totalCents, 0);

  const columns = [
    {
      key: 'invoiceNumber',
      label: 'Invoice #',
      render: (row: any) => <span className="font-mono text-sm font-medium">{row.invoiceNumber}</span>,
    },
    {
      key: 'patient',
      label: 'Patient',
      render: (row: any) => (
        <span className="text-sm">{row.patient?.user?.firstName} {row.patient?.user?.lastName}</span>
      ),
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (row: any) => <span className="text-sm font-semibold">{formatCurrency(row.totalCents)}</span>,
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
      key: 'dueDate',
      label: 'Due Date',
      render: (row: any) => <span className="text-sm text-neutral-muted">{formatDate(row.dueDate)}</span>,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row: any) => (
        row.status === 'UNPAID' ? (
          <button
            onClick={(e) => { e.stopPropagation(); handleMarkPaid(row.id); }}
            className="px-3 py-1 bg-green-50 text-success-500 text-xs rounded-lg font-medium hover:bg-green-100"
          >
            Mark Paid
          </button>
        ) : (
          <span className="text-xs text-neutral-muted">
            {row.paidAt ? `Paid ${formatDate(row.paidAt)}` : '—'}
          </span>
        )
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Billing & Invoices</h1>
        <p className="text-neutral-muted">Manage hospital billing and payments</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard
          title="Total Billed (Page)"
          value={formatCurrency(totalBilled)}
          icon={DollarSign}
          iconColor="text-primary-500"
          iconBg="bg-primary-50"
          index={0}
        />
        <StatsCard
          title="Collected"
          value={formatCurrency(totalPaid)}
          icon={TrendingUp}
          iconColor="text-success-500"
          iconBg="bg-green-50"
          index={1}
        />
        <StatsCard
          title="Outstanding"
          value={formatCurrency(totalUnpaid)}
          icon={AlertCircle}
          iconColor="text-danger-500"
          iconBg="bg-red-50"
          index={2}
        />
      </div>

      <div className="flex gap-4">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="input-field max-w-[180px] text-sm"
        >
          <option value="">All Statuses</option>
          <option value="UNPAID">Unpaid</option>
          <option value="PAID">Paid</option>
          <option value="REFUNDED">Refunded</option>
          <option value="VOID">Void</option>
        </select>
      </div>

      <DataTable columns={columns} data={invoices} isLoading={isLoading} emptyMessage="No invoices found" />

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