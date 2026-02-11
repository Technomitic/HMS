'use client';

import { useState, useEffect } from 'react';
import { CreditCard, Download } from 'lucide-react';
import DataTable from '@/components/dashboard/DataTable';
import { billingApi, patientApi } from '@/lib/api';
import { formatDate, formatCurrency, getStatusColor, cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function PatientBillingPage() {
  const [summary, setSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBilling();
  }, []);

  const loadBilling = async () => {
    try {
      const patientRes = await patientApi.getMe();
      const patientId = patientRes.data.data.id;
      const { data } = await billingApi.getPatientSummary(patientId);
      setSummary(data.data);
    } catch {
      toast.error('Failed to load billing');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CreditCard className="w-7 h-7 text-primary-500" /> My Bills
        </h1>
        <p className="text-neutral-muted">View and manage your invoices</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="stat-card text-center">
          <p className="text-sm text-neutral-muted">Total Billed</p>
          <p className="text-2xl font-bold mt-1">{formatCurrency(summary?.totalBilledCents || 0)}</p>
        </div>
        <div className="stat-card text-center">
          <p className="text-sm text-neutral-muted">Total Paid</p>
          <p className="text-2xl font-bold mt-1 text-success-500">{formatCurrency(summary?.totalPaidCents || 0)}</p>
        </div>
        <div className="stat-card text-center">
          <p className="text-sm text-neutral-muted">Outstanding</p>
          <p className="text-2xl font-bold mt-1 text-danger-500">{formatCurrency(summary?.totalOutstandingCents || 0)}</p>
        </div>
      </div>

      {/* Invoice List */}
      <div className="space-y-3">
        {summary?.recentInvoices?.map((inv: any) => (
          <div key={inv.id} className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-mono font-medium text-sm">{inv.invoiceNumber}</p>
                <p className="text-xs text-neutral-muted">Due: {formatDate(inv.dueDate)}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-semibold">{formatCurrency(inv.totalCents)}</p>
                  <span className={cn('px-3 py-1 rounded-full text-xs font-medium', getStatusColor(inv.status))}>
                    {inv.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Line items */}
            {inv.items && (
              <div className="mt-3 pt-3 border-t border-neutral-border space-y-1">
                {(inv.items as any[]).map((item: any, i: number) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-neutral-muted">{item.description}</span>
                    <span>{formatCurrency(item.totalCents)}</span>
                  </div>
                ))}
                {inv.taxCents > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-muted">Tax</span>
                    <span>{formatCurrency(inv.taxCents)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {(!summary?.recentInvoices || summary.recentInvoices.length === 0) && (
          <div className="stat-card text-center py-8">
            <CreditCard className="w-10 h-10 text-neutral-disabled mx-auto mb-2" />
            <p className="text-neutral-muted">No invoices yet</p>
          </div>
        )}
      </div>
    </div>
  );
}