'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Activity } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { cn } from '@/lib/utils';

const linksByRole: Record<string, { label: string; href: string }[]> = {
  ADMIN: [
    { label: 'Dashboard', href: '/admin' },
    { label: 'Appointments', href: '/admin/appointments' },
    { label: 'Patients', href: '/admin/patients' },
    { label: 'Doctors', href: '/admin/doctors' },
    { label: 'Lab Reports', href: '/admin/lab-reports' },
    { label: 'Billing', href: '/admin/billing' },
    { label: 'Audit Logs', href: '/admin/audit' },
    { label: 'Settings', href: '/admin/settings' },
  ],
  DOCTOR: [
    { label: 'Dashboard', href: '/doctor' },
    { label: 'Schedule', href: '/doctor/schedule' },
    { label: 'My Patients', href: '/doctor/patients' },
    { label: 'Lab Orders', href: '/doctor/lab-orders' },
  ],
  PATIENT: [
    { label: 'Dashboard', href: '/patient' },
    { label: 'Appointments', href: '/patient/appointments' },
    { label: 'Lab Reports', href: '/patient/lab-reports' },
    { label: 'Billing', href: '/patient/billing' },
    { label: 'Profile', href: '/patient/profile' },
  ],
};

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const links = linksByRole[user?.role || 'PATIENT'] || [];

  return (
    <div className="lg:hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-neutral-bg rounded-xl"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-16 left-0 right-0 bg-white border-b border-neutral-border shadow-xl z-50"
          >
            <div className="p-4 space-y-1">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    'block px-4 py-3 rounded-xl font-medium transition-colors',
                    pathname === link.href
                      ? 'bg-primary-500 text-white'
                      : 'text-neutral-muted hover:bg-neutral-bg',
                  )}
                >
                  {link.label}
                </Link>
              ))}

              <hr className="my-2" />

              <button
                onClick={async () => {
                  await logout();
                  window.location.href = '/login';
                }}
                className="block w-full text-left px-4 py-3 rounded-xl text-danger-500 hover:bg-red-50"
              >
                Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}