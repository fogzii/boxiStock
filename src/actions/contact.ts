"use server";

import { Resend } from "resend";

const MAX_LEN = 5000;

export async function sendContactEmail(data: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  const name = (data?.name ?? "").trim().slice(0, 200);
  const email = (data?.email ?? "").trim().slice(0, 200);
  const subject = (data?.subject ?? "").trim().slice(0, 300);
  const message = (data?.message ?? "").trim().slice(0, MAX_LEN);

  if (!name || !email || !subject || !message) {
    throw new Error("All fields are required.");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Invalid email address.");
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";

  const { error } = await resend.emails.send({
    from: `BoxiStock <${from}>`,
    to: "boxistock@gmail.com",
    replyTo: email,
    subject: `[BoxiStock Contact] ${subject}`,
    text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
  });

  if (error) throw new Error(error.message);
}
