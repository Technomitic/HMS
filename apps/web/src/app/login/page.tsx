'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Activity, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { toast } from 'sonner';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password);
      const user = useAuthStore.getState().user;
      toast.success(`Welcome back, ${user?.firstName}!`);

      switch (user?.role) {
        case 'ADMIN':
          router.push('/admin');
          break;
        case 'DOCTOR':
          router.push('/doctor');
          break;
        case 'PATIENT':
          router.push('/patient');
          break;
        default:
          router.push('/admin');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 gradient-primary relative items-center justify-center p-12">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="relative text-white space-y-8 max-w-md"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Activity className="w-7 h-7" />
            </div>
            <span className="text-3xl font-bold">Medix</span>
          </div>
          <h1 className="text-4xl font-bold leading-tight">
            Welcome to the future of healthcare management
          </h1>
          <p className="text-white/70 text-lg">
            Access your complete hospital dashboard — appointments, records, billing, and more.
          </p>

          <div className="space-y-3 pt-4">
            <div className="flex items-center gap-3 bg-white/10 rounded-xl p-4">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-sm font-bold">A</div>
              <div>
                <p className="font-medium text-sm">Admin: admin@medix.hospital</p>
                <p className="text-white/50 text-xs">Full platform access</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white/10 rounded-xl p-4">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-sm font-bold">D</div>
              <div>
                <p className="font-medium text-sm">Doctor: dr.lee@medix.hospital</p>
                <p className="text-white/50 text-xs">Clinical dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white/10 rounded-xl p-4">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-sm font-bold">P</div>
              <div>
                <p className="font-medium text-sm">Patient: jane.doe@demo.com</p>
                <p className="text-white/50 text-xs">Patient portal</p>
              </div>
            </div>
            <p className="text-white/50 text-sm text-center">Password for all: Demo@2024!</p>
          </div>
        </motion.div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md space-y-8"
        >
          <div className="lg:hidden flex items-center gap-2 justify-center mb-6">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold gradient-text">Medix</span>
          </div>

          <div>
            <h2 className="text-3xl font-bold">Sign In</h2>
            <p className="text-neutral-muted mt-2">Access your hospital dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-muted" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-11"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-muted" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-11 pr-11"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-muted hover:text-neutral-text"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign In <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-neutral-muted">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-primary-500 font-semibold hover:underline">
              Sign Up
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}