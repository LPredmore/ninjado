import React, { Suspense, lazy } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

// Lazy load ninja-themed components
const NinjaScrollCard = lazy(() => 
  import('./ninja/NinjaScrollCard').then(module => ({ default: module.NinjaScrollCard }))
);

const ShurikenButton = lazy(() => 
  import('./ninja/ShurikenButton').then(module => ({ default: module.ShurikenButton }))
);

// Skeleton components for ninja-themed elements
const NinjaScrollCardSkeleton = ({ title }: { title?: string }) => {
  return (
    <Card className="border-2 border-border/30 backdrop-blur-sm">
      {title && (
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <Skeleton className="w-8 h-8 rounded-lg" />
            <Skeleton className="h-6 w-48" />
          </div>
        </CardHeader>
      )}
      <CardContent className="pt-0">
        <div className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-8 w-32" />
        </div>
      </CardContent>
    </Card>
  );
};

const ShurikenButtonSkeleton = ({ hasIcon }: { hasIcon?: boolean }) => {
  return (
    <Skeleton 
      className={`${hasIcon ? 'w-12 h-12 rounded-full' : 'h-12 w-32 rounded-lg'}`} 
    />
  );
};

// Lazy wrapper components
interface LazyNinjaScrollCardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'mission' | 'reward';
  glowing?: boolean;
}

interface LazyShurikenButtonProps {
  onClick?: () => void;
  icon?: any;
  variant?: 'jade' | 'fire' | 'electric';
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export const LazyNinjaScrollCard: React.FC<LazyNinjaScrollCardProps> = ({ 
  title, 
  children, 
  className,
  variant = 'default',
  glowing = false
}) => {
  return (
    <Suspense fallback={<NinjaScrollCardSkeleton title={title} />}>
      <NinjaScrollCard 
        title={title}
        className={className}
        variant={variant}
        glowing={glowing}
      >
        {children}
      </NinjaScrollCard>
    </Suspense>
  );
};

export const LazyShurikenButton: React.FC<LazyShurikenButtonProps> = ({ 
  onClick, 
  icon, 
  variant = 'jade',
  children, 
  className,
  disabled
}) => {
  return (
    <Suspense fallback={<ShurikenButtonSkeleton hasIcon={!!icon} />}>
      <ShurikenButton
        onClick={onClick}
        icon={icon}
        variant={variant}
        className={className}
        disabled={disabled}
      >
        {children}
      </ShurikenButton>
    </Suspense>
  );
};