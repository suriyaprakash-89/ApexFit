// frontend/src/components/UI/EmptyState.jsx
import React from "react";

const EmptyState = ({ icon: Icon, title, description, action, compact = false }) => (
  <div className={`text-center ${compact ? "py-6" : "py-12"} px-4`}>
    {Icon && (
      <div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
        <Icon className="w-7 h-7 text-primary-600 dark:text-primary-400" aria-hidden="true" />
      </div>
    )}
    <p className="font-semibold text-gray-900 dark:text-white">{title}</p>
    {description && <p className="mt-1 text-sm text-muted max-w-sm mx-auto">{description}</p>}
    {action && <div className="mt-5 flex justify-center">{action}</div>}
  </div>
);

export default EmptyState;
