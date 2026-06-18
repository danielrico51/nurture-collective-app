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
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof data.error === "string" ? data.error : "Request failed");
  }
  return data as T;
};

export const fetchAdminClients = async (
  includeArchived = false
): Promise<AdminClientsResponse> => {
  const params = includeArchived ? "?includeArchived=true" : "";
  const response = await fetch(`/api/admin/clients${params}`, {
    headers: await authHeaders(),
    cache: "no-store",
  });
  return handleResponse<AdminClientsResponse>(response);
};

export const fetchAdminClientDetail = async (
  clientId: string
): Promise<ClientDetailResponse> => {
  const response = await fetch(
    `/api/admin/clients/${encodeURIComponent(clientId)}`,
    { headers: await authHeaders(), cache: "no-store" }
  );
  return handleResponse<ClientDetailResponse>(response);
};

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
): Promise<{ client: ClientRecord | null }> => {
  const response = await fetch(
    `/api/admin/clients/by-lead/${encodeURIComponent(leadId)}`,
    { headers: await authHeaders(), cache: "no-store" }
  );
  return handleResponse<{ client: ClientRecord | null }>(response);
};

export const fetchClientServices = async (
  clientId: string
): Promise<{ services: ClientServiceWithInvoices[] }> => {
  const response = await fetch(
    `/api/admin/clients/${encodeURIComponent(clientId)}/services`,
    { headers: await authHeaders(), cache: "no-store" }
  );
  return handleResponse(response);
};

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
): Promise<{ orders: import("@/types/billing").PurchaseOrder[] }> => {
  const response = await fetch(
    `/api/admin/clients/${encodeURIComponent(clientId)}/billing`,
    { headers: await authHeaders(), cache: "no-store" }
  );
  return handleResponse<{ orders: import("@/types/billing").PurchaseOrder[] }>(response);
};

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
): Promise<{ communications: ClientCommunication[] }> => {
  const response = await fetch(
    `/api/admin/clients/${encodeURIComponent(clientId)}/communications`,
    { headers: await authHeaders(), cache: "no-store" }
  );
  return handleResponse<{ communications: ClientCommunication[] }>(response);
};

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
