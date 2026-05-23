import { Button, Modal, ModalActions } from "@box-ds";
import { useState } from "react";
import { PageHeader, Section } from "../ComponentFrame";

function ModalDemo({
  title,
  destructive,
}: {
  title: string;
  destructive?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        variant={destructive ? "destructive" : "default"}
        onClick={() => setOpen(true)}
      >
        Open {title.toLowerCase()}
      </Button>
      <Modal isOpen={open} onClose={() => setOpen(false)} title={title}>
        <p className="m-0 mb-6 text-body-md text-body">
          This is an example modal. It uses a portal to render above the page
          and closes on Escape or backdrop click.
        </p>
        <ModalActions
          onCancel={() => setOpen(false)}
          submitLabel={destructive ? "Delete" : "Confirm"}
          destructive={destructive}
        />
      </Modal>
    </>
  );
}

function LoadingDemo() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleSubmit() {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setOpen(false);
    }, 1800);
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>Open with loading</Button>
      <Modal isOpen={open} onClose={() => setOpen(false)} title="Save changes">
        <p className="m-0 mb-6 text-body-md text-body">
          Click confirm to simulate an async action.
        </p>
        <ModalActions
          onCancel={() => setOpen(false)}
          submitLabel="Save"
          loadingLabel="Saving…"
          isLoading={loading}
          // biome-ignore lint/suspicious/noExplicitAny: demo
          {...({ onClick: handleSubmit } as any)}
        />
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        />
      </Modal>
    </>
  );
}

export function ModalPage() {
  return (
    <div>
      <PageHeader
        title="Modal"
        description="Portal-based dialog. Click the buttons below to open interactive examples."
      />

      <Section
        title="Default modal"
        render={() => <ModalDemo title="Example modal" />}
      />

      <Section
        title="Destructive modal"
        render={() => <ModalDemo title="Delete product" destructive />}
      />

      <Section
        title="Modal with loading state"
        render={() => <LoadingDemo />}
      />
    </div>
  );
}
