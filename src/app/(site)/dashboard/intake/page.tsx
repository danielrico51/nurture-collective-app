import { redirect } from "next/navigation";

export default function LegacyDashboardIntakeRedirect() {
  redirect("/apps/dashboard/intake");
}
