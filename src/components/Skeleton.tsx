import { memo } from "react";

export const Skeleton = memo(function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-surface-container-highest ${className}`} />;
});

export const DeityCardSkeleton = memo(function DeityCardSkeleton() {
  return (
    <div className="block rounded-xl border border-outline-variant bg-surface-container-lowest p-6">
      <Skeleton className="mb-4 h-20 w-20" />
      <Skeleton className="mb-2 h-6 w-28" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="mt-2 h-4 w-3/4" />
    </div>
  );
});

export const ContentRowSkeleton = memo(function ContentRowSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-outline-variant bg-surface-container-lowest p-5">
      <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
      <div className="min-w-0 flex-1">
        <Skeleton className="mb-1.5 h-5 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-7 w-16 shrink-0 rounded-full" />
    </div>
  );
});

export const HomeSkeleton = memo(function HomeSkeleton() {
  return (
    <main className="min-h-screen bg-bg">
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-12 md:py-12">
        <Skeleton className="mb-2 h-10 w-72" />
        <Skeleton className="mb-12 h-5 w-96" />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <DeityCardSkeleton key={i} />)}
        </div>
      </div>
    </main>
  );
});

export const DeitySkeleton = memo(function DeitySkeleton() {
  return (
    <main className="min-h-screen bg-bg">
      <div className="mx-auto max-w-4xl px-4 py-8 md:px-12 md:py-12">
        <Skeleton className="mb-8 h-4 w-16" />
        <Skeleton className="mb-4 h-24 w-24 rounded-xl" />
        <Skeleton className="mb-2 h-10 w-48" />
        <Skeleton className="mb-12 h-5 w-full max-w-xl" />
        <Skeleton className="mb-4 h-7 w-28" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <ContentRowSkeleton key={i} />)}
        </div>
      </div>
    </main>
  );
});

export const MantraSkeleton = memo(function MantraSkeleton() {
  return (
    <main className="min-h-screen bg-bg">
      <div className="mx-auto max-w-3xl px-4 py-8 md:px-12 md:py-12">
        <Skeleton className="mb-8 h-4 w-24" />
        <Skeleton className="mb-2 h-5 w-16 rounded-full" />
        <Skeleton className="mb-3 h-10 w-72" />
        <Skeleton className="mb-8 h-5 w-full max-w-lg" />
        <Skeleton className="mb-6 h-10 w-full rounded-lg" />
        <Skeleton className="mb-6 h-20 w-full rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    </main>
  );
});

export const SearchSkeleton = memo(function SearchSkeleton() {
  return (
    <main className="min-h-screen bg-bg">
      <div className="mx-auto max-w-4xl px-4 py-8 md:px-12 md:py-12">
        <Skeleton className="mb-8 h-10 w-full max-w-xl" />
        <div className="mb-8 flex gap-3">
          <Skeleton className="h-10 w-36 rounded-lg" />
          <Skeleton className="h-10 w-36 rounded-lg" />
          <Skeleton className="h-10 w-24 rounded-lg" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <ContentRowSkeleton key={i} />)}
        </div>
      </div>
    </main>
  );
});

export const SavedSkeleton = memo(function SavedSkeleton() {
  return (
    <main className="min-h-screen bg-bg">
      <div className="mx-auto max-w-4xl px-4 py-8 md:px-12 md:py-12">
        <Skeleton className="mb-8 h-10 w-32" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <ContentRowSkeleton key={i} />)}
        </div>
      </div>
    </main>
  );
});
