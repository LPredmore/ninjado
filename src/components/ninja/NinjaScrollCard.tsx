import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface NinjaScrollCardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'mission' | 'reward';
  glowing?: boolean;
}

export const NinjaScrollCard = ({ 
  title, 
  children, 
  className,
  variant = 'default',
  glowing = false
}: NinjaScrollCardProps) => {
  const variantClasses = {
    default: '',
    mission: 'gradient-clay-primary glow-jade',
    reward: 'gradient-clay-accent glow-electric'
  };

  return (
    <Card 
      className={cn(
        'ninja-scroll border-2 border-border/30 backdrop-blur-sm max-w-full overflow-hidden',
        variantClasses[variant],
        glowing && 'glow-jade',
        className
      )}
    >
      {title && (
        <CardHeader className="pb-3">
          <CardTitle className="text-xl font-bold text-card-foreground flex items-center gap-3">
            <span className="clay-element w-8 h-8 gradient-clay-accent rounded-lg flex items-center justify-center text-sm">
              📜
            </span>
            {title}
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className="pt-0">
        {children}
      </CardContent>
    </Card>
  );
};