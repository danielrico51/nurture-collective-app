export interface QuickBooksTokenSet {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  realmId: string;
  updatedAt: string;
}

export interface QuickBooksRef {
  value: string;
  name?: string;
}

export interface QuickBooksInvoiceLine {
  Amount: number;
  DetailType: "SalesItemLineDetail";
  Description?: string;
  SalesItemLineDetail: {
    ItemRef?: QuickBooksRef;
    Qty?: number;
    UnitPrice?: number;
  };
}

export interface QuickBooksCreateInvoiceInput {
  customerId: string;
  lineItems: Array<{
    amount: number;
    description: string;
    quantity?: number;
    unitPrice?: number;
    itemId?: string;
  }>;
  /** Used when a line omits itemId (e.g. e-commerce orders). Service invoices must set itemId per line. */
  defaultItemId?: string;
  dueDate?: string;
  docNumber?: string;
  privateNote?: string;
  customerMemo?: string;
  billEmail?: string;
  allowOnlineCreditCardPayment?: boolean;
  allowOnlineAchPayment?: boolean;
}

export interface QuickBooksInvoice {
  Id: string;
  DocNumber?: string;
  TotalAmt?: number;
  Balance?: number;
  DueDate?: string;
  CustomerRef?: QuickBooksRef;
  SyncToken?: string;
  InvoiceLink?: string;
  Line?: QuickBooksInvoiceLine[];
}

export interface QuickBooksCustomer {
  Id: string;
  DisplayName: string;
  PrimaryEmailAddr?: { Address: string };
  SyncToken?: string;
}

export interface QuickBooksCreateCustomerInput {
  displayName: string;
  email: string;
  givenName?: string;
  familyName?: string;
}

export interface QuickBooksWebhookPayload {
  eventNotifications?: Array<{
    realmId: string;
    dataChangeEvent?: {
      entities?: Array<{
        name: string;
        id: string;
        operation: string;
        lastUpdated: string;
      }>;
    };
  }>;
}

export interface QuickBooksApiError {
  Fault?: {
    Error?: Array<{
      Message?: string;
      Detail?: string;
      code?: string;
    }>;
  };
}
