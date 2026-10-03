// frontend/src/components/UI/Page.jsx
import React, { useEffect } from "react";

/** Consistent page shell: same width, padding and header on every screen. */
const Page = ({ title, subtitle, eyebrow, icon: Icon, actions, children, documentTitle }) => {
  useEffect(() => {
    document.title = `${documentTitle || title} · ApeXfit`;
  }, [documentTitle, title]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
      <header className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          {Icon && (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
              <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
            </div>
          )}
          <div className="min-w-0">
            {eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}
            <h1 className="text-balance text-2xl font-bold leading-tight text-foreground sm:text-4xl">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex flex-wrap gap-2 sm:justify-end">{actions}</div>}
      </header>
      {children}
    </div>
  );
};

export default Page;
