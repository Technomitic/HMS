'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Users,
  DollarSign,
  FlaskConical,
  BedDouble,
  TrendingUp,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import StatsCard from '@/components/dashboard/StatsCard';
import { dashboardApi } from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { toast } from 'sonner';

const DEPT_COLORS = ['#2563EB', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6'];

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { data } = await dashboardApi.admin();
      setStats(data.data);
    } catch (err) {
      toast.error('Failed to load dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  const revenueData = stats.revenueByDay?.map((d: any) => ({
    date: d.date.slice(5),
    amount: d.amountCents / 100,
  })) || [];

  const deptData = Object.entries(stats.appointmentsByDepartment || {}).map(
    ([name, count], i) => ({
      name: name.replace('_', ' '),
      value: count as number,
      color: DEPT_COLORS[i % DEPT_COLORS.length],
    }),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-neutral-muted">Overview of today&apos;s hospital operations</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard
          title="Today's Appointments"
          value={stats.todayAppointments}
          icon={Calendar}
          iconColor="text-primary-500"
          iconBg="bg-primary-50"
          index={0}
        />
        <StatsCard
          title="Total Patients"
          value={stats.totalPatients.toLocaleString()}
          icon={Users}
          iconColor="text-accent-500"
          iconBg="bg-accent-50"
          index={1}
        />
        <StatsCard
          title="Today's Revenue"
          value={formatCurrency(stats.todayRevenueCents)}
          icon={DollarSign}
          iconColor="text-success-500"
          iconBg="bg-green-50"
          change="+12% from yesterday"
          changeType="positive"
          index={2}
        />
        <StatsCard
          title="Pending Lab Reports"
          value={stats.pendingLabReports}
          icon={FlaskConical}
          iconColor="text-warning-500"
          iconBg="bg-yellow-50"
          index={3}
        />
        <StatsCard
          title="Active IPD"
          value={stats.activeIPD}
          icon={BedDouble}
          iconColor="text-purple-500"
          iconBg="bg-purple-50"
          change={`${stats.occupancyRate}% occupancy`}
          changeType="neutral"
          index={4}
        />
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 stat-card"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-semibold text-lg">Revenue (7 Days)</h2>
            <TrendingUp className="w-5 h-5 text-success-500" />
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="date" stroke="#64748B" fontSize={12} />
              <YAxis stroke="#64748B" fontSize={12} tickFormatter={(v) => `$${v}`} />
              <Tooltip
                formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']}
                contentStyle={{
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                }}
              />
              <Bar dataKey="amount" fill="#2563EB" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Department Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="stat-card"
        >
          <h2 className="font-semibold text-lg mb-6">Appointments by Dept</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={deptData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                dataKey="value"
                paddingAngle={4}
              >
                {deptData.map((entry: any, i: number) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-4">
            {deptData.slice(0, 5).map((dept: any) => (
              <div key={dept.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: dept.color }} />
                  <span className="capitalize text-neutral-muted">{dept.name}</span>
                </div>
                <span className="font-medium">{dept.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="stat-card"
      >
        <h2 className="font-semibold text-lg mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {stats.recentActivity?.slice(0, 10).map((activity: any) => (
            <div
              key={activity.id}
              className="flex items-center justify-between py-3 border-b border-neutral-border last:border-0"
            >
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-primary-500" />
                <span className="text-sm">{activity.message}</span>
              </div>
              <span className="text-xs text-neutral-muted whitespace-nowrap">
                {formatDateTime(activity.timestamp)}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}