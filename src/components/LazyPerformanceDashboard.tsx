import React, { Suspense, lazy } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load the PerformanceDashboard component
const PerformanceDashboard = lazy(() => 
  import('./PerformanceDashboard').then(module => ({ default: module.PerformanceDashboard }))
);

interface LazyPerformanceDashboardProps {
  className?: string;
}

const PerformanceDashboardSkeleton = () => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-48" />
        <div className="space-x-2 flex">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <div className="p-4 space-y-3">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-5 w-12" />
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <div className="p-6 space-y-4">
          <Skeleton className="h-6 w-40" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-36" />
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
};

const LazyPerformanceDashboard: React.FC<LazyPerformanceDashboardProps> = ({ className }) => {
  return (
    <Suspense fallback={<PerformanceDashboardSkeleton />}>
      <PerformanceDashboard className={className} />
    </Suspense>
  );
};

export default LazyPerformanceDashboard;