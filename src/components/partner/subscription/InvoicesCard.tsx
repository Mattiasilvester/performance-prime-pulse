import React, { useState } from 'react';
import { Receipt, Download, ExternalLink, FileText } from 'lucide-react';
import { InvoiceExportModal } from './InvoiceExportModal';
import type { ExportableInvoice } from '@/services/invoiceExportService';

interface Invoice {
  id: string;
  stripe_invoice_id?: string | null;
  invoice_number?: string | null;
  amount: number; // DECIMAL nel database, già in euro
  currency: string;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  invoice_pdf_url?: string | null;
  invoice_date: string;
  paid_at?: string | null;
}

interface InvoicesCardProps {
  invoices: Invoice[];
  formatInvoiceAmount: (amount: number) => string;
  professionalName?: string;
}

export function InvoicesCard({ invoices, formatInvoiceAmount, professionalName }: InvoicesCardProps) {
  const [showExportModal, setShowExportModal] = useState(false);

  // Converte Invoice[] a ExportableInvoice[] (amount in euro -> amount_cents)
  const exportableInvoices: ExportableInvoice[] = invoices.map((inv) => ({
    id: inv.id,
    invoice_date: inv.invoice_date,
    amount_cents: Math.round(inv.amount * 100), // Converti euro a centesimi
    status: inv.status,
    stripe_invoice_id: inv.stripe_invoice_id || undefined,
    invoice_pdf_url: inv.invoice_pdf_url || undefined,
  }));
  
  // Formatta la data in italiano
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // Badge per lo stato della fattura
  const getStatusBadge = (status: Invoice['status']) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700 border border-green-200">
            Pagata
          </span>
        );
      case 'open':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">
            In attesa
          </span>
        );
      case 'draft':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200">
            Bozza
          </span>
        );
      case 'void':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-50 text-gray-500 border border-gray-200">
            Annullata
          </span>
        );
      case 'uncollectible':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700 border border-red-200">
            Non riscuotibile
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
            <Receipt className="w-5 h-5 text-gray-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Storico fatture</h2>
        </div>
        
        {/* Bottone export */}
        {invoices.length > 0 && (
          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Esporta
          </button>
        )}
      </div>

      {invoices.length > 0 ? (
        /* Lista fatture */
        <div className="space-y-3">
          {invoices.map((invoice) => (
            <div
              key={invoice.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white rounded flex items-center justify-center border border-gray-200">
                  <FileText className="w-4 h-4 text-gray-500" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {formatInvoiceAmount(invoice.amount)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatDate(invoice.invoice_date)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {getStatusBadge(invoice.status)}
                
                {invoice.invoice_pdf_url && (
                  <a
                    href={invoice.invoice_pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white rounded-lg transition-colors"
                    title="Scarica PDF"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Nessuna fattura */
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Receipt className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-gray-500">Nessuna fattura disponibile</p>
          <p className="text-sm text-gray-400 mt-1">
            Le fatture appariranno qui dopo il primo pagamento
          </p>
        </div>
      )}

      {/* Link a tutte le fatture (se ce ne sono) */}
      {invoices.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <a
            href="https://billing.stripe.com/p/login/test" // Sostituire con link reale al portale Stripe
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Vedi tutte le fatture su Stripe
          </a>
        </div>
      )}

      {/* Modal export */}
      <InvoiceExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        invoices={exportableInvoices}
        professionalName={professionalName}
      />
    </div>
  );
}
