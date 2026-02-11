'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  index?: number;
}

export default function StatsCard({
  title,
  value,
  change,
  changeType = 'neutral',
  icon: Icon,
  iconColor = 'text-primary-500',
  iconBg = 'bg-primary-50',
  index = 0,
}: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      whileHover={{ y: -2, shadow: 'lg' }}
      className="stat-card"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-neutral-muted font-medium">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
          {change && (
            <p
              className={cn(
                'text-sm mt-1 font-medium',
                changeType === 'positive' && 'text-success-500',
                changeType === 'negative' && 'text-danger-500',
                changeType === 'neutral' && 'text-neutral-muted',
              )}
            >
              {change}
            </p>
          )}
        </div>
        <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center', iconBg)}>
          <Icon className={cn('w-6 h-6', iconColor)} />
        </div>
      </div>
    </motion.div>
  );
}