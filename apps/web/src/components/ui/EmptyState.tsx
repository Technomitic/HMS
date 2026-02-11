import { LucideIcon } from 'lucide-react';
import Link from 'next/link';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
}: EmptyStateProps) {
  return (
    <div className="text-center py-16">
      <Icon className="w-16 h-16 text-neutral-disabled mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-neutral-text mb-1">{title}</h3>
      {description && <p className="text-neutral-muted mb-4">{description}</p>}
      {actionLabel && actionHref && (
        <Link href={actionHref} className="btn-primary inline-block">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}