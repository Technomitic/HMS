'use client';

import { Pill } from 'lucide-react';

export default function DoctorPrescriptionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Pill className="w-7 h-7 text-primary-500" /> Prescriptions
        </h1>
        <p className="text-neutral-muted">Review prescriptions you have written</p>
      </div>
      <div className="stat-card p-8 text-center text-neutral-muted">
        Prescription history — extracted from completed appointments with prescription data.
      </div>
    </div>
  );
}