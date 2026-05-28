export { postSlackMessage } from "@/lib/integrations/slack/client";
export { parseCalendlyConsultBooked } from "@/lib/integrations/slack/calendly";
export {
  notifyConsultBooked,
  notifyIntakeCompleted,
  notifyLeadPipelineEvent,
  notifyLeadStatusChanged,
  notifyNewLead,
  shouldNotifyIntakeCompleted,
  shouldNotifyNewLead,
  shouldNotifyStatusChange,
} from "@/lib/integrations/slack/pipeline";
