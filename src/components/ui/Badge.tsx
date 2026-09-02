import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'brand' | 'success' | 'warning' | 'error' | 'neutral';
  className?: string;
}

export function Badge({ children, variant = 'brand', className }: BadgeProps) {
  const variants = {
    brand:   'bg-cyan-950/60 text-cyan-300 border-cyan-700/50',
    success: 'bg-emerald-950/60 text-emerald-300 border-emerald-700/50',
    warning: 'bg-cyan-950/60 text-cyan-300 border-cyan-700/50',
    error:   'bg-rose-950/60 text-rose-300 border-rose-700/50',
    neutral: 'bg-slate-800/80 text-slate-300 border-slate-700',
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
