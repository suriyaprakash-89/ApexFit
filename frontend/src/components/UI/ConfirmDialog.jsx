// frontend/src/components/UI/ConfirmDialog.jsx
import React from "react";
import { AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/shadcn/alert-dialog";
import { useConfirmStore } from "../../store/confirmStore";

const ConfirmDialog = () => {
  const { dialog, close } = useConfirmStore();

  return (
    <AlertDialog open={Boolean(dialog)} onOpenChange={(open) => !open && close(false)}>
      {dialog && (
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-start gap-3">
              {dialog.danger && (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/15">
                  <AlertTriangle className="h-5 w-5 text-destructive" aria-hidden="true" />
                </div>
              )}
              <div className="space-y-1.5">
                <AlertDialogTitle>{dialog.title}</AlertDialogTitle>
                <AlertDialogDescription>{dialog.message}</AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => close(false)}>{dialog.cancelText}</AlertDialogCancel>
            <AlertDialogAction variant={dialog.danger ? "destructive" : "default"} onClick={() => close(true)}>
              {dialog.confirmText}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      )}
    </AlertDialog>
  );
};

export default ConfirmDialog;
