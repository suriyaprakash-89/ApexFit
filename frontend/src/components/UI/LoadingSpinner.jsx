// frontend/src/components/UI/LoadingSpinner.jsx
import React from "react";

const LoadingSpinner = () => (
  <div className="flex min-h-dvh items-center justify-center bg-background" role="status">
    <div className="relative">
      <span className="absolute inset-0 animate-ping rounded-full bg-primary/20" aria-hidden="true" />
      <img src="/logo.png" alt="" className="relative h-14 w-14 rounded-full" />
    </div>
    <span className="sr-only">Loading ApeXfit</span>
  </div>
);

export default LoadingSpinner;
