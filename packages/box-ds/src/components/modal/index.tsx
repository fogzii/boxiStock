"use client";

import { X } from "lucide-react";
import * as React from "react";
import * as ReactDOM from "react-dom";

import { cn } from "../../utils/cn";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  className,
}: ModalProps) {
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex flex-col sm:items-center sm:justify-center sm:p-4">
      <button
        type="button"
        aria-label="Close modal"
        className="fixed inset-0 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200 cursor-default"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative z-50 w-full min-h-0 max-h-[100dvh] flex-1 overflow-y-auto overscroll-contain bg-canvas sm:border border-primary/10 sm:rounded-xl sm:max-w-lg p-6 sm:shadow-level4 sm:max-h-[calc(100dvh-2rem)] sm:flex-none animate-in fade-in slide-in-from-bottom-4 duration-300",
          className,
        )}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-display-xs text-ink">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-primary/10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
