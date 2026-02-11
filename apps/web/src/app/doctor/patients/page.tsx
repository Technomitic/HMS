'use client';

import { Users } from 'lucide-react';

export default function DoctorPatientsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="w-7 h-7 text-primary-500" /> My Patients
        </h1>
        <p className="text-neutral-muted">Patients you have consulted with</p>
      </div>
      <div className="stat-card p-8 text-center text-neutral-muted">
        Patient list with history — uses same DataTable pattern with doctor-specific filters.
      </div>
    </div>
  );
}