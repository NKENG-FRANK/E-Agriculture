import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/dashboard/settings")({
  head: () => ({ meta: [{ title: "Settings — SFMS" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const [notif, setNotif] = useState({ email: true, push: true, sms: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your profile, farm and notifications.</p>
      </div>

      <Section title="User profile" desc="Personal information">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" defaultValue="Alex Farmer" />
          <Field label="Email" defaultValue="alex@farm.com" type="email" />
          <Field label="Phone" defaultValue="+1 555 234 9988" />
          <Field label="Role" defaultValue="Owner" />
        </div>
      </Section>

      <Section title="Farm configuration" desc="Default values for your fields">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Farm name" defaultValue="Greenfield Estate" />
          <Field label="Location" defaultValue="Tuscany, Italy" />
          <Field label="Total area (ha)" defaultValue="11.5" />
          <Field label="Time zone" defaultValue="Europe/Rome" />
        </div>
      </Section>

      <Section title="Notification preferences" desc="Choose how to receive alerts">
        <div className="space-y-3">
          {[
            { k: "email" as const, label: "Email notifications" },
            { k: "push" as const, label: "Push notifications" },
            { k: "sms" as const, label: "SMS for critical alerts" },
          ].map((n) => (
            <label key={n.k} className="flex cursor-pointer items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
              <span className="text-sm font-medium">{n.label}</span>
              <input
                type="checkbox"
                checked={notif[n.k]}
                onChange={(e) => setNotif({ ...notif, [n.k]: e.target.checked })}
                className="h-5 w-5 rounded accent-primary"
              />
            </label>
          ))}
        </div>
      </Section>

      <div className="flex justify-end gap-3">
        <button className="rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-semibold hover:bg-muted">Cancel</button>
        <button className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:-translate-y-0.5">Save changes</button>
      </div>
    </div>
  );
}

function Section({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
      <div className="mb-5">
        <h2 className="font-display text-lg font-bold">{title}</h2>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      {children}
    </div>
  );
}

function Field({ label, defaultValue, type = "text" }: { label: string; defaultValue: string; type?: string }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      <input
        type={type}
        defaultValue={defaultValue}
        className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-primary"
      />
    </div>
  );
}
