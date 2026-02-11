'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/dashboard/Sidebar';
import DashboardHeader from '@/components/dashboard/Header';
import { useAuthStore } from '@/store/auth.store';

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated, loadProfile } = useAuthStore();
  const router = useRouter();

  useEffect(() => { loadProfile(); }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/login');
    if (!isLoading && isAuthenticated && user?.role !== 'DOCTOR') {
      router.push(`/${user?.role?.toLowerCase()}`);
    }
  }, [isLoading, isAuthenticated, user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-neutral-bg">
      <Sidebar />
      <div className="ml-[280px]">
        <DashboardHeader />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}