import { notFound } from "next/navigation";
import { EmailPreviewClient } from "./email-preview-client";

export default function EmailPreviewPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  return <EmailPreviewClient />;
}
