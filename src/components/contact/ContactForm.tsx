"use client";

import { colors } from "@box-ds";
import posthog from "posthog-js";
import * as React from "react";
import { toast } from "sonner";
import { sendContactEmail } from "@/actions/contact";

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
        const res = await sendContactEmail(form);
        if (!res.ok) {
          toast.error(res.error);
          return;
        }
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

  const labelClass = "text-body-sm-strong text-foreground";
  const inputClass =
    "h-11 w-full rounded-xl border bg-background px-4 py-2.5 text-body-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  const inputStyle = { borderColor: colors.body };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="space-y-2">
          <label htmlFor="name" className={labelClass}>
            Name
          </label>
          <input
            id="name"
            name="name"
            placeholder="Your name"
            value={form.name}
            onChange={handleChange}
            required
            disabled={isPending}
            className={inputClass}
            style={inputStyle}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="email" className={labelClass}>
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={handleChange}
            required
            disabled={isPending}
            className={inputClass}
            style={inputStyle}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="subject" className={labelClass}>
          Subject
        </label>
        <input
          id="subject"
          name="subject"
          placeholder="What's this about?"
          value={form.subject}
          onChange={handleChange}
          required
          disabled={isPending}
          className={inputClass}
          style={inputStyle}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="message" className={labelClass}>
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
          className={`${inputClass} h-auto resize-none`}
          style={inputStyle}
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-primary hover:bg-primary-active text-primary-foreground text-button-md h-12 rounded-xl transition-colors disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
      >
        {isPending ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
