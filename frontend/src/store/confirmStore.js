// frontend/src/store/confirmStore.js
import { create } from "zustand";

/**
 * Promise-based replacement for window.confirm():
 *   if (!(await confirmDialog({ title, message, confirmText, danger: true }))) return;
 */
export const useConfirmStore = create((set, get) => ({
  dialog: null,
  open: (options) =>
    new Promise((resolve) => {
      get().dialog?.resolve(false);
      set({ dialog: { confirmText: "Confirm", cancelText: "Cancel", ...options, resolve } });
    }),
  close: (result) => {
    get().dialog?.resolve(result);
    set({ dialog: null });
  },
}));

export const confirmDialog = (options) => useConfirmStore.getState().open(options);
