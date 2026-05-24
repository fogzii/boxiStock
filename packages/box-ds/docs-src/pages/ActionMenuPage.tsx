import { ActionMenu } from "@box-ds";
import { Copy, GitMerge, Pencil, Trash2 } from "lucide-react";
import { PageHeader, Section } from "../ComponentFrame";

const salesItems = [
  {
    label: "Merge sales",
    icon: <GitMerge />,
    onClick: () => alert("Merge sales"),
  },
  {
    label: "Edit",
    icon: <Pencil />,
    onClick: () => alert("Edit"),
  },
  {
    label: "Duplicate",
    icon: <Copy />,
    onClick: () => alert("Duplicate"),
  },
  {
    label: "Delete",
    icon: <Trash2 />,
    variant: "destructive" as const,
    onClick: () => alert("Delete"),
  },
];

export function ActionMenuPage() {
  return (
    <div>
      <PageHeader
        title="Action menu"
        description="A vertical three-dot trigger that opens a floating action list above the icon. Supports icons, destructive variants, and disabled items. Built on @base-ui/react Menu for full keyboard navigation and accessibility."
      />

      <Section
        title="Default — opens below, aligned end"
        description="The standard pattern: MoreVertical trigger, menu floats downward from the trigger's trailing edge."
        render={() => (
          <div className="flex justify-end pb-20">
            <ActionMenu items={salesItems} />
          </div>
        )}
      />

      <Section
        title="Opens above"
        description="Use side='top' when the trigger is near the bottom of the screen."
        render={() => (
          <div className="flex justify-end pt-20">
            <ActionMenu items={salesItems} side="top" />
          </div>
        )}
      />

      <Section
        title="Aligned start"
        description="Menu anchor can be flipped to the start edge — useful when the trigger sits near the left edge."
        render={() => (
          <div className="flex justify-start pt-20">
            <ActionMenu items={salesItems} align="start" />
          </div>
        )}
      />

      <Section
        title="With disabled item"
        description="Disabled items are dimmed and non-interactive."
        render={() => (
          <div className="flex justify-end pt-20">
            <ActionMenu
              items={[
                {
                  label: "Merge sales",
                  icon: <GitMerge />,
                  onClick: () => alert("Merge"),
                },
                {
                  label: "Edit",
                  icon: <Pencil />,
                  disabled: true,
                  onClick: () => alert("Edit"),
                },
                {
                  label: "Delete",
                  icon: <Trash2 />,
                  variant: "destructive",
                  onClick: () => alert("Delete"),
                },
              ]}
            />
          </div>
        )}
      />
    </div>
  );
}
