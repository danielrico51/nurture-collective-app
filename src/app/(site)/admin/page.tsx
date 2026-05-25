"use client";

import { AdminAppGrid } from "@/components/Admin/AdminAppGrid";

export default function AdminHubPage() {
  return (
    <div>
      <h2 className="font-serif text-2xl font-semibold text-nurture-charcoal">
        Choose an app
      </h2>
      <p className="mt-2 text-sm text-nurture-charcoal/65">
        Each tool below is restricted to members of the admin Cognito group.
      </p>
      <div className="mt-8">
        <AdminAppGrid />
      </div>
    </div>
  );
}
