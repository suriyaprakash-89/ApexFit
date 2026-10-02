// frontend/src/components/UI/Modal.jsx
import React, { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";

/** Accessible modal: Escape / backdrop closes, focus moves in and is restored on close. */
const Modal = ({ isOpen, onClose, title, children, size = "max-w-md", hideClose = false }) => {
  const titleId = useId();
  const panelRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement;
    const onKeyDown = (e) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", onKeyDown);
    const firstField = panelRef.current?.querySelector(
      "input, select, textarea, button:not([data-modal-close])"
    );
    (firstField || panelRef.current)?.focus();
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm sm:p-4 animate-fade-in"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`w-full ${size} bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-xl p-5 sm:p-6 sheet-bottom max-h-[90dvh] overflow-y-auto animate-slide-up focus:outline-none`}
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <h2 id={titleId} className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h2>
          {!hideClose && (
            <button
              type="button"
              data-modal-close
              onClick={onClose}
              className="icon-btn -mr-2 -mt-2"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        {children}
      </div>
    </div>
  );
};

export default Modal;
