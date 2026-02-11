'use client';

import { ClipboardList } from 'lucide-react';

export default function DoctorLabOrdersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ClipboardList className="w-7 h-7 text-primary-500" /> Lab Orders
        </h1>
        <p className="text-neutral-muted">Track lab orders you have placed</p>
      </div>
      <div className="stat-card p-8 text-center text-neutral-muted">
        Lab orders list — uses labReportApi filtered by orderedBy: currentDoctor.id
      </div>
    </div>
  );
}