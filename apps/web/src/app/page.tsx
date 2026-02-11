'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Heart,
  Calendar,
  FileText,
  Shield,
  Star,
  ArrowRight,
  Phone,
  Mail,
  MapPin,
  ChevronRight,
  Activity,
  Stethoscope,
  Brain,
  Bone,
  Baby,
  Eye,
  Zap,
  Microscope,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { doctorApi } from '@/lib/api';

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

const staggerChildren = {
  visible: { transition: { staggerChildren: 0.1 } },
};

const services = [
  { icon: Heart, name: 'Cardiology', color: 'text-red-500', bg: 'bg-red-50' },
  { icon: Brain, name: 'Neurology', color: 'text-purple-500', bg: 'bg-purple-50' },
  { icon: Bone, name: 'Orthopedics', color: 'text-blue-500', bg: 'bg-blue-50' },
  { icon: Baby, name: 'Pediatrics', color: 'text-pink-500', bg: 'bg-pink-50' },
  { icon: Eye, name: 'Ophthalmology', color: 'text-teal-500', bg: 'bg-teal-50' },
  { icon: Stethoscope, name: 'General Medicine', color: 'text-green-500', bg: 'bg-green-50' },
  { icon: Zap, name: 'Emergency', color: 'text-orange-500', bg: 'bg-orange-50' },
  { icon: Microscope, name: 'Pathology', color: 'text-indigo-500', bg: 'bg-indigo-50' },
];

const stats = [
  { value: '10,000+', label: 'Patients Served' },
  { value: '50+', label: 'Specialists' },
  { value: '99.2%', label: 'Success Rate' },
  { value: '24/7', label: 'Emergency Care' },
];

function HeartbeatLine() {
  return (
    <svg viewBox="0 0 600 100" className="w-full h-16 text-primary-500/20">
      <motion.path
        d="M0,50 L150,50 L170,20 L190,80 L210,35 L230,65 L250,50 L600,50"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 2, ease: 'easeInOut', repeat: Infinity }}
      />
    </svg>
  );
}

export default function HomePage() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });

  const heroY = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <div className="min-h-screen bg-neutral-bg">
      {/* ============ NAVIGATION ============ */}
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-neutral-border"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold gradient-text">Medix</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link href="#services" className="text-neutral-muted hover:text-primary-500 transition-colors font-medium">
              Services
            </Link>
            <Link href="#doctors" className="text-neutral-muted hover:text-primary-500 transition-colors font-medium">
              Doctors
            </Link>
            <Link href="#about" className="text-neutral-muted hover:text-primary-500 transition-colors font-medium">
              About
            </Link>
            <Link href="#contact" className="text-neutral-muted hover:text-primary-500 transition-colors font-medium">
              Contact
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login" className="btn-secondary text-sm py-2 px-4">
              Sign In
            </Link>
            <Link href="/book" className="btn-primary text-sm py-2 px-4">
              Book Appointment
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* ============ HERO SECTION ============ */}
      <section ref={heroRef} className="relative min-h-screen flex items-center pt-20 overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary-500/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-100/30 rounded-full blur-3xl" />
        </div>

        <motion.div
          className="relative max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center"
          style={{ y: heroY, opacity: heroOpacity }}
        >
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerChildren}
            className="space-y-8"
          >
            <motion.div variants={fadeInUp}>
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-500 rounded-full text-sm font-medium">
                <span className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
                Now accepting new patients
              </span>
            </motion.div>

            <motion.h1 variants={fadeInUp} className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
              Your Health,{' '}
              <span className="gradient-text">Digitally</span>{' '}
              Transformed
            </motion.h1>

            <motion.p variants={fadeInUp} className="text-xl text-neutral-muted max-w-lg">
              Book appointments, access records, and connect with world-class specialists — all from one platform.
            </motion.p>

            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4">
              <Link href="/book" className="btn-primary flex items-center justify-center gap-2 text-lg">
                Book Appointment
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="#services" className="btn-secondary flex items-center justify-center gap-2 text-lg">
                Explore Services
              </Link>
            </motion.div>

            <motion.div variants={fadeInUp}>
              <HeartbeatLine />
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: 50 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="hidden md:block"
          >
            <div className="relative">
              <div className="glass-card p-8 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-primary-100 flex items-center justify-center">
                    <Calendar className="w-8 h-8 text-primary-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-lg">Quick Appointment</p>
                    <p className="text-neutral-muted">Find a doctor in seconds</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-neutral-bg rounded-xl">
                    <Search className="w-5 h-5 text-neutral-muted" />
                    <span className="text-neutral-muted">Search specialists...</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {['Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics'].map((dept) => (
                      <motion.div
                        key={dept}
                        className="p-3 bg-neutral-bg rounded-xl text-center text-sm font-medium cursor-pointer hover:bg-primary-50 hover:text-primary-500 transition-all"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {dept}
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating notification card */}
              <motion.div
                className="absolute -bottom-6 -left-6 glass-card p-4 flex items-center gap-3"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <div className="w-10 h-10 rounded-full bg-success-500 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold">HIPAA Compliant</p>
                  <p className="text-xs text-neutral-muted">Your data is secure</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ============ STATS BAR ============ */}
      <section className="py-16 bg-white border-y border-neutral-border">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={staggerChildren}
          >
            {stats.map((stat) => (
              <motion.div key={stat.label} variants={fadeInUp} className="text-center">
                <p className="text-3xl md:text-4xl font-bold gradient-text">{stat.value}</p>
                <p className="text-neutral-muted mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ============ SERVICES ============ */}
      <section id="services" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <h2 className="text-4xl font-bold mb-4">Our Specialties</h2>
            <p className="text-xl text-neutral-muted max-w-2xl mx-auto">
              Comprehensive healthcare services delivered by world-class specialists
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerChildren}
          >
            {services.map((service) => (
              <motion.div
                key={service.name}
                variants={fadeInUp}
                whileHover={{ scale: 1.05, y: -5 }}
                className="stat-card text-center cursor-pointer group"
              >
                <div className={cn('w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center', service.bg)}>
                  <service.icon className={cn('w-8 h-8', service.color)} />
                </div>
                <h3 className="font-semibold text-lg group-hover:text-primary-500 transition-colors">
                  {service.name}
                </h3>
                <ChevronRight className="w-5 h-5 text-neutral-disabled mx-auto mt-2 group-hover:text-primary-500 transition-colors" />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ============ WHY CHOOSE US ============ */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            className="grid md:grid-cols-2 gap-16 items-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerChildren}
          >
            <motion.div variants={fadeInUp} className="space-y-8">
              <h2 className="text-4xl font-bold">
                Why Choose <span className="gradient-text">Medix</span>?
              </h2>

              {[
                { icon: Calendar, title: 'Instant Booking', desc: 'Book appointments online in under 30 seconds with real-time slot availability.' },
                { icon: FileText, title: 'Digital Records', desc: 'Access lab reports, prescriptions, and medical history securely from anywhere.' },
                { icon: Shield, title: 'Enterprise Security', desc: 'HIPAA-compliant infrastructure with end-to-end encryption for all patient data.' },
                { icon: Star, title: 'Top-Rated Doctors', desc: 'Connect with board-certified specialists across 10+ medical departments.' },
              ].map((item) => (
                <motion.div
                  key={item.title}
                  variants={fadeInUp}
                  className="flex gap-4 group"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center shrink-0 group-hover:bg-primary-500 transition-colors">
                    <item.icon className="w-6 h-6 text-primary-500 group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{item.title}</h3>
                    <p className="text-neutral-muted">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            <motion.div variants={fadeInUp} className="relative">
              <div className="glass-card p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Today&apos;s Schedule</h3>
                  <span className="text-sm text-neutral-muted">3 appointments</span>
                </div>
                {[
                  { time: '09:00 AM', patient: 'Jane Doe', type: 'Check-up', status: 'Completed' },
                  { time: '10:30 AM', patient: 'John Smith', type: 'Follow-up', status: 'In Progress' },
                  { time: '02:00 PM', patient: 'Maria Garcia', type: 'Consultation', status: 'Upcoming' },
                ].map((apt, i) => (
                  <motion.div
                    key={apt.patient}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.15 }}
                    viewport={{ once: true }}
                    className="flex items-center justify-between p-3 bg-neutral-bg rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-sm font-semibold text-primary-500">
                        {apt.patient.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{apt.patient}</p>
                        <p className="text-xs text-neutral-muted">{apt.type}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{apt.time}</p>
                      <p className={cn(
                        'text-xs font-medium',
                        apt.status === 'Completed' ? 'text-success-500' :
                        apt.status === 'In Progress' ? 'text-warning-500' : 'text-primary-500'
                      )}>{apt.status}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            className="relative gradient-primary rounded-3xl p-12 md:p-16 text-center text-white overflow-hidden"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
            <div className="relative">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Ready to Get Started?
              </h2>
              <p className="text-xl text-white/80 max-w-2xl mx-auto mb-8">
                Join thousands of patients who have transformed their healthcare experience with Medix.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/register"
                  className="px-8 py-4 bg-white text-primary-500 font-semibold rounded-xl hover:bg-gray-100 transition-all text-lg"
                >
                  Create Account
                </Link>
                <Link
                  href="/book"
                  className="px-8 py-4 border-2 border-white text-white font-semibold rounded-xl hover:bg-white/10 transition-all text-lg"
                >
                  Book Appointment
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer id="contact" className="bg-neutral-text text-white py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold">Medix</span>
              </div>
              <p className="text-gray-400">
                State-of-the-art digital hospital platform delivering exceptional healthcare through technology.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-lg mb-4">Quick Links</h4>
              <div className="space-y-2">
                {['About Us', 'Services', 'Doctors', 'Careers', 'Blog'].map((link) => (
                  <p key={link}><Link href="#" className="text-gray-400 hover:text-white transition-colors">{link}</Link></p>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-lg mb-4">Services</h4>
              <div className="space-y-2">
                {['Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'Emergency Care'].map((s) => (
                  <p key={s}><Link href="#" className="text-gray-400 hover:text-white transition-colors">{s}</Link></p>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-lg mb-4">Contact</h4>
              <div className="space-y-3">
                <p className="flex items-center gap-2 text-gray-400">
                  <Phone className="w-4 h-4" /> +1 (555) 123-4567
                </p>
                <p className="flex items-center gap-2 text-gray-400">
                  <Mail className="w-4 h-4" /> hello@medix.hospital
                </p>
                <p className="flex items-center gap-2 text-gray-400">
                  <MapPin className="w-4 h-4" /> 123 Healthcare Ave, NY 10001
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-700 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">© 2024 Medix Digital Hospital. All rights reserved.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <Link href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Privacy Policy</Link>
              <Link href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Terms of Service</Link>
              <Link href="#" className="text-gray-400 hover:text-white text-sm transition-colors">HIPAA Notice</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}