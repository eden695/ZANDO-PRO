import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Sale } from '../../types';
import { formatMoney, formatDate, formatDateTime } from '../../utils/formatters';
import {
  FileText,
  Search,
  Printer,
  Download,
  Eye,
  CheckCircle,
  Clock,
  Filter,
} from 'lucide-react';

export const InvoicesView: React.FC = () => {
  const { sales, settings, setPreviewDocument } = useApp();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLET' | 'PARTIEL'>('ALL');

  const filteredInvoices = useMemo(() => {
    return sales.filter((s) => {
      const matchSearch =
        s.saleNumber.toLowerCase().includes(search.toLowerCase()) ||
        s.customerName.toLowerCase().includes(search.toLowerCase()) ||
        s.cashierName.toLowerCase().includes(search.toLowerCase());
      const matchStatus =
        statusFilter === 'ALL' || s.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [sales, search, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Factures & Reçus Commerciaux
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Documents comptables imprimables aux formats A4 professionnel et ticket thermique 80 mm.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>Total factures émises :</span>
          <span className="font-mono font-bold text-slate-900">{sales.length}</span>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par numéro de facture, client, caissier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-1">
          {[
            { label: 'Toutes', val: 'ALL' },
            { label: 'Acquittées', val: 'COMPLET' },
            { label: 'Partielles (Avances)', val: 'PARTIEL' },
          ].map((tab) => (
            <button
              key={tab.val}
              onClick={() => setStatusFilter(tab.val as any)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                statusFilter === tab.val
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">N° Document</th>
                <th className="py-3 px-4">Date d'émission</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Nombre d'articles</th>
                <th className="py-3 px-4 text-right">Montant Total</th>
                <th className="py-3 px-4 text-right">Encaissé</th>
                <th className="py-3 px-4 text-right">Solde Dû</th>
                <th className="py-3 px-4 text-center">Statut Facture</th>
                <th className="py-3 px-4 text-right">Options d'impression</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Aucun document trouvé.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-cyan-600 shrink-0" />
                        <span className="font-mono font-bold text-slate-900">
                          {sale.saleNumber}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-slate-500 font-mono">
                      {formatDateTime(sale.date)}
                    </td>

                    <td className="py-3 px-4 font-medium text-slate-900">
                      {sale.customerName}
                    </td>

                    <td className="py-3 px-4 text-slate-600 font-mono">
                      {sale.items.reduce((s, i) => s + i.quantity, 0)} pièce(s)
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                      {formatMoney(sale.total, settings.currency)}
                    </td>

                    <td className="py-3 px-4 text-right font-mono text-emerald-600 font-medium tabular-nums">
                      {formatMoney(sale.amountPaid, settings.currency)}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-rose-600 tabular-nums">
                      {sale.balanceDue > 0 ? formatMoney(sale.balanceDue, settings.currency) : '0'}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          sale.status === 'COMPLET'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {sale.status === 'COMPLET' ? 'Acquittée' : 'Facture d\'avance'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setPreviewDocument({ type: 'invoice', sale, defaultMode: 'A4' })}
                          className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded-lg text-[11px] flex items-center gap-1 transition-colors"
                          title="Imprimer ou exporter en A4"
                        >
                          <Printer className="w-3 h-3 text-slate-500" />
                          <span>A4</span>
                        </button>

                        <button
                          onClick={() => setPreviewDocument({ type: 'invoice', sale, defaultMode: 'TICKET' })}
                          className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded-lg text-[11px] flex items-center gap-1 transition-colors"
                          title="Imprimer ticket caisse 80mm"
                        >
                          <Printer className="w-3 h-3 text-cyan-600" />
                          <span>Ticket 80mm</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
