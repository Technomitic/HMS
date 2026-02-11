'use client';

import { useState, useEffect } from 'react';
import { UserCircle, Save } from 'lucide-react';
import { patientApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { toast } from 'sonner';

export default function PatientProfilePage() {
  const { user } = useAuthStore();
  const [patient, setPatient] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data } = await patientApi.getMe();
      setPatient(data.data);
    } catch {
      // Patient profile may not exist yet
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
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <UserCircle className="w-7 h-7 text-primary-500" /> My Profile
        </h1>
        <p className="text-neutral-muted">Manage your personal information</p>
      </div>

      {/* Avatar */}
      <div className="stat-card flex items-center gap-6">
        <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center text-white text-2xl font-bold">
          {user?.firstName?.[0]}{user?.lastName?.[0]}
        </div>
        <div>
          <h2 className="text-xl font-bold">{user?.firstName} {user?.lastName}</h2>
          <p className="text-neutral-muted">{user?.email}</p>
          {patient && <p className="text-sm text-primary-500 font-medium mt-1">MRN: {patient.mrn}</p>}
        </div>
      </div>

      {/* Details */}
      <div className="stat-card space-y-4">
        <h3 className="font-semibold">Personal Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-neutral-muted">Date of Birth</label>
            <p className="font-medium">{patient?.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : '—'}</p>
          </div>
          <div>
            <label className="text-sm text-neutral-muted">Gender</label>
            <p className="font-medium capitalize">{patient?.gender?.toLowerCase() || '—'}</p>
          </div>
          <div>
            <label className="text-sm text-neutral-muted">Blood Group</label>
            <p className="font-medium">{patient?.bloodGroup || '—'}</p>
          </div>
          <div>
            <label className="text-sm text-neutral-muted">Phone</label>
            <p className="font-medium">{user?.phone || '—'}</p>
          </div>
        </div>
      </div>

      {patient?.allergies?.length > 0 && (
        <div className="stat-card">
          <h3 className="font-semibold mb-2">Allergies</h3>
          <div className="flex gap-2">
            {patient.allergies.map((allergy: string) => (
              <span key={allergy} className="px-3 py-1 bg-red-50 text-danger-500 rounded-full text-sm font-medium">
                {allergy}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="stat-card">
        <h3 className="font-semibold mb-2">Emergency Contact</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-neutral-muted">Name</label>
            <p className="font-medium">{patient?.emergencyName || '—'}</p>
          </div>
          <div>
            <label className="text-sm text-neutral-muted">Phone</label>
            <p className="font-medium">{patient?.emergencyPhone || '—'}</p>
          </div>
          <div>
            <label className="text-sm text-neutral-muted">Relation</label>
            <p className="font-medium">{patient?.emergencyRelation || '—'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}