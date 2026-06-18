"use client";

interface InvoicePrintPageProps {
  invoiceNumber: string;
  bodyHtml: string;
}

const InvoicePrintPage = ({ invoiceNumber, bodyHtml }: InvoicePrintPageProps) => {
  return (
    <div className="min-h-screen bg-[#f7f4f1]">
      <div className="no-print sticky top-0 z-10 border-b border-[#e8e2da] bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#2f2a26]">
              Invoice {invoiceNumber}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-[#6b6560]">
              Save a PDF for your insurance or records. Choose{" "}
              <strong>Save as PDF</strong> (or &quot;Print to PDF&quot;) in the
              print dialog.
            </p>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex shrink-0 items-center justify-center rounded-full bg-[#6b8f7a] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#5a7a68]"
          >
            Save as PDF
          </button>
        </div>
      </div>

      <div
        className="invoice-print-body"
        dangerouslySetInnerHTML={{ __html: bodyHtml }}
      />

      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: #fff !important;
          }
          .invoice-print-body {
            padding: 0 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default InvoicePrintPage;
