// frontend/src/components/UI/Modal.jsx
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/shadcn/dialog";
import { cn } from "@/lib/utils";

/** App modal on shadcn Dialog: focus trap, Escape, scroll lock; a bottom sheet on phones. */
const Modal = ({ isOpen, onClose, title, description, children, size = "sm:max-w-md", hideClose = false }) => (
  <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
    <DialogContent className={cn(size)} hideClose={hideClose}>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        {description ? <DialogDescription>{description}</DialogDescription> : <DialogDescription className="sr-only">{title}</DialogDescription>}
      </DialogHeader>
      {children}
    </DialogContent>
  </Dialog>
);

export default Modal;
