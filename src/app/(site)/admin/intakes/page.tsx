import { redirect } from "next/navigation";

/** Intake queue merged into Lead CRM — keep old URL working. */
export default function AdminIntakesPage() {
  redirect("/admin/leads");
}
