"use client";

import { X } from "lucide-react";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { cn } from "@/lib/utils";

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
          "relative z-50 w-full flex-1 sm:flex-none bg-card sm:border border-primary/10 sm:rounded-2xl sm:max-w-lg p-6 sm:shadow-lg overflow-y-auto animate-in fade-in slide-in-from-bottom-4 duration-300",
          className,
        )}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground">{title}</h2>
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
