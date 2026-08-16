"use client";

import { Dialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "../../utils/cn";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
}

function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200" />
        <Dialog.Popup
          className={cn(
            "fixed z-50 outline-none",
            "inset-0 flex max-h-[100dvh] flex-col overflow-y-auto overscroll-contain bg-canvas p-6",
            "sm:inset-auto sm:top-1/2 sm:left-1/2 sm:max-h-[calc(100dvh-2rem)] sm:w-full sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2",
            "sm:rounded-xl sm:border sm:border-primary/10 sm:shadow-level4",
            "animate-in fade-in slide-in-from-bottom-4 duration-300",
            className,
          )}
        >
          <div className="mb-6 flex items-center justify-between">
            <Dialog.Title className="font-display text-display-xs text-ink">
              {title}
            </Dialog.Title>
            <Dialog.Close
              aria-label="Close modal"
              className="cursor-pointer rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export type { ModalProps };
export { Modal };
