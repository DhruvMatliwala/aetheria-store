import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'brand' | 'success' | 'warning' | 'error' | 'neutral';
  className?: string;
}

export function Badge({ children, variant = 'brand', className }: BadgeProps) {
  const variants = {
    brand:   'bg-brand-900/60 text-brand-300 border-brand-700/50',
    success: 'bg-emerald-900/60 text-emerald-300 border-emerald-700/50',
    warning: 'bg-amber-900/60 text-amber-300 border-amber-700/50',
    error:   'bg-red-900/60 text-red-300 border-red-700/50',
    neutral: 'bg-surface-700 text-gray-300 border-surface-600',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
