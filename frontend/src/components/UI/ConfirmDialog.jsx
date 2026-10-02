// frontend/src/components/UI/ConfirmDialog.jsx
import React from "react";
import { AlertTriangle } from "lucide-react";
import Modal from "./Modal";
import { useConfirmStore } from "../../store/confirmStore";

const ConfirmDialog = () => {
  const { dialog, close } = useConfirmStore();
  if (!dialog) return null;

  return (
    <Modal isOpen onClose={() => close(false)} title={dialog.title} hideClose>
      <div className="flex gap-3">
        {dialog.danger && (
          <div className="shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" aria-hidden="true" />
          </div>
        )}
        <p className="text-muted text-sm leading-relaxed">{dialog.message}</p>
      </div>
      <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
        <button type="button" className="btn-secondary" onClick={() => close(false)}>
          {dialog.cancelText}
        </button>
        <button
          type="button"
          className={dialog.danger ? "btn-danger" : "btn-primary"}
          onClick={() => close(true)}
        >
          {dialog.confirmText}
        </button>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
