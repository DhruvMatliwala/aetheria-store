import { forwardRef, ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, disabled, children, ...props }, ref) => {
    const base =
      'inline-flex items-center justify-center font-bold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface-950 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]';

    const variants = {
      primary:
        'bg-cyan-400 hover:bg-cyan-300 text-black font-semibold shadow-[0_0_20px_rgba(56,189,248,0.3)] focus:ring-cyan-400',
      secondary:
        'bg-neutral-900 text-[#ece7e0] border border-white/10 hover:bg-neutral-800 hover:border-cyan-500/40 focus:ring-cyan-400',
      ghost:
        'text-cyan-400 hover:text-cyan-300 hover:bg-neutral-900 focus:ring-cyan-400',
      danger:
        'bg-red-600 text-white hover:bg-red-500 focus:ring-red-500',
    };

    const sizes = {
      sm: 'text-xs px-4 py-2 gap-1.5 font-mono uppercase tracking-wider',
      md: 'text-xs sm:text-sm px-5 py-2.5 gap-2 font-mono uppercase tracking-wider',
      lg: 'text-sm sm:text-base px-7 py-3.5 gap-2.5 font-mono uppercase tracking-wider',
    };

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-1 h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
