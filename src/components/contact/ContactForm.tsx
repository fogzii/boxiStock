"use client";

import posthog from "posthog-js";
import * as React from "react";
import { toast } from "sonner";
import { sendContactEmail } from "@/actions/contact";
import { Input } from "@/components/ui/input";

export function ContactForm() {
  const [isPending, startTransition] = React.useTransition();
  const [form, setForm] = React.useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        await sendContactEmail(form);
        posthog.capture("contact_form_submitted", {
          subject: form.subject,
        });
        toast.success("Message sent! We'll get back to you soon.");
        setForm({ name: "", email: "", subject: "", message: "" });
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to send message.",
        );
      }
    });
  };

  const inputClass =
    "w-full bg-input border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <label htmlFor="name" className="text-sm font-medium text-foreground">
            Name
          </label>
          <Input
            id="name"
            name="name"
            placeholder="Your name"
            value={form.name}
            onChange={handleChange}
            required
            disabled={isPending}
            className={inputClass}
          />
        </div>
        <div className="space-y-1.5">
          <label
            htmlFor="email"
            className="text-sm font-medium text-foreground"
          >
            Email
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={handleChange}
            required
            disabled={isPending}
            className={inputClass}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="subject"
          className="text-sm font-medium text-foreground"
        >
          Subject
        </label>
        <Input
          id="subject"
          name="subject"
          placeholder="What's this about?"
          value={form.subject}
          onChange={handleChange}
          required
          disabled={isPending}
          className={inputClass}
        />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="message"
          className="text-sm font-medium text-foreground"
        >
          Message
        </label>
        <textarea
          id="message"
          name="message"
          rows={6}
          placeholder="Tell us how we can help..."
          value={form.message}
          onChange={handleChange}
          required
          disabled={isPending}
          className={`${inputClass} resize-none`}
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2.5 px-4 rounded-xl shadow-[0_0_20px_-5px_rgba(145,128,168,0.4)] hover:shadow-[0_10px_40px_-10px_rgba(145,128,168,0.6)] transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
      >
        {isPending ? "Sending…" : "Send Message"}
      </button>
    </form>
  );
}
