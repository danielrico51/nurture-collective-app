import { serverIntegrations } from "@/config/integrations";
import { forwardToN8n } from "@/lib/webhooks/n8n";
import type { ManagementTask } from "@/types/task";

export const syncClientTaskToN8n = async (
  task: ManagementTask,
  action: "create" | "update"
): Promise<void> => {
  if (task.category !== "client") return;

  try {
    await forwardToN8n(
      serverIntegrations.n8nTaskSyncWebhookUrl,
      serverIntegrations.n8nWebhookSecret,
      {
        action,
        task,
        syncedAt: new Date().toISOString(),
      }
    );
  } catch (error) {
    console.error("[tasks] ClickUp sync webhook failed:", error);
  }
};
