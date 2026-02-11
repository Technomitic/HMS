'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Activity,
  LayoutDashboard,
  Calendar,
  Users,
  FileText,
  CreditCard,
  Bell,
  Settings,
  LogOut,
  ClipboardList,
  Stethoscope,
  UserCircle,
  Pill,
  ScrollText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';

interface SidebarLink {
  label: string;
  href: string;
  icon: React.ElementType;
}

const adminLinks: SidebarLink[] = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Appointments', href: '/admin/appointments', icon: Calendar },
  { label: 'Patients', href: '/admin/patients', icon: Users },
  { label: 'Doctors', href: '/admin/doctors', icon: Stethoscope },
  { label: 'Lab Reports', href: '/admin/lab-reports', icon: FileText },
  { label: 'Billing', href: '/admin/billing', icon: CreditCard },
  { label: 'Audit Logs', href: '/admin/audit', icon: ScrollText },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
];

const doctorLinks: SidebarLink[] = [
  { label: 'Dashboard', href: '/doctor', icon: LayoutDashboard },
  { label: 'Schedule', href: '/doctor/schedule', icon: Calendar },
  { label: 'My Patients', href: '/doctor/patients', icon: Users },
  { label: 'Lab Orders', href: '/doctor/lab-orders', icon: ClipboardList },
  { label: 'Prescriptions', href: '/doctor/prescriptions', icon: Pill },
  { label: 'Settings', href: '/doctor/settings', icon: Settings },
];

const patientLinks: SidebarLink[] = [
  { label: 'Dashboard', href: '/patient', icon: LayoutDashboard },
  { label: 'Appointments', href: '/patient/appointments', icon: Calendar },
  { label: 'Lab Reports', href: '/patient/lab-reports', icon: FileText },
  { label: 'Billing', href: '/patient/billing', icon: CreditCard },
  { label: 'Prescriptions', href: '/patient/prescriptions', icon: Pill },
  { label: 'Profile', href: '/patient/profile', icon: UserCircle },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  const links =
    user?.role === 'ADMIN'
      ? adminLinks
      : user?.role === 'DOCTOR'
        ? doctorLinks
        : patientLinks;

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  return (
    <motion.aside
      initial={{ x: -280 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="w-[280px] h-screen bg-white border-r border-neutral-border flex flex-col fixed left-0 top-0 z-40"
    >
      {/* Logo */}
      <div className="p-6 border-b border-neutral-border">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold gradient-text">Medix</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                isActive ? 'sidebar-link-active' : 'sidebar-link',
              )}
            >
              <link.icon className="w-5 h-5" />
              <span className="font-medium">{link.label}</span>
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-xl gradient-primary opacity-100"
                  style={{ zIndex: -1 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-neutral-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-white font-semibold text-sm">
            {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-neutral-muted capitalize">
              {user?.role?.toLowerCase().replace('_', ' ')}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-danger-500 hover:bg-red-50 rounded-xl transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </motion.aside>
  );
}