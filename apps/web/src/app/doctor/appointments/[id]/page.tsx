'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft, User, Calendar, Heart, Thermometer,
  Activity, Scale, Droplets, FileText, Pill, Save,
  FlaskConical, Plus,
} from 'lucide-react';
import { appointmentApi, labReportApi } from '@/lib/api';
import { formatDateTime, getStatusColor, cn, formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import Link from 'next/link';

export default function AppointmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [appointment, setAppointment] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Clinical form state
  const [notes, setNotes] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [vitals, setVitals] = useState({
    bloodPressureSystolic: '',
    bloodPressureDiastolic: '',
    heartRate: '',
    temperature: '',
    weight: '',
    oxygenSaturation: '',
  });
  const [prescription, setPrescription] = useState<any[]>([
    { drugName: '', dosage: '', frequency: '', duration: '', instructions: '' },
  ]);

  // Lab order state
  const [showLabForm, setShowLabForm] = useState(false);
  const [labTest, setLabTest] = useState({ testType: '', testCategory: 'PATHOLOGY', notes: '' });

  useEffect(() => {
    loadAppointment();
  }, [id]);

  const loadAppointment = async () => {
    try {
      const { data } = await appointmentApi.getById(id);
      const apt = data.data;
      setAppointment(apt);

      if (apt.notes) setNotes(apt.notes);
      if (apt.diagnosis) setDiagnosis(apt.diagnosis);
      if (apt.vitals) {
        setVitals({
          bloodPressureSystolic: String(apt.vitals.bloodPressureSystolic || ''),
          bloodPressureDiastolic: String(apt.vitals.bloodPressureDiastolic || ''),
          heartRate: String(apt.vitals.heartRate || ''),
          temperature: String(apt.vitals.temperature || ''),
          weight: String(apt.vitals.weight || ''),
          oxygenSaturation: String(apt.vitals.oxygenSaturation || ''),
        });
      }
      if (apt.prescription?.length) setPrescription(apt.prescription);
    } catch {
      toast.error('Failed to load appointment');
    } finally {
      setIsLoading(false);
    }
  };

  const saveClinicalNotes = async () => {
    setIsSaving(true);
    try {
      const vitalsData: any = {};
      Object.entries(vitals).forEach(([k, v]) => {
        if (v) vitalsData[k] = parseFloat(v);
      });

      const validPrescription = prescription.filter((p) => p.drugName.trim());

      await appointmentApi.addClinicalNotes(id, {
        notes,
        diagnosis,
        vitals: Object.keys(vitalsData).length > 0 ? vitalsData : undefined,
        prescription: validPrescription.length > 0 ? validPrescription : undefined,
      });

      toast.success('Clinical notes saved');
      loadAppointment();
    } catch {
      toast.error('Failed to save notes');
    } finally {
      setIsSaving(false);
    }
  };

  const createLabOrder = async () => {
    if (!labTest.testType.trim()) {
      toast.error('Please enter a test type');
      return;
    }
    try {
      await labReportApi.create({
        appointmentId: id,
        patientId: appointment.patientId,
        testType: labTest.testType,
        testCategory: labTest.testCategory,
        notes: labTest.notes,
      });
      toast.success('Lab order created');
      setLabTest({ testType: '', testCategory: 'PATHOLOGY', notes: '' });
      setShowLabForm(false);
      loadAppointment();
    } catch {
      toast.error('Failed to create lab order');
    }
  };

  const addPrescriptionRow = () => {
    setPrescription([
      ...prescription,
      { drugName: '', dosage: '', frequency: '', duration: '', instructions: '' },
    ]);
  };

  const updatePrescription = (index: number, field: string, value: string) => {
    const updated = [...prescription];
    updated[index] = { ...updated[index], [field]: value };
    setPrescription(updated);
  };

  const removePrescriptionRow = (index: number) => {
    setPrescription(prescription.filter((_, i) => i !== index));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!appointment) return null;

  const patient = appointment.patient;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 hover:bg-neutral-bg rounded-xl transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold">Patient Consultation</h1>
          <p className="text-neutral-muted">
            {formatDateTime(appointment.slotStart)} · {appointment.department.replace('_', ' ')}
          </p>
        </div>
        <span className={cn('ml-auto px-4 py-1.5 rounded-full text-sm font-medium', getStatusColor(appointment.status))}>
          {appointment.status}
        </span>
      </div>

      {/* Patient Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="stat-card"
      >
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary-100 flex items-center justify-center text-xl font-bold text-primary-500">
            {patient?.user?.firstName?.[0]}{patient?.user?.lastName?.[0]}
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold">
              {patient?.user?.firstName} {patient?.user?.lastName}
            </h2>
            <p className="text-neutral-muted text-sm">
              MRN: {patient?.mrn} · {patient?.gender} · Blood: {patient?.bloodGroup || 'N/A'}
            </p>
            {patient?.allergies?.length > 0 && (
              <p className="text-danger-500 text-sm font-medium mt-1">
                ⚠️ Allergies: {patient.allergies.join(', ')}
              </p>
            )}
          </div>
          <div className="text-right text-sm text-neutral-muted">
            <p>Chief Complaint:</p>
            <p className="font-medium text-neutral-text">{appointment.chiefComplaint || 'Not specified'}</p>
          </div>
        </div>
      </motion.div>

      {/* Vitals Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="stat-card"
      >
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary-500" /> Vitals
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: 'BP Systolic', key: 'bloodPressureSystolic', unit: 'mmHg', icon: Heart },
            { label: 'BP Diastolic', key: 'bloodPressureDiastolic', unit: 'mmHg', icon: Heart },
            { label: 'Heart Rate', key: 'heartRate', unit: 'bpm', icon: Activity },
            { label: 'Temperature', key: 'temperature', unit: '°F', icon: Thermometer },
            { label: 'Weight', key: 'weight', unit: 'lbs', icon: Scale },
            { label: 'SpO2', key: 'oxygenSaturation', unit: '%', icon: Droplets },
          ].map((v) => (
            <div key={v.key}>
              <label className="text-xs text-neutral-muted block mb-1">{v.label}</label>
              <div className="relative">
                <input
                  type="number"
                  value={(vitals as any)[v.key]}
                  onChange={(e) => setVitals({ ...vitals, [v.key]: e.target.value })}
                  className="input-field text-sm pr-10"
                  placeholder="—"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-muted">{v.unit}</span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Notes & Diagnosis */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="stat-card"
      >
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary-500" /> Clinical Notes
        </h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1">Consultation Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="input-field resize-none"
              placeholder="Document consultation findings, examination results, observations..."
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Diagnosis</label>
            <textarea
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              rows={2}
              className="input-field resize-none"
              placeholder="Enter diagnosis (ICD-10 codes recommended)..."
            />
          </div>
        </div>
      </motion.div>

      {/* Prescription */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="stat-card"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Pill className="w-5 h-5 text-primary-500" /> Prescription
          </h3>
          <button onClick={addPrescriptionRow} className="text-primary-500 text-sm font-medium flex items-center gap-1">
            <Plus className="w-4 h-4" /> Add Drug
          </button>
        </div>

        <div className="space-y-3">
          {prescription.map((rx, i) => (
            <div key={i} className="grid grid-cols-12 gap-3 items-end">
              <div className="col-span-3">
                {i === 0 && <label className="text-xs text-neutral-muted block mb-1">Drug Name</label>}
                <input
                  value={rx.drugName}
                  onChange={(e) => updatePrescription(i, 'drugName', e.target.value)}
                  className="input-field text-sm"
                  placeholder="Drug name"
                />
              </div>
              <div className="col-span-2">
                {i === 0 && <label className="text-xs text-neutral-muted block mb-1">Dosage</label>}
                <input
                  value={rx.dosage}
                  onChange={(e) => updatePrescription(i, 'dosage', e.target.value)}
                  className="input-field text-sm"
                  placeholder="e.g., 500mg"
                />
              </div>
              <div className="col-span-2">
                {i === 0 && <label className="text-xs text-neutral-muted block mb-1">Frequency</label>}
                <input
                  value={rx.frequency}
                  onChange={(e) => updatePrescription(i, 'frequency', e.target.value)}
                  className="input-field text-sm"
                  placeholder="e.g., Twice daily"
                />
              </div>
              <div className="col-span-2">
                {i === 0 && <label className="text-xs text-neutral-muted block mb-1">Duration</label>}
                <input
                  value={rx.duration}
                  onChange={(e) => updatePrescription(i, 'duration', e.target.value)}
                  className="input-field text-sm"
                  placeholder="e.g., 7 days"
                />
              </div>
              <div className="col-span-2">
                {i === 0 && <label className="text-xs text-neutral-muted block mb-1">Instructions</label>}
                <input
                  value={rx.instructions}
                  onChange={(e) => updatePrescription(i, 'instructions', e.target.value)}
                  className="input-field text-sm"
                  placeholder="e.g., After food"
                />
              </div>
              <div className="col-span-1">
                {prescription.length > 1 && (
                  <button
                    onClick={() => removePrescriptionRow(i)}
                    className="p-2 text-danger-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Lab Orders */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="stat-card"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-primary-500" /> Lab Orders
          </h3>
          <button
            onClick={() => setShowLabForm(!showLabForm)}
            className="text-primary-500 text-sm font-medium flex items-center gap-1"
          >
            <Plus className="w-4 h-4" /> New Order
          </button>
        </div>

        {showLabForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-4 p-4 bg-neutral-bg rounded-xl space-y-3"
          >
            <div className="grid grid-cols-3 gap-3">
              <input
                value={labTest.testType}
                onChange={(e) => setLabTest({ ...labTest, testType: e.target.value })}
                className="input-field text-sm"
                placeholder="Test type (e.g., CBC, X-Ray Chest)"
              />
              <select
                value={labTest.testCategory}
                onChange={(e) => setLabTest({ ...labTest, testCategory: e.target.value })}
                className="input-field text-sm"
              >
                <option value="PATHOLOGY">Pathology</option>
                <option value="RADIOLOGY">Radiology</option>
                <option value="MICROBIOLOGY">Microbiology</option>
              </select>
              <input
                value={labTest.notes}
                onChange={(e) => setLabTest({ ...labTest, notes: e.target.value })}
                className="input-field text-sm"
                placeholder="Notes (optional)"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={createLabOrder} className="btn-primary text-sm py-2">
                Create Order
              </button>
              <button onClick={() => setShowLabForm(false)} className="btn-secondary text-sm py-2">
                Cancel
              </button>
            </div>
          </motion.div>
        )}

        {/* Existing lab reports */}
        {appointment.labReports?.length > 0 ? (
          <div className="space-y-2">
            {appointment.labReports.map((report: any) => (
              <div key={report.id} className="flex items-center justify-between p-3 bg-neutral-bg rounded-xl">
                <div>
                  <p className="font-medium text-sm">{report.testType}</p>
                  <p className="text-xs text-neutral-muted">{report.testCategory}</p>
                </div>
                <span className={cn('px-3 py-1 rounded-full text-xs font-medium', getStatusColor(report.status))}>
                  {report.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-neutral-muted text-sm">No lab orders for this appointment</p>
        )}
      </motion.div>

      {/* Save Button */}
      <div className="flex justify-end gap-3 pb-8">
        <button onClick={() => router.back()} className="btn-secondary">
          Cancel
        </button>
        <button onClick={saveClinicalNotes} disabled={isSaving} className="btn-primary flex items-center gap-2">
          {isSaving ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Save Clinical Notes
        </button>
      </div>
    </div>
  );
}