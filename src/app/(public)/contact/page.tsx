import type { Metadata } from "next";
import { ContactForm } from "@/components/contact/ContactForm";

export const metadata: Metadata = {
  title: "Contact Us",
};

export default function ContactPage() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 px-4 sm:px-8 py-12 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
          Contact Us
        </h1>
        <p className="text-muted-foreground">
          Have a question or need help? Send us a message and we'll get back to
          you as soon as possible.
        </p>
      </div>

      <div className="bg-card/50 backdrop-blur-md rounded-xl border border-border p-6 sm:p-8">
        <ContactForm />
      </div>
    </div>
  );
}
