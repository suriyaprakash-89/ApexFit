// frontend/src/components/UI/Skeleton.jsx
import React from "react";

export const Skeleton = ({ className = "h-4 w-full" }) => (
  <div className={`skeleton ${className}`} aria-hidden="true" />
);

export const SkeletonCard = ({ lines = 3, className = "" }) => (
  <div className={`card ${className}`} aria-hidden="true">
    <Skeleton className="h-5 w-1/3 mb-4" />
    {Array.from({ length: lines }, (_, i) => (
      <Skeleton key={i} className={`h-4 mb-3 ${i === lines - 1 ? "w-2/3" : "w-full"}`} />
    ))}
  </div>
);

export const SkeletonStatGrid = ({ count = 4 }) => (
  <div
    className={`grid grid-cols-2 ${count === 3 ? "md:grid-cols-3" : "lg:grid-cols-4"} gap-3 sm:gap-5`}
    aria-hidden="true"
  >
    {Array.from({ length: count }, (_, i) => (
      <div key={i} className="card">
        <Skeleton className="h-10 w-10 rounded-xl mb-4" />
        <Skeleton className="h-7 w-2/3 mb-2" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    ))}
  </div>
);

/** Full-page placeholder used while a lazy route chunk loads. */
export const PageSkeleton = () => (
  <div
    className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-6"
    role="status"
    aria-label="Loading"
  >
    <Skeleton className="h-8 w-56" />
    <SkeletonStatGrid />
    <SkeletonCard lines={5} />
  </div>
);
