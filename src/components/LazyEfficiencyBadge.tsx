import React, { Suspense, lazy } from 'react';
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load the EfficiencyBadge component
const EfficiencyBadge = lazy(() => 
  import('./EfficiencyBadge').then(module => ({ default: module.EfficiencyBadge }))
);

interface LazyEfficiencyBadgeProps {
  userId: string;
  variant?: "hero" | "full" | "compact";
}

const EfficiencyBadgeSkeleton = ({ variant }: { variant: "hero" | "full" | "compact" }) => {
  if (variant === "compact") {
    return (
      <div className="flex items-center gap-2 clay-element px-3 py-2 rounded-xl">
        <Skeleton className="w-8 h-8 rounded-full" />
        <div className="space-y-1">
          <Skeleton className="w-12 h-4" />
          <Skeleton className="w-8 h-3" />
        </div>
      </div>
    );
  }

  if (variant === "full") {
    return (
      <div className="space-y-6">
        <div className="clay-element p-6 rounded-2xl">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <Skeleton className="w-24 h-24 rounded-full" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-8 w-32" />
              <div className="flex gap-3">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-16" />
              </div>
            </div>
          </div>
          <div className="mt-6 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-full" />
          </div>
        </div>
        <div className="clay-element p-6 rounded-2xl">
          <Skeleton className="h-6 w-48 mb-4" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="p-3 rounded-lg border-2">
                <div className="flex flex-col items-center gap-2">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-2 w-12" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Hero variant
  return (
    <div className="clay-element p-6 rounded-2xl">
      <div className="flex flex-col sm:flex-row items-center gap-6">
        <Skeleton className="w-20 h-20 rounded-full" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-8 w-32" />
          <div className="flex gap-3">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-16" />
          </div>
        </div>
      </div>
      <div className="mt-6 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-2 w-full" />
      </div>
    </div>
  );
};

const LazyEfficiencyBadge: React.FC<LazyEfficiencyBadgeProps> = ({ userId, variant = "hero" }) => {
  return (
    <Suspense fallback={<EfficiencyBadgeSkeleton variant={variant} />}>
      <EfficiencyBadge userId={userId} variant={variant} />
    </Suspense>
  );
};

export default LazyEfficiencyBadge;