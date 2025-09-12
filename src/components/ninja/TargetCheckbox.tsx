import React from 'react';
import { cn } from '@/lib/utils';

interface TargetCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  variant?: 'jade' | 'fire' | 'electric';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const TargetCheckbox = ({
  checked,
  onChange,
  variant = 'jade',
  size = 'md',
  className
}: TargetCheckboxProps) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8', 
    lg: 'w-10 h-10'
  };

  const variantClasses = {
    jade: checked ? 'gradient-clay-accent glow-jade animate-jade-glow' : 'border-accent/50',
    fire: checked ? 'bg-destructive glow-fire animate-fire-glow' : 'border-destructive/50',
    electric: checked ? 'bg-success glow-electric animate-electric-glow' : 'border-success/50'
  };

  const targetIcon = checked ? '🎯' : '⭕';

  return (
    <button
      className={cn(
        'clay-element rounded-full border-2 flex items-center justify-center transition-clay clay-hover clay-press',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      onClick={() => onChange(!checked)}
    >
      <span className="text-sm">{targetIcon}</span>
    </button>
  );
};