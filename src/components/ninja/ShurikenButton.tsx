import React from 'react';
import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';

interface ShurikenButtonProps {
  onClick?: () => void;
  icon?: LucideIcon;
  variant?: 'jade' | 'fire' | 'electric';
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export const ShurikenButton = ({ 
  onClick, 
  icon: Icon, 
  variant = 'jade',
  children, 
  className,
  disabled
}: ShurikenButtonProps) => {
  const variantMap = {
    jade: 'clay-jade',
    fire: 'clay-fire', 
    electric: 'clay-electric'
  } as const;

  return (
    <Button
      variant={variantMap[variant]}
      size="shuriken"
      onClick={onClick}
      className={`hover:animate-shuriken-spin ${className}`}
      disabled={disabled}
    >
      {Icon ? <Icon className="w-6 h-6" /> : children}
    </Button>
  );
};