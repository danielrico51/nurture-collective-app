import InvoicePrintPage from "@/components/Invoice/InvoicePrintPage";
import { buildPageMetadata, noIndexMetadata } from "@/config/seo";
import {
  extractInvoiceHtmlBody,
  getPublicInvoiceDocument,
} from "@/lib/invoices/publicDocument";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface InvoicePrintRouteProps {
  params: { token: string };
}

export async function generateMetadata({
  params,
}: InvoicePrintRouteProps): Promise<Metadata> {
  const doc = await getPublicInvoiceDocument(decodeURIComponent(params.token));
  return {
    ...buildPageMetadata({
      title: doc ? `Invoice ${doc.invoice.invoiceNumber}` : "Invoice",
      description: doc
        ? `Download or print invoice ${doc.invoice.invoiceNumber} from The Nesting Place.`
        : "Invoice download",
      path: "/invoice",
    }),
    ...noIndexMetadata,
  };
}

export default async function InvoicePrintRoute({ params }: InvoicePrintRouteProps) {
  const doc = await getPublicInvoiceDocument(decodeURIComponent(params.token));
  if (!doc) notFound();

  return (
    <InvoicePrintPage
      invoiceNumber={doc.invoice.invoiceNumber}
      bodyHtml={extractInvoiceHtmlBody(doc.html)}
    />
  );
}
