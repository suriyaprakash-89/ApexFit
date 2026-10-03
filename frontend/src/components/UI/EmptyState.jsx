// frontend/src/components/UI/EmptyState.jsx
import React from "react";

const EmptyState = ({ icon: Icon, title, description, action, compact = false }) => (
  <div className={`text-center ${compact ? "py-6" : "py-12"} px-4`}>
    {Icon && (
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10">
        <Icon className="h-7 w-7 text-primary" aria-hidden="true" />
      </div>
    )}
    <p className="font-display font-semibold text-foreground">{title}</p>
    {description && <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
    {action && <div className="mt-5 flex justify-center">{action}</div>}
  </div>
);

export default EmptyState;
