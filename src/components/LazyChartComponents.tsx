import React, { Suspense, lazy } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Lazy load chart components for better performance
const ChartContainer = lazy(() => 
  import('@/components/ui/chart').then(module => ({ default: module.ChartContainer }))
);

const ChartTooltip = lazy(() => 
  import('@/components/ui/chart').then(module => ({ default: module.ChartTooltip }))
);

const ChartTooltipContent = lazy(() => 
  import('@/components/ui/chart').then(module => ({ default: module.ChartTooltipContent }))
);

const ChartLegend = lazy(() => 
  import('@/components/ui/chart').then(module => ({ default: module.ChartLegend }))
);

const ChartLegendContent = lazy(() => 
  import('@/components/ui/chart').then(module => ({ default: module.ChartLegendContent }))
);

// Lazy load recharts components
const BarChart = lazy(() => 
  import('recharts').then(module => ({ default: module.BarChart }))
);

const LineChart = lazy(() => 
  import('recharts').then(module => ({ default: module.LineChart }))
);

const PieChart = lazy(() => 
  import('recharts').then(module => ({ default: module.PieChart }))
);

const AreaChart = lazy(() => 
  import('recharts').then(module => ({ default: module.AreaChart }))
);

// Chart skeleton component
const ChartSkeleton = ({ title }: { title?: string }) => {
  return (
    <Card>
      {title && (
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-6 w-48" />
          </CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <div className="aspect-video flex items-center justify-center">
          <div className="space-y-3 w-full">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-32 w-full" />
            <div className="flex justify-center space-x-4">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Lazy wrapper components
interface LazyChartProps {
  children: React.ReactElement;
  title?: string;
  config?: any;
  className?: string;
}

export const LazyChartContainer: React.FC<LazyChartProps> = ({ children, title, config, className }) => {
  return (
    <Suspense fallback={<ChartSkeleton title={title} />}>
      <ChartContainer config={config} className={className}>
        {children}
      </ChartContainer>
    </Suspense>
  );
};

export const LazyBarChart: React.FC<any> = (props) => {
  return (
    <Suspense fallback={<div className="h-64 w-full bg-muted animate-pulse rounded" />}>
      <BarChart {...props} />
    </Suspense>
  );
};

export const LazyLineChart: React.FC<any> = (props) => {
  return (
    <Suspense fallback={<div className="h-64 w-full bg-muted animate-pulse rounded" />}>
      <LineChart {...props} />
    </Suspense>
  );
};

export const LazyPieChart: React.FC<any> = (props) => {
  return (
    <Suspense fallback={<div className="h-64 w-full bg-muted animate-pulse rounded" />}>
      <PieChart {...props} />
    </Suspense>
  );
};

export const LazyAreaChart: React.FC<any> = (props) => {
  return (
    <Suspense fallback={<div className="h-64 w-full bg-muted animate-pulse rounded" />}>
      <AreaChart {...props} />
    </Suspense>
  );
};

// Export lazy tooltip and legend components
export const LazyChartTooltip: React.FC<any> = (props) => {
  return (
    <Suspense fallback={null}>
      <ChartTooltip {...props} />
    </Suspense>
  );
};

export const LazyChartTooltipContent: React.FC<any> = (props) => {
  return (
    <Suspense fallback={null}>
      <ChartTooltipContent {...props} />
    </Suspense>
  );
};

export const LazyChartLegend: React.FC<any> = (props) => {
  return (
    <Suspense fallback={null}>
      <ChartLegend {...props} />
    </Suspense>
  );
};

export const LazyChartLegendContent: React.FC<any> = (props) => {
  return (
    <Suspense fallback={null}>
      <ChartLegendContent {...props} />
    </Suspense>
  );
};