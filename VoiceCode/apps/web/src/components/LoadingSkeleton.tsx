import React from 'react';
import { cn } from '@/lib/utils';

type SkeletonVariant = 'card' | 'list' | 'page';

interface LoadingSkeletonProps {
  variant: SkeletonVariant;
  count?: number;
  className?: string;
}

const SkeletonLine: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('h-4 bg-gray-200 rounded animate-pulse', className)} />
);

const SkeletonCircle: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('rounded-full bg-gray-200 animate-pulse', className)} />
);

const CardSkeleton: React.FC = () => (
  <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
    <div className="flex items-center gap-3">
      <SkeletonCircle className="h-10 w-10 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <SkeletonLine className="w-3/4" />
        <SkeletonLine className="w-1/2 h-3" />
      </div>
    </div>
    <div className="space-y-2">
      <SkeletonLine className="w-full" />
      <SkeletonLine className="w-5/6" />
      <SkeletonLine className="w-2/3" />
    </div>
    <div className="flex gap-2 pt-2">
      <SkeletonLine className="w-16 h-6 rounded-full" />
      <SkeletonLine className="w-20 h-6 rounded-full" />
    </div>
  </div>
);

const ListItemSkeleton: React.FC = () => (
  <div className="flex items-center gap-4 px-4 py-4 border-b border-gray-100 last:border-b-0">
    <SkeletonCircle className="h-9 w-9 flex-shrink-0" />
    <div className="flex-1 min-w-0 space-y-2">
      <SkeletonLine className="w-2/5" />
      <div className="flex gap-2">
        <SkeletonLine className="w-12 h-3 rounded-full" />
        <SkeletonLine className="w-14 h-3 rounded-full" />
      </div>
    </div>
    <SkeletonLine className="w-16 h-3 flex-shrink-0" />
    <SkeletonLine className="w-20 h-3 flex-shrink-0" />
    <SkeletonLine className="w-16 h-5 rounded-full flex-shrink-0" />
    <div className="flex gap-1 flex-shrink-0">
      <SkeletonCircle className="h-7 w-7" />
      <SkeletonCircle className="h-7 w-7" />
      <SkeletonCircle className="h-7 w-7" />
    </div>
  </div>
);

const ListSkeleton: React.FC<{ count: number }> = ({ count }) => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
    {/* Table header skeleton */}
    <div className="flex items-center gap-4 px-4 py-3 bg-gray-50 border-b border-gray-200">
      <SkeletonLine className="w-12 h-3 flex-shrink-0" />
      <div className="flex-1">
        <SkeletonLine className="w-10 h-3" />
      </div>
      <SkeletonLine className="w-16 h-3 flex-shrink-0" />
      <SkeletonLine className="w-12 h-3 flex-shrink-0" />
      <SkeletonLine className="w-14 h-3 flex-shrink-0" />
      <SkeletonLine className="w-16 h-3 flex-shrink-0" />
    </div>
    {/* List item skeletons */}
    {Array.from({ length: count }).map((_, i) => (
      <ListItemSkeleton key={i} />
    ))}
  </div>
);

const PageSkeleton: React.FC = () => (
  <div className="min-h-screen bg-gray-50">
    {/* Header skeleton */}
    <div className="bg-gray-200 animate-pulse px-6 py-10">
      <div className="max-w-[1400px] mx-auto space-y-3">
        <SkeletonLine className="w-48 h-8 bg-gray-300" />
        <SkeletonLine className="w-72 h-4 bg-gray-300" />
      </div>
    </div>

    {/* Tab bar skeleton */}
    <div className="bg-white border-b border-gray-200 px-6 py-0">
      <div className="max-w-[1400px] mx-auto flex gap-4 py-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonLine key={i} className="w-28 h-8 rounded-md" />
        ))}
      </div>
    </div>

    {/* Content area skeleton */}
    <div className="max-w-[1400px] mx-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Stat cards */}
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
            <div className="flex items-center justify-between">
              <SkeletonLine className="w-24 h-3" />
              <SkeletonCircle className="h-8 w-8" />
            </div>
            <SkeletonLine className="w-20 h-7" />
            <SkeletonLine className="w-32 h-3" />
          </div>
        ))}
      </div>

      {/* Chart area skeleton */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8 space-y-4">
        <SkeletonLine className="w-40 h-5" />
        <div className="flex items-end gap-3 h-48">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 bg-gray-200 rounded-t animate-pulse"
              style={{ height: `${30 + Math.random() * 70}%` }}
            />
          ))}
        </div>
      </div>

      {/* Table/list skeleton */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <SkeletonLine className="w-36 h-5" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-b-0">
            <SkeletonCircle className="h-8 w-8 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <SkeletonLine className="w-2/5" />
              <SkeletonLine className="w-1/4 h-3" />
            </div>
            <SkeletonLine className="w-16 h-5 rounded-full flex-shrink-0" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  variant,
  count = 5,
  className,
}) => {
  return (
    <div className={cn(className)} role="status" aria-label="Loading content">
      <span className="sr-only">Loading...</span>
      {variant === 'card' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: count }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      )}
      {variant === 'list' && <ListSkeleton count={count} />}
      {variant === 'page' && <PageSkeleton />}
    </div>
  );
};

export default LoadingSkeleton;
