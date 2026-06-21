import { fetchWithRetry } from "@/lib/api/fetchWithRetry";
import type {
  AdminClientsResponse,
  ClientCommunication,
  ClientDetailResponse,
  ClientNoteType,
  ClientRecord,
  ClientStatus,
  CreateClientInput,
} from "@/types/client";
import type {
  ClientServiceWithInvoices,
  CreateClientServiceInput,
  CreateServiceInvoiceInput,
  ServiceInvoice,
  UpdateClientServiceInput,
  UpdateServiceInvoiceInput,
} from "@/types/clientService";

const authHeaders = async (): Promise<HeadersInit> => {
  const { fetchAuthSession } = await import("aws-amplify/auth");
  const session = await fetchAuthSession();
  const token = session.tokens?.idToken?.toString();
  if (!token) throw new Error("Not authenticated");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
};

const handleResponse = async <T>(response: Response): Promise<T> => {
  const text = await response.text();
  let data: Record<string, unknown> = {};
  if (text) {
    try {
      data = JSON.parse(text) as Record<string, unknown>;
    } catch {
      data = {};
    }
  }
  if (!response.ok) {
    const trimmed = text.trim();
    const isHtmlError =
      trimmed.startsWith("<!DOCTYPE") || trimmed.startsWith("<html");
    const message =
      typeof data.error === "string"
        ? data.error
        : isHtmlError
          ? `Server error (${response.status}). Try again in a moment.`
          : trimmed.slice(0, 200) || `Request failed (${response.status})`;
    throw new Error(message);
  }
  return data as T;
};

const adminGet = async <T>(url: string): Promise<T> => {
  const response = await fetchWithRetry(url, {
    headers: await authHeaders(),
    cache: "no-store",
  });
  return handleResponse<T>(response);
};

export const fetchAdminClients = async (
  includeArchived = false
): Promise<AdminClientsResponse> => {
  const params = includeArchived ? "?includeArchived=true" : "";
  return adminGet<AdminClientsResponse>(`/api/admin/clients${params}`);
};

export const fetchAdminClientDetail = async (
  clientId: string
): Promise<ClientDetailResponse> =>
  adminGet<ClientDetailResponse>(
    `/api/admin/clients/${encodeURIComponent(clientId)}`
  );

export const createAdminClient = async (
  payload: CreateClientInput
): Promise<{ client: ClientRecord }> => {
  const response = await fetch("/api/admin/clients", {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
};

export const updateAdminClient = async (
  clientId: string,
  payload: {
    status?: ClientStatus;
    name?: string;
    email?: string;
    phone?: string;
    coordinatorId?: string;
    locationZip?: string | null;
    tags?: string[];
    notesSummary?: string;
    archive?: boolean;
    restore?: boolean;
  }
): Promise<{ client: ClientRecord }> => {
  const response = await fetch(
    `/api/admin/clients/${encodeURIComponent(clientId)}`,
    {
      method: "PATCH",
      headers: await authHeaders(),
      body: JSON.stringify(payload),
    }
  );
  return handleResponse(response);
};

export const addAdminClientNote = async (
  clientId: string,
  body: string,
  type: ClientNoteType = "general"
): Promise<{ note: ClientDetailResponse["notes"][number] }> => {
  const response = await fetch(
    `/api/admin/clients/${encodeURIComponent(clientId)}/notes`,
    {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify({ body, type }),
    }
  );
  return handleResponse(response);
};

export const linkAdminClient = async (
  clientId: string,
  payload: { leadId?: string | null; cognitoSub?: string | null }
): Promise<{ client: ClientRecord }> => {
  const response = await fetch(
    `/api/admin/clients/${encodeURIComponent(clientId)}/link`,
    {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify(payload),
    }
  );
  return handleResponse(response);
};

export const convertLeadToClientRequest = async (
  leadId: string
): Promise<{ client: ClientRecord; created: boolean }> => {
  const response = await fetch("/api/admin/clients/from-lead", {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ leadId }),
  });
  return handleResponse(response);
};

export const fetchClientByLeadId = async (
  leadId: string
): Promise<{ client: ClientRecord | null }> =>
  adminGet<{ client: ClientRecord | null }>(
    `/api/admin/clients/by-lead/${encodeURIComponent(leadId)}`
  );

export const fetchClientServices = async (
  clientId: string
): Promise<{ services: ClientServiceWithInvoices[] }> =>
  adminGet<{ services: ClientServiceWithInvoices[] }>(
    `/api/admin/clients/${encodeURIComponent(clientId)}/services`
  );

export const createClientService = async (
  clientId: string,
  payload: CreateClientServiceInput
): Promise<{ service: ClientServiceWithInvoices }> => {
  const response = await fetch(
    `/api/admin/clients/${encodeURIComponent(clientId)}/services`,
    {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify(payload),
    }
  );
  return handleResponse(response);
};

export const updateClientService = async (
  clientId: string,
  serviceId: string,
  payload: UpdateClientServiceInput
): Promise<{ service: ClientServiceWithInvoices }> => {
  const response = await fetch(
    `/api/admin/clients/${encodeURIComponent(clientId)}/services/${encodeURIComponent(serviceId)}`,
    {
      method: "PATCH",
      headers: await authHeaders(),
      body: JSON.stringify(payload),
    }
  );
  return handleResponse(response);
};

export const createServiceInvoice = async (
  clientId: string,
  serviceId: string,
  payload: CreateServiceInvoiceInput
): Promise<{ invoice: ServiceInvoice; service: ClientServiceWithInvoices }> => {
  const response = await fetch(
    `/api/admin/clients/${encodeURIComponent(clientId)}/services/${encodeURIComponent(serviceId)}/invoices`,
    {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify(payload),
    }
  );
  return handleResponse(response);
};

export const updateServiceInvoice = async (
  clientId: string,
  serviceId: string,
  invoiceId: string,
  payload: UpdateServiceInvoiceInput
): Promise<{ invoice: ServiceInvoice; service: ClientServiceWithInvoices }> => {
  const response = await fetch(
    `/api/admin/clients/${encodeURIComponent(clientId)}/services/${encodeURIComponent(serviceId)}/invoices/${encodeURIComponent(invoiceId)}`,
    {
      method: "PATCH",
      headers: await authHeaders(),
      body: JSON.stringify(payload),
    }
  );
  return handleResponse(response);
};

export const fetchClientBilling = async (
  clientId: string
): Promise<{ orders: import("@/types/billing").PurchaseOrder[] }> =>
  adminGet<{ orders: import("@/types/billing").PurchaseOrder[] }>(
    `/api/admin/clients/${encodeURIComponent(clientId)}/billing`
  );

export const createClientBillingOrder = async (
  clientId: string,
  payload: {
    mode: "invoice" | "charge";
    lineItems: import("@/types/billing").PurchaseLineItem[];
    customerEmail?: string;
    customerName?: string;
  }
): Promise<{ order: import("@/types/billing").PurchaseOrder; payment: { checkoutUrl?: string; message?: string } }> => {
  const response = await fetch(
    `/api/admin/clients/${encodeURIComponent(clientId)}/billing`,
    {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify(payload),
    }
  );
  return handleResponse(response);
};

export const fetchClientCommunications = async (
  clientId: string
): Promise<{ communications: ClientCommunication[] }> =>
  adminGet<{ communications: ClientCommunication[] }>(
    `/api/admin/clients/${encodeURIComponent(clientId)}/communications`
  );

export const sendClientCommunication = async (
  clientId: string,
  payload: {
    to?: string;
    subject?: string;
    body?: string;
    template?: "welcome" | "proposal_follow_up";
  }
): Promise<{ communication: ClientCommunication }> => {
  const response = await fetch(
    `/api/admin/clients/${encodeURIComponent(clientId)}/communications`,
    {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify(payload),
    }
  );
  return handleResponse(response);
};
