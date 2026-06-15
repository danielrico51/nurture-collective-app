"use client";

import { fetchAdminEventsSettings } from "@/lib/api/eventsClient";
import type { ClassRegistrationAdminSettings } from "@/types/classRegistrationAdmin";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

const StatusBadge = ({ enabled }: { enabled: boolean }) => (
  <span
    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
      enabled
        ? "bg-nurture-sage/15 text-nurture-sage-dark"
        : "bg-nurture-charcoal/10 text-nurture-charcoal/55"
    }`}
  >
    {enabled ? "On" : "Off"}
  </span>
);

const SettingsRow = ({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) => (
  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-nurture-sage/10 py-3 last:border-b-0">
    <span className="text-sm text-nurture-charcoal/65">{label}</span>
    <span className="max-w-md text-right text-sm font-medium text-nurture-charcoal">
      {value?.trim() ? value : "—"}
    </span>
  </div>
);

const EventClassSettingsPanel = () => {
  const [settings, setSettings] = useState<ClassRegistrationAdminSettings | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const { settings: next } = await fetchAdminEventsSettings();
      setSettings(next);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to load settings"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  if (loading) {
    return (
      <p className="text-sm text-nurture-charcoal/60">Loading settings…</p>
    );
  }

  if (!settings) {
    return (
      <p className="text-sm text-nurture-charcoal/60">
        Settings are unavailable right now.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-serif text-xl font-semibold text-nurture-charcoal">
          Class registration settings
        </h3>
        <p className="mt-1 text-sm text-nurture-charcoal/65">
          Environment-backed configuration for emails, payments, calendar sync,
          and storage. Update values in Amplify env vars or `.env.local`, then
          redeploy.
        </p>
      </div>

      <section className="rounded-2xl border border-nurture-sage/15 bg-white p-5">
        <div className="flex items-center justify-between gap-3">
          <h4 className="font-semibold text-nurture-charcoal">Email delivery</h4>
          <StatusBadge enabled={settings.email.configured} />
        </div>
        <div className="mt-3">
          <SettingsRow label="Enabled" value={settings.email.enabled ? "Yes" : "No"} />
          <SettingsRow label="From" value={settings.email.from} />
          <SettingsRow label="Reply-to" value={settings.email.replyTo} />
          <SettingsRow label="Provider" value={settings.email.provider} />
          <SettingsRow label="Admin alert email" value={settings.email.adminEmail} />
        </div>
      </section>

      <section className="rounded-2xl border border-nurture-sage/15 bg-white p-5">
        <div className="flex items-center justify-between gap-3">
          <h4 className="font-semibold text-nurture-charcoal">Payments</h4>
          <StatusBadge
            enabled={
              settings.payments.stripeEnabled || settings.payments.venmoEnabled
            }
          />
        </div>
        <div className="mt-3">
          <SettingsRow
            label="Stripe (server)"
            value={settings.payments.stripeEnabled ? "Enabled" : "Disabled"}
          />
          <SettingsRow
            label="Venmo (server)"
            value={settings.payments.venmoEnabled ? "Enabled" : "Disabled"}
          />
          <SettingsRow label="Venmo handle" value={settings.payments.venmoHandle} />
          <SettingsRow
            label="Public checkout"
            value={
              settings.payments.publicPaymentsEnabled ? "Enabled" : "Disabled"
            }
          />
          <SettingsRow
            label="Public Venmo handle"
            value={settings.payments.publicVenmoHandle}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-nurture-sage/15 bg-white p-5">
        <div className="flex items-center justify-between gap-3">
          <h4 className="font-semibold text-nurture-charcoal">Google Calendar</h4>
          <StatusBadge enabled={settings.calendar.syncEnabled} />
        </div>
        <div className="mt-3">
          <SettingsRow label="Calendar ID" value={settings.calendar.calendarId} />
          <SettingsRow
            label="Delegated user"
            value={settings.calendar.delegatedUser}
          />
          {settings.calendar.embedUrl ? (
            <p className="mt-3 text-sm">
              <span className="text-nurture-charcoal/65">Classes calendar:</span>{" "}
              <a
                href={settings.calendar.embedUrl}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-nurture-sage-dark hover:underline"
              >
                Open embed view
              </a>
            </p>
          ) : null}
          <p className="mt-2 text-xs text-nurture-charcoal/55">
            Lead-call booking uses <code className="text-xs">GOOGLE_CALENDAR_ID</code>{" "}
            separately. Share the classes calendar above with{" "}
            <strong>{settings.calendar.delegatedUser ?? "admin@nesting-place.com"}</strong>{" "}
            (Make changes to events) or sync will fail with a permission error.
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-nurture-sage/15 bg-white p-5">
        <h4 className="font-semibold text-nurture-charcoal">Storage paths</h4>
        <div className="mt-3">
          <SettingsRow
            label="Deployment"
            value={settings.storage.deploymentEnvironment}
          />
          <SettingsRow label="Events bucket" value={settings.storage.eventsBucket} />
          <SettingsRow label="Events key" value={settings.storage.eventsKey} />
          <SettingsRow
            label="Registrations bucket"
            value={settings.storage.registrationsBucket}
          />
          <SettingsRow
            label="Registrations prefix"
            value={settings.storage.registrationsPrefix}
          />
          <p className="mt-2 text-xs text-nurture-charcoal/55">
            {settings.storage.deploymentEnvironment === "prod"
              ? "Production scope — events and registrations share the live site catalog."
              : `Isolated ${settings.storage.deploymentEnvironment} scope — changes here do not update the live site catalog.`}
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-nurture-sage/15 bg-white p-5">
        <h4 className="font-semibold text-nurture-charcoal">Public links</h4>
        <div className="mt-3 space-y-2 text-sm">
          <p>
            <span className="text-nurture-charcoal/65">Google Business book URL:</span>{" "}
            <a
              href={settings.links.bookClassesUrl}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-nurture-sage-dark hover:underline"
            >
              {settings.links.bookClassesUrl}
            </a>
          </p>
        </div>
        <p className="mt-4 text-xs text-nurture-charcoal/55">
          Env vars: `CLASS_REGISTRATION_ADMIN_EMAIL`,
          `CLASS_REGISTRATION_VENMO_HANDLE`,
          `CLASS_REGISTRATION_EMAIL_ENABLED`,
          `CLASS_EVENTS_GOOGLE_CALENDAR_ID`,
          `CLASS_REGISTRATION_PROVIDER_ACCESS_SECRET`.
        </p>
      </section>

      <button
        type="button"
        onClick={() => void loadSettings()}
        className="rounded-full border border-nurture-sage/30 px-4 py-2 text-sm font-medium text-nurture-sage-dark hover:bg-nurture-sage/10"
      >
        Refresh settings
      </button>
    </div>
  );
};

export default EventClassSettingsPanel;
