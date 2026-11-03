import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Sale, Debt } from '../../types';
import { formatMoney, formatDateTime, formatDate } from '../../utils/formatters';
import { defaultLogoUrl, getValidImageUrl } from '../../utils/assets';
import { Printer, Download, X, FileText, CheckCircle2 } from 'lucide-react';

interface InvoiceDocumentProps {
  sale?: Sale;
  debt?: Debt;
  onClose: () => void;
  defaultMode?: 'A4' | 'TICKET';
}

export const InvoiceDocument: React.FC<InvoiceDocumentProps> = ({
  sale,
  debt,
  onClose,
  defaultMode = 'A4',
}) => {
  const { settings, showToast } = useApp();
  const [printFormat, setPrintFormat] = useState<'A4' | 'TICKET'>(defaultMode);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    // Triggers standard print-to-PDF or shows ready toast
    showToast('Utilisez "Enregistrer au format PDF" dans la boîte de dialogue d\'impression.', 'info');
    setTimeout(() => {
      window.print();
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-4 max-h-[92vh] flex flex-col">
        {/* Action Header (Hidden during actual print) */}
        <div className="no-print flex items-center justify-between px-6 py-3.5 bg-slate-900 text-white border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-cyan-400" />
            <span className="text-sm font-bold tracking-tight">
              {sale ? `Facture / Reçu : ${sale.saleNumber}` : `Reçu de dette : ${debt?.saleNumber}`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Format toggle: A4 vs Ticket 80mm */}
            <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
              <button
                onClick={() => setPrintFormat('A4')}
                className={`px-3 py-1 text-xs font-semibold rounded ${
                  printFormat === 'A4' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white'
                }`}
              >
                Format A4
              </button>
              <button
                onClick={() => setPrintFormat('TICKET')}
                className={`px-3 py-1 text-xs font-semibold rounded ${
                  printFormat === 'TICKET' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white'
                }`}
              >
                Ticket 80mm
              </button>
            </div>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold rounded-lg transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimer</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors ml-2"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Document Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100/60 flex justify-center">
          {printFormat === 'A4' ? (
            /* --- FORMAT A4 --- */
            <div className="print-a4 bg-white w-full max-w-[210mm] min-h-[297mm] p-8 sm:p-12 shadow-sm border border-slate-200 text-slate-900 rounded-lg flex flex-col justify-between">
              <div>
                {/* Header: Company & Invoice Info */}
                <div className="flex items-start justify-between border-b border-slate-200 pb-8">
                  <div className="flex items-start gap-4">
                    <img
                      src={getValidImageUrl(settings.logoUrl, defaultLogoUrl)}
                      alt="Logo"
                      className="w-16 h-16 rounded-lg object-cover ring-1 ring-slate-200"
                    />
                    <div>
                      <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
                        {settings.companyName}
                      </h1>
                      <p className="text-xs text-slate-500 mt-0.5">{settings.tagline}</p>
                      <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                        {settings.address}
                        <br />
                        Tél : {settings.phone} · Email : {settings.email}
                        <br />
                        <span className="font-mono text-[11px] text-slate-500">RCCM : {settings.taxId}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="inline-block px-3 py-1 rounded bg-slate-100 text-slate-800 text-xs font-bold tracking-wider uppercase mb-2">
                      {sale ? (sale.status === 'PARTIEL' ? 'FACTURE (AVANCE)' : 'FACTURE ACQUITTÉE') : 'REÇU DE CRÉANCE'}
                    </span>
                    <h2 className="text-lg font-bold font-mono text-slate-900">
                      {sale ? sale.saleNumber : debt?.saleNumber}
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Date : {formatDateTime(sale ? sale.date : debt?.createdAt || '')}
                    </p>
                    <p className="text-xs text-slate-500">
                      Caissier : {sale?.cashierName || 'Administration'}
                    </p>
                  </div>
                </div>

                {/* Client Box */}
                <div className="my-6 p-4 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                      Facturé à :
                    </span>
                    <span className="text-sm font-bold text-slate-900">
                      {sale?.customerName || debt?.customerName || 'Client Comptoir'}
                    </span>
                    {(sale?.customerPhone || debt?.customerPhone) && (
                      <span className="block text-slate-600 mt-0.5">
                        Tél : {sale?.customerPhone || debt?.customerPhone}
                      </span>
                    )}
                  </div>

                  <div className="text-right">
                    <span className="font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                      Mode de règlement :
                    </span>
                    <span className="font-bold text-slate-800">
                      {sale?.paymentMethod || 'ESPECES'}
                    </span>
                  </div>
                </div>

                {/* Items Table (if Sale) */}
                {sale && (
                  <div className="mt-4">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b-2 border-slate-300 text-slate-600 font-bold uppercase tracking-wider">
                          <th className="py-2.5">Réf.</th>
                          <th className="py-2.5">Désignation</th>
                          <th className="py-2.5 text-center">Qté</th>
                          <th className="py-2.5 text-right">Prix Unitaire</th>
                          <th className="py-2.5 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {sale.items.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-3 font-mono text-slate-500">{item.reference}</td>
                            <td className="py-3 font-medium text-slate-900">{item.productName}</td>
                            <td className="py-3 text-center font-mono">{item.quantity}</td>
                            <td className="py-3 text-right font-mono tabular-nums">
                              {formatMoney(item.unitPrice, settings.currency)}
                            </td>
                            <td className="py-3 text-right font-mono font-semibold tabular-nums">
                              {formatMoney(item.subtotal, settings.currency)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Summary Math */}
                    <div className="mt-6 border-t-2 border-slate-200 pt-4 flex justify-end">
                      <div className="w-64 space-y-2 text-xs">
                        <div className="flex justify-between text-slate-600">
                          <span>Sous-total HT :</span>
                          <span className="font-mono tabular-nums">{formatMoney(sale.subtotal, settings.currency)}</span>
                        </div>
                        {sale.discount > 0 && (
                          <div className="flex justify-between text-emerald-600 font-medium">
                            <span>Remise accordée :</span>
                            <span className="font-mono tabular-nums">-{formatMoney(sale.discount, settings.currency)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-base font-bold text-slate-900 border-t border-slate-200 pt-2">
                          <span>NET À PAYER :</span>
                          <span className="font-mono tabular-nums">{formatMoney(sale.total, settings.currency)}</span>
                        </div>
                        <div className="flex justify-between text-slate-700 pt-1">
                          <span>Montant versé :</span>
                          <span className="font-mono font-semibold tabular-nums">{formatMoney(sale.amountPaid, settings.currency)}</span>
                        </div>
                        {sale.balanceDue > 0 ? (
                          <div className="flex justify-between text-rose-600 font-bold border-t border-rose-200 pt-1">
                            <span>Reste à payer (Dette) :</span>
                            <span className="font-mono tabular-nums">{formatMoney(sale.balanceDue, settings.currency)}</span>
                          </div>
                        ) : (
                          <div className="flex justify-between text-slate-600">
                            <span>Monnaie rendue :</span>
                            <span className="font-mono tabular-nums">{formatMoney(sale.changeGiven, settings.currency)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* If Debt Repayments receipt */}
                {debt && (
                  <div className="mt-4 space-y-4">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Montant initial de la créance :</span>
                        <span className="font-mono font-bold">{formatMoney(debt.initialAmount, settings.currency)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Total déjà remboursé :</span>
                        <span className="font-mono font-bold text-emerald-600">{formatMoney(debt.paidAmount, settings.currency)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-bold border-t border-slate-200 pt-2 text-rose-600">
                        <span>Solde restant dû :</span>
                        <span className="font-mono">{formatMoney(debt.remainingAmount, settings.currency)}</span>
                      </div>
                    </div>

                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mt-4">
                      Historique des règlements
                    </h4>
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500">
                          <th className="py-2">Date</th>
                          <th className="py-2">Mode</th>
                          <th className="py-2">Caissier</th>
                          <th className="py-2 text-right">Montant</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {debt.repayments.map((rep, idx) => (
                          <tr key={idx}>
                            <td className="py-2">{formatDateTime(rep.date)}</td>
                            <td className="py-2">{rep.paymentMethod}</td>
                            <td className="py-2">{rep.cashierName}</td>
                            <td className="py-2 text-right font-mono font-bold text-emerald-600">
                              {formatMoney(rep.amount, settings.currency)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Document Footer */}
              <div className="mt-12 pt-6 border-t border-slate-200 text-center text-[11px] text-slate-500 space-y-1">
                <p className="font-medium text-slate-700">{settings.invoiceFooterNote}</p>
                <p>Édité via le logiciel ZANDO Pro · Logiciel de gestion commerciale certifié</p>
              </div>
            </div>
          ) : (
            /* --- FORMAT TICKET THERMIQUE 80MM --- */
            <div className="print-ticket bg-white w-full max-w-[80mm] p-4 shadow-sm border border-slate-200 text-slate-900 rounded font-mono text-[11px]">
              {/* Header */}
              <div className="text-center pb-3 border-b border-dashed border-slate-400">
                <h2 className="font-bold text-sm tracking-tight">{settings.companyName}</h2>
                <p className="text-[10px] text-slate-600">{settings.tagline}</p>
                <p className="text-[10px] mt-1">{settings.address}</p>
                <p className="text-[10px]">Tél : {settings.phone}</p>
              </div>

              {/* Meta */}
              <div className="py-2 border-b border-dashed border-slate-400 space-y-0.5 text-[10px]">
                <div>N° : {sale ? sale.saleNumber : debt?.saleNumber}</div>
                <div>Date : {formatDateTime(sale ? sale.date : debt?.createdAt || '')}</div>
                <div>Caissier : {sale?.cashierName || 'Standard'}</div>
                <div>Client : {sale?.customerName || debt?.customerName || 'Comptoir'}</div>
              </div>

              {/* Lines */}
              {sale && (
                <div className="py-2 border-b border-dashed border-slate-400">
                  <div className="grid grid-cols-12 font-bold mb-1">
                    <span className="col-span-6">Article</span>
                    <span className="col-span-2 text-center">Qté</span>
                    <span className="col-span-4 text-right">Total</span>
                  </div>
                  {sale.items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 py-0.5">
                      <span className="col-span-6 truncate">{item.productName}</span>
                      <span className="col-span-2 text-center">{item.quantity}</span>
                      <span className="col-span-4 text-right font-bold">
                        {Math.round(item.subtotal).toLocaleString('fr-FR')}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Totals */}
              <div className="py-2 border-b border-dashed border-slate-400 space-y-1">
                {sale && (
                  <>
                    <div className="flex justify-between font-bold text-xs pt-1">
                      <span>TOTAL :</span>
                      <span>{formatMoney(sale.total, settings.currency)}</span>
                    </div>
                    {sale.discount > 0 && (
                      <div className="flex justify-between text-[10px]">
                        <span>Remise :</span>
                        <span>-{formatMoney(sale.discount, settings.currency)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-[10px]">
                      <span>Montant reçu :</span>
                      <span>{formatMoney(sale.amountPaid, settings.currency)}</span>
                    </div>
                    {sale.balanceDue > 0 ? (
                      <div className="flex justify-between text-[10px] font-bold text-rose-600">
                        <span>RESTE DÛ :</span>
                        <span>{formatMoney(sale.balanceDue, settings.currency)}</span>
                      </div>
                    ) : (
                      <div className="flex justify-between text-[10px]">
                        <span>Monnaie :</span>
                        <span>{formatMoney(sale.changeGiven, settings.currency)}</span>
                      </div>
                    )}
                  </>
                )}

                {debt && (
                  <>
                    <div className="flex justify-between font-bold">
                      <span>SOLDE RESTANT :</span>
                      <span>{formatMoney(debt.remainingAmount, settings.currency)}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="text-center pt-3 text-[9px] text-slate-600 space-y-1">
                <p>*** MERCI DE VOTRE VISITE ***</p>
                <p>{settings.receiptHeaderNote}</p>
                <p>Conservez ce ticket en cas de réclamation.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
