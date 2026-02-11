import { cn, getInitials } from '@/lib/utils';

interface AvatarProps {
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeMap = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-base',
  xl: 'w-20 h-20 text-xl',
};

export default function Avatar({
  firstName = 'U',
  lastName = 'N',
  avatarUrl,
  size = 'md',
  className,
}: AvatarProps) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={`${firstName} ${lastName}`}
        className={cn('rounded-full object-cover', sizeMap[size], className)}
      />
    );
  }

  return (
    <div
      className={cn(
        'rounded-full bg-primary-100 flex items-center justify-center font-semibold text-primary-500',
        sizeMap[size],
        className,
      )}
    >
      {getInitials(firstName, lastName)}
    </div>
  );
}