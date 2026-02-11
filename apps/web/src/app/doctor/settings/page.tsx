'use client';

import { Settings } from 'lucide-react';

export default function DoctorSettingsPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="w-7 h-7 text-primary-500" /> Settings
        </h1>
        <p className="text-neutral-muted">Manage your profile and preferences</p>
      </div>
      <div className="stat-card p-8 text-center text-neutral-muted">
        Doctor profile settings — schedule management, notification preferences, and profile editing.
      </div>
    </div>
  );
}