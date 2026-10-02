// frontend/src/components/UI/LoadingSpinner.jsx
import React from "react";

const LoadingSpinner = () => (
  <div
    className="min-h-dvh flex items-center justify-center bg-gray-50 dark:bg-gray-900"
    role="status"
  >
    <img src="/logo.png" alt="" className="w-14 h-14 rounded-full animate-pulse" />
    <span className="sr-only">Loading ApeXfit</span>
  </div>
);

export default LoadingSpinner;
