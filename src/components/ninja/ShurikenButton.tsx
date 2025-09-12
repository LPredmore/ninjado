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

  // Use xl size for text content, shuriken for icons only
  const buttonSize = Icon ? "shuriken" : "xl";

  return (
    <Button
      variant={variantMap[variant]}
      size={buttonSize}
      onClick={onClick}
      className={className}
      disabled={disabled}
    >
      {Icon ? <Icon className="w-6 h-6" /> : children}
    </Button>
  );
};