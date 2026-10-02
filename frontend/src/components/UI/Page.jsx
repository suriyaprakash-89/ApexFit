// frontend/src/components/UI/Page.jsx
import React, { useEffect } from "react";

/** Consistent page shell: same width, padding and header on every screen. */
const Page = ({ title, subtitle, icon: Icon, actions, children, documentTitle }) => {
  useEffect(() => {
    document.title = `${documentTitle || title} · ApeXfit`;
  }, [documentTitle, title]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8">
      <header className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          {Icon && (
            <div className="shrink-0 w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
              <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400" aria-hidden="true" />
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{title}</h1>
            {subtitle && <p className="text-sm text-muted mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex flex-wrap gap-2 sm:justify-end">{actions}</div>}
      </header>
      {children}
    </div>
  );
};

export default Page;
