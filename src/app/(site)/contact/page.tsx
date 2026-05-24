"use client";

import Breadcrumb from "@/components/Common/Breadcrumb";
import SectionTitle from "@/components/Common/SectionTitle";
import { FormEvent, useState } from "react";
import toast from "react-hot-toast";

export default function ContactPage() {
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    const form = e.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") ?? "");
    const email = String(data.get("email") ?? "");
    const message = String(data.get("message") ?? "");

    const subject = encodeURIComponent("Nurture Collective inquiry");
    const body = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\n\n${message}`
    );
    window.location.href = `mailto:hello@nurturecollective.com?subject=${subject}&body=${body}`;

    toast.success("Opening your email app…");
    setSubmitting(false);
    form.reset();
  };

  return (
    <>
      <Breadcrumb pageName="Contact" />
      <section className="py-16">
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-xl">
            <SectionTitle
              title="We'd love to hear from you"
              subtitle="Questions about services, partnerships, or early access? Send us a note."
            />
            <form
              onSubmit={handleSubmit}
              className="mt-10 space-y-6 rounded-2xl border border-nurture-sage/15 bg-white p-8 shadow-sm"
            >
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-nurture-charcoal"
                >
                  Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="mt-2 w-full rounded-lg border border-nurture-sage/30 px-4 py-2.5 text-sm focus:border-nurture-sage focus:outline-none focus:ring-1 focus:ring-nurture-sage"
                />
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-nurture-charcoal"
                >
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="mt-2 w-full rounded-lg border border-nurture-sage/30 px-4 py-2.5 text-sm focus:border-nurture-sage focus:outline-none focus:ring-1 focus:ring-nurture-sage"
                />
              </div>
              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-medium text-nurture-charcoal"
                >
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  required
                  className="mt-2 w-full rounded-lg border border-nurture-sage/30 px-4 py-2.5 text-sm focus:border-nurture-sage focus:outline-none focus:ring-1 focus:ring-nurture-sage"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-full bg-nurture-sage py-3 text-sm font-semibold text-white hover:bg-nurture-sage-dark disabled:opacity-60"
              >
                {submitting ? "Sending…" : "Send message"}
              </button>
              <p className="text-center text-xs text-nurture-charcoal/50">
                Or email us directly at{" "}
                <a
                  href="mailto:hello@nurturecollective.com"
                  className="text-nurture-sage-dark hover:underline"
                >
                  hello@nurturecollective.com
                </a>
              </p>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}
