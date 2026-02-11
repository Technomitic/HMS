'use client';

import { useState } from 'react';
import { Settings, Building2, Bell, Shield, Palette } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminSettingsPage() {
  const [hospitalName, setHospitalName] = useState('Medix General Hospital');
  const [hospitalEmail, setHospitalEmail] = useState('hello@medix.hospital');
  const [hospitalPhone, setHospitalPhone] = useState('+1 (555) 123-4567');

  const handleSave = () => {
    toast.success('Settings saved successfully');
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="w-7 h-7 text-primary-500" /> Settings
        </h1>
        <p className="text-neutral-muted">Manage hospital configuration</p>
      </div>

      {/* Hospital Info */}
      <div className="stat-card space-y-4">
        <h2 className="font-semibold flex items-center gap-2">
          <Building2 className="w-5 h-5 text-primary-500" /> Hospital Information
        </h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1">Hospital Name</label>
            <input
              value={hospitalName}
              onChange={(e) => setHospitalName(e.target.value)}
              className="input-field"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1">Contact Email</label>
              <input value={hospitalEmail} onChange={(e) => setHospitalEmail(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Phone</label>
              <input value={hospitalPhone} onChange={(e) => setHospitalPhone(e.target.value)} className="input-field" />
            </div>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="stat-card space-y-4">
        <h2 className="font-semibold flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary-500" /> Notification Settings
        </h2>
        <div className="space-y-3">
          {[
            { label: 'Email notifications for appointments', key: 'email_apt' },
            { label: 'SMS reminders (1 hour before)', key: 'sms_reminder' },
            { label: 'Push notifications for lab results', key: 'push_lab' },
            { label: 'Daily summary email to admin', key: 'daily_summary' },
          ].map((item) => (
            <label key={item.key} className="flex items-center justify-between p-3 bg-neutral-bg rounded-xl">
              <span className="text-sm">{item.label}</span>
              <input type="checkbox" defaultChecked className="w-5 h-5 accent-primary-500" />
            </label>
          ))}
        </div>
      </div>

      {/* Security */}
      <div className="stat-card space-y-4">
        <h2 className="font-semibold flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary-500" /> Security
        </h2>
        <div className="space-y-3">
          <label className="flex items-center justify-between p-3 bg-neutral-bg rounded-xl">
            <div>
              <span className="text-sm font-medium">Require MFA for admin users</span>
              <p className="text-xs text-neutral-muted">Mandatory two-factor authentication</p>
            </div>
            <input type="checkbox" defaultChecked className="w-5 h-5 accent-primary-500" />
          </label>
          <label className="flex items-center justify-between p-3 bg-neutral-bg rounded-xl">
            <div>
              <span className="text-sm font-medium">Session timeout</span>
              <p className="text-xs text-neutral-muted">Auto-logout after inactivity</p>
            </div>
            <select className="input-field max-w-[150px] text-sm">
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="60" selected>1 hour</option>
              <option value="240">4 hours</option>
            </select>
          </label>
          <label className="flex items-center justify-between p-3 bg-neutral-bg rounded-xl">
            <div>
              <span className="text-sm font-medium">Audit log retention</span>
              <p className="text-xs text-neutral-muted">How long to keep audit records</p>
            </div>
            <select className="input-field max-w-[150px] text-sm">
              <option value="90">90 days</option>
              <option value="180">180 days</option>
              <option value="365" selected>1 year</option>
              <option value="0">Forever</option>
            </select>
          </label>
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={handleSave} className="btn-primary">
          Save Settings
        </button>
      </div>
    </div>
  );
}