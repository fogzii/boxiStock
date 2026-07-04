"use client";

import { Modal, ModalActions } from "@box-ds";
import * as React from "react";
import { ShareConfigFields, type ShareConfigValue } from "./ShareConfigFields";

interface EditInviteConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  initialValue: ShareConfigValue;
  onSave: (value: ShareConfigValue) => Promise<void> | void;
}

export function EditInviteConfigModal({
  isOpen,
  onClose,
  title,
  initialValue,
  onSave,
}: EditInviteConfigModalProps) {
  const [value, setValue] = React.useState(initialValue);
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) setValue(initialValue);
  }, [isOpen, initialValue]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (value.sections.length === 0) return;
    setIsSaving(true);
    try {
      await onSave(value);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <ShareConfigFields
          value={value}
          onChange={setValue}
          disabled={isSaving}
        />
        <ModalActions
          submitLabel="Save"
          loadingLabel="Saving…"
          isLoading={isSaving}
          disabled={value.sections.length === 0}
          onCancel={onClose}
        />
      </form>
    </Modal>
  );
}
