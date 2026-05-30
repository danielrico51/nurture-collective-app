export interface IntakeSubmitRequest {
  first_name: string;
  last_name?: string;
  phone?: string;
  email?: string;
  service_requested: string;
  message?: string;
  source?: string;
  /** Explicit SMS opt-in for Twilio compliance (contact form checkbox). */
  sms_consent?: boolean;
}

export interface EnrichedIntakeLead extends IntakeSubmitRequest {
  lead_id: string;
  created_at: string;
  updated_at: string;
  status: "new";
  version: 1;
  lead_source: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  service_requested: string;
  message: string;
  sms_consent: boolean;
}

export interface IntakeSubmitSuccessResponse {
  success: true;
  lead_id: string;
  forwarded: boolean;
  stored: boolean;
}

export interface IntakeSubmitErrorResponse {
  success: false;
  error: string;
  code?: string;
}

export interface IntakeHealthResponse {
  status: "healthy" | "degraded" | "unhealthy";
  n8n: "connected" | "configured" | "not_configured";
  storage: "ready" | "local" | "not_configured";
}
