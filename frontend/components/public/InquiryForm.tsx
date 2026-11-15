"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { publicFetch } from "@/lib/public";

const inputClass =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-2 focus-visible:outline-blue-600";

export default function InquiryForm({
  propertyId,
  propertyTitle,
}: {
  propertyId: string;
  propertyTitle: string;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(
    "Hi, I am interested in " + propertyTitle + ". Please contact me."
  );
  const [contactVia, setContactVia] = useState("phone");
  const [website, setWebsite] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState("");

  function validate() {
    const e: Record<string, string> = {};
    if (name.trim().length < 2) e.name = "Please enter your name";
    if (!phone.trim() && !email.trim())
      e.contact = "Please provide a phone number or an email address";
    if (phone.trim() && !/^[0-9+()\-\s]{7,20}$/.test(phone.trim()))
      e.phone = "Enter a valid phone number";
    if (email.trim() && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim()))
      e.email = "Enter a valid email address";
    return e;
  }

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setServerError("");
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSending(true);
    try {
      const res = await publicFetch<{ message: string }>("/public/inquiries", {
        method: "POST",
        body: JSON.stringify({
          property_id: propertyId,
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          message: message.trim(),
          preferred_contact: contactVia,
          website,
        }),
      });
      setDone(res.message);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Could not send");
    } finally {
      setSending(false);
    }
  }

  if (done)
    return (
      <div role="status" className="rounded-lg bg-green-50 p-5 text-sm text-green-800">
        <p className="font-semibold">Inquiry sent</p>
        <p className="mt-1">{done}</p>
      </div>
    );

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-3">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="iq-name">
          Your name
        </label>
        <input
          id="iq-name"
          className={inputClass}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="iq-phone">
          Phone
        </label>
        <input
          id="iq-phone"
          type="tel"
          className={inputClass}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="iq-email">
          Email
        </label>
        <input
          id="iq-email"
          type="email"
          className={inputClass}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
        {errors.contact && <p className="mt-1 text-xs text-red-600">{errors.contact}</p>}
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="iq-via">
          Preferred contact
        </label>
        <select
          id="iq-via"
          className={inputClass}
          value={contactVia}
          onChange={(e) => setContactVia(e.target.value)}
        >
          <option value="phone">Phone call</option>
          <option value="whatsapp">WhatsApp</option>
          <option value="email">Email</option>
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="iq-msg">
          Message
        </label>
        <textarea
          id="iq-msg"
          rows={4}
          maxLength={2000}
          className={inputClass}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>

      {/* Honeypot: hidden from people, bots tend to fill it */}
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <label htmlFor="iq-website">Website</label>
        <input
          id="iq-website"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      {serverError && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{serverError}</p>
      )}
      <Button type="submit" disabled={sending} className="w-full">
        {sending ? "Sending..." : "Send inquiry"}
      </Button>
    </form>
  );
}
