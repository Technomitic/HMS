'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Calendar, Clock, ChevronLeft, ChevronRight,
  Star, MapPin, ArrowRight, Check, Activity,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { doctorApi, appointmentApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { cn, formatDate, formatTime } from '@/lib/utils';
import { toast } from 'sonner';

type Step = 'department' | 'doctor' | 'slot' | 'confirm';

const departments = [
  { id: 'CARDIOLOGY', name: 'Cardiology', icon: '❤️' },
  { id: 'NEUROLOGY', name: 'Neurology', icon: '🧠' },
  { id: 'ORTHOPEDICS', name: 'Orthopedics', icon: '🦴' },
  { id: 'PEDIATRICS', name: 'Pediatrics', icon: '👶' },
  { id: 'DERMATOLOGY', name: 'Dermatology', icon: '🧴' },
  { id: 'GENERAL_MEDICINE', name: 'General Medicine', icon: '🩺' },
  { id: 'EMERGENCY', name: 'Emergency', icon: '🚑' },
  { id: 'OPHTHALMOLOGY', name: 'Ophthalmology', icon: '👁️' },
];

export default function BookAppointmentPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  const [step, setStep] = useState<Step>('department');
  const [selectedDept, setSelectedDept] = useState('');
  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState(getNextWeekday());
  const [slots, setSlots] = useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isBooking, setIsBooking] = useState(false);

  function getNextWeekday() {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }

  useEffect(() => {
    if (selectedDept) loadDoctors();
  }, [selectedDept]);

  useEffect(() => {
    if (selectedDoctor && selectedDate) loadSlots();
  }, [selectedDoctor, selectedDate]);

  const loadDoctors = async () => {
    setIsLoading(true);
    try {
      const { data } = await doctorApi.getAll({ department: selectedDept, limit: 20 });
      setDoctors(data.data);
    } catch {
      toast.error('Failed to load doctors');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSlots = async () => {
    try {
      const { data } = await appointmentApi.getSlots(selectedDoctor.user.id, selectedDate);
      setSlots(data.data);
    } catch {
      toast.error('Failed to load slots');
    }
  };

  const handleBook = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to book an appointment');
      router.push('/login');
      return;
    }

    setIsBooking(true);
    try {
      await appointmentApi.create({
        doctorId: selectedDoctor.user.id,
        department: selectedDept,
        slotStart: selectedSlot.start,
        slotEnd: selectedSlot.end,
        chiefComplaint,
      });
      toast.success('Appointment booked successfully!');
      router.push('/patient');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Booking failed');
    } finally {
      setIsBooking(false);
    }
  };

  const stepIndex = ['department', 'doctor', 'slot', 'confirm'].indexOf(step);

  return (
    <div className="min-h-screen bg-neutral-bg">
      {/* Header */}
      <nav className="bg-white border-b border-neutral-border">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">Medix</span>
          </Link>
          <Link href="/login" className="btn-secondary text-sm py-2 px-4">
            Sign In
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Progress Bar */}
        <div className="flex items-center justify-center mb-10">
          {['Department', 'Doctor', 'Time Slot', 'Confirm'].map((label, i) => (
            <div key={label} className="flex items-center">
              <div className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all',
                i <= stepIndex
                  ? 'gradient-primary text-white'
                  : 'bg-neutral-bg text-neutral-muted border border-neutral-border'
              )}>
                {i < stepIndex ? <Check className="w-5 h-5" /> : i + 1}
              </div>
              <span className={cn(
                'ml-2 text-sm font-medium hidden sm:block',
                i <= stepIndex ? 'text-primary-500' : 'text-neutral-muted'
              )}>
                {label}
              </span>
              {i < 3 && <div className={cn(
                'w-12 h-0.5 mx-3',
                i < stepIndex ? 'bg-primary-500' : 'bg-neutral-border'
              )} />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Department */}
          {step === 'department' && (
            <motion.div
              key="department"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center">
                <h1 className="text-3xl font-bold">Select Department</h1>
                <p className="text-neutral-muted mt-2">Choose the medical specialty you need</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {departments.map((dept) => (
                  <motion.button
                    key={dept.id}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      setSelectedDept(dept.id);
                      setStep('doctor');
                    }}
                    className={cn(
                      'p-6 rounded-2xl border-2 text-center transition-all',
                      selectedDept === dept.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-neutral-border bg-white hover:border-primary-300'
                    )}
                  >
                    <div className="text-4xl mb-3">{dept.icon}</div>
                    <p className="font-semibold text-sm">{dept.name}</p>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 2: Doctor */}
          {step === 'doctor' && (
            <motion.div
              key="doctor"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-4">
                <button onClick={() => setStep('department')} className="p-2 hover:bg-neutral-bg rounded-xl">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-3xl font-bold">Choose Doctor</h1>
                  <p className="text-neutral-muted">Select from our {selectedDept.replace('_', ' ').toLowerCase()} specialists</p>
                </div>
              </div>

              {isLoading ? (
                <div className="flex justify-center py-12">
                  <div className="w-10 h-10 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
                </div>
              ) : (
                <div className="space-y-4">
                  {doctors.map((doc) => (
                    <motion.button
                      key={doc.id}
                      whileHover={{ scale: 1.01 }}
                      onClick={() => {
                        setSelectedDoctor(doc);
                        setStep('slot');
                      }}
                      className="w-full text-left p-5 bg-white rounded-2xl border border-neutral-border hover:border-primary-300 hover:shadow-md transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-primary-100 flex items-center justify-center text-xl font-bold text-primary-500">
                          {doc.user.firstName[0]}{doc.user.lastName[0]}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">
                            Dr. {doc.user.firstName} {doc.user.lastName}
                          </h3>
                          <p className="text-neutral-muted text-sm">{doc.specialization}</p>
                          <div className="flex items-center gap-4 mt-1 text-sm">
                            <span className="flex items-center gap-1 text-yellow-500">
                              <Star className="w-4 h-4 fill-current" /> 4.8
                            </span>
                            <span className="text-neutral-muted">{doc.experienceYears} yrs experience</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-primary-500">
                            ${(doc.consultationFee / 100).toFixed(0)}
                          </p>
                          <p className="text-xs text-neutral-muted">per visit</p>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                  {doctors.length === 0 && (
                    <p className="text-center py-12 text-neutral-muted">No doctors available in this department</p>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* Step 3: Time Slot */}
          {step === 'slot' && (
            <motion.div
              key="slot"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-4">
                <button onClick={() => setStep('doctor')} className="p-2 hover:bg-neutral-bg rounded-xl">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-3xl font-bold">Select Time</h1>
                  <p className="text-neutral-muted">
                    Dr. {selectedDoctor?.user.firstName} {selectedDoctor?.user.lastName}
                  </p>
                </div>
              </div>

              {/* Date Picker */}
              <div>
                <label className="text-sm font-medium block mb-2">Choose Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setSelectedSlot(null);
                  }}
                  className="input-field max-w-xs"
                />
              </div>

              {/* Time Slots Grid */}
              <div>
                <p className="text-sm font-medium mb-3">Available Slots for {formatDate(selectedDate)}</p>
                <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                  {slots.map((slot, i) => (
                    <button
                      key={i}
                      disabled={!slot.available}
                      onClick={() => setSelectedSlot(slot)}
                      className={cn(
                        'p-3 rounded-xl text-sm font-medium transition-all text-center',
                        !slot.available
                          ? 'bg-neutral-bg text-neutral-disabled cursor-not-allowed line-through'
                          : selectedSlot?.start === slot.start
                            ? 'gradient-primary text-white shadow-md'
                            : 'bg-white border border-neutral-border hover:border-primary-500 hover:text-primary-500'
                      )}
                    >
                      {formatTime(slot.start)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chief Complaint */}
              <div>
                <label className="text-sm font-medium block mb-2">Reason for Visit (optional)</label>
                <textarea
                  value={chiefComplaint}
                  onChange={(e) => setChiefComplaint(e.target.value)}
                  rows={3}
                  className="input-field resize-none"
                  placeholder="Briefly describe your symptoms or reason for consultation..."
                />
              </div>

              <div className="flex justify-end">
                <button
                  disabled={!selectedSlot}
                  onClick={() => setStep('confirm')}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 4: Confirm */}
          {step === 'confirm' && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-4">
                <button onClick={() => setStep('slot')} className="p-2 hover:bg-neutral-bg rounded-xl">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h1 className="text-3xl font-bold">Confirm Booking</h1>
              </div>

              <div className="stat-card space-y-6">
                <div className="flex items-center gap-4 pb-4 border-b border-neutral-border">
                  <div className="w-16 h-16 rounded-2xl bg-primary-100 flex items-center justify-center text-xl font-bold text-primary-500">
                    {selectedDoctor?.user.firstName[0]}{selectedDoctor?.user.lastName[0]}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">
                      Dr. {selectedDoctor?.user.firstName} {selectedDoctor?.user.lastName}
                    </h2>
                    <p className="text-neutral-muted">{selectedDoctor?.specialization}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-neutral-muted">Department</p>
                    <p className="font-medium">{selectedDept.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-muted">Date</p>
                    <p className="font-medium">{formatDate(selectedDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-muted">Time</p>
                    <p className="font-medium">{formatTime(selectedSlot?.start)} - {formatTime(selectedSlot?.end)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-muted">Consultation Fee</p>
                    <p className="font-medium text-primary-500">
                      ${(selectedDoctor?.consultationFee / 100).toFixed(0)}
                    </p>
                  </div>
                </div>

                {chiefComplaint && (
                  <div className="pt-4 border-t border-neutral-border">
                    <p className="text-sm text-neutral-muted">Reason for Visit</p>
                    <p className="font-medium">{chiefComplaint}</p>
                  </div>
                )}

                <button
                  onClick={handleBook}
                  disabled={isBooking}
                  className="btn-primary w-full flex items-center justify-center gap-2 text-lg py-4"
                >
                  {isBooking ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Check className="w-5 h-5" /> Confirm Appointment
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}