import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { formatMoney, formatDate } from '../../utils/formatters';
import { StatCard } from '../common/StatCard';
import {
  BarChart3,
  Calendar,
  Download,
  Printer,
  TrendingUp,
  Receipt,
  CreditCard,
  CheckCircle,
  Package,
  Users,
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { sales, expenses, debts, products, customers, settings, showToast } = useApp();

  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'year' | 'custom'>('month');
  const [customStart, setCustomStart] = useState(
    new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().split('T')[0]
  );
  const [customEnd, setCustomEnd] = useState(
    new Date().toISOString().split('T')[0]
  );

  // Filter sales and expenses by period
  const filteredSales = useMemo(() => {
    const now = new Date();
    return sales.filter((s) => {
      const d = new Date(s.date);
      if (period === 'today') {
        return (
          d.getFullYear() === now.getFullYear() &&
          d.getMonth() === now.getMonth() &&
          d.getDate() === now.getDate()
        );
      }
      if (period === 'week') {
        return d.getTime() >= now.getTime() - 7 * 24 * 3600 * 1000;
      }
      if (period === 'month') {
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      }
      if (period === 'year') {
        return d.getFullYear() === now.getFullYear();
      }
      if (period === 'custom') {
        const start = new Date(customStart);
        const end = new Date(customEnd);
        end.setHours(23, 59, 59, 999);
        return d >= start && d <= end;
      }
      return true;
    });
  }, [sales, period, customStart, customEnd]);

  const filteredExpenses = useMemo(() => {
    const now = new Date();
    return expenses.filter((e) => {
      const d = new Date(e.date);
      if (period === 'today') {
        return (
          d.getFullYear() === now.getFullYear() &&
          d.getMonth() === now.getMonth() &&
          d.getDate() === now.getDate()
        );
      }
      if (period === 'week') {
        return d.getTime() >= now.getTime() - 7 * 24 * 3600 * 1000;
      }
      if (period === 'month') {
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      }
      if (period === 'year') {
        return d.getFullYear() === now.getFullYear();
      }
      if (period === 'custom') {
        const start = new Date(customStart);
        const end = new Date(customEnd);
        end.setHours(23, 59, 59, 999);
        return d >= start && d <= end;
      }
      return true;
    });
  }, [expenses, period, customStart, customEnd]);

  // KPIs
  const turnover = filteredSales.reduce((acc, s) => acc + s.total, 0);
  const collected = filteredSales.reduce((acc, s) => acc + s.amountPaid, 0);
  const totalDebtsPeriod = filteredSales.reduce((acc, s) => acc + s.balanceDue, 0);
  const totalExpenses = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);

  // Cost of goods sold for filtered sales
  let cogs = 0;
  for (const s of filteredSales) {
    for (const item of s.items) {
      cogs += (item.purchasePrice || 0) * item.quantity;
    }
  }
  const grossProfit = turnover - cogs;
  const netEstimatedProfit = grossProfit - totalExpenses;

  // Top products
  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string; quantity: number; revenue: number }>();
    for (const s of filteredSales) {
      for (const item of s.items) {
        const existing = map.get(item.productId) || { name: item.productName, quantity: 0, revenue: 0 };
        existing.quantity += item.quantity;
        existing.revenue += item.subtotal;
        map.set(item.productId, existing);
      }
    }
    return Array.from(map.values()).sort((a, b) => b.quantity - a.quantity);
  }, [filteredSales]);

  // Top customers
  const topCustomers = useMemo(() => {
    const map = new Map<string, { name: string; count: number; spend: number }>();
    for (const s of filteredSales) {
      const key = s.customerId || s.customerName;
      const existing = map.get(key) || { name: s.customerName, count: 0, spend: 0 };
      existing.count += 1;
      existing.spend += s.total;
      map.set(key, existing);
    }
    return Array.from(map.values()).sort((a, b) => b.spend - a.spend);
  }, [filteredSales]);

  // Export to CSV
  const handleExportCsv = () => {
    let csv = 'ZANDO Pro - Rapport Financier & Commercial\n';
    csv += `Période sélectionnée : ${period}\n`;
    csv += `Chiffre d'affaires,${turnover}\n`;
    csv += `Encaissé,${collected}\n`;
    csv += `Dettes émises,${totalDebtsPeriod}\n`;
    csv += `Dépenses,${totalExpenses}\n`;
    csv += `Bénéfice net estimé,${netEstimatedProfit}\n\n`;

    csv += 'TOP PRODUITS\nNom,Quantite Vendue,Chiffre d\'affaires\n';
    for (const p of topProducts) {
      csv += `"${p.name}",${p.quantity},${p.revenue}\n`;
    }

    csv += '\nTOP CLIENTS\nClient,Nombre d\'achats,Total depense\n';
    for (const c of topCustomers) {
      csv += `"${c.name}",${c.count},${c.spend}\n`;
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapport_zandopro_${period}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Rapport exporté en fichier CSV (compatible Excel).', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Rapports d'Activité & Statistiques
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Analyse périodique des ventes, rentabilité nette et palmarès commercial.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg shadow-xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Imprimer</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Exporter CSV / Excel</span>
          </button>
        </div>
      </div>

      {/* Period Filter Selector */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'today', label: 'Aujourd\'hui' },
            { id: 'week', label: '7 derniers jours' },
            { id: 'month', label: 'Ce mois-ci' },
            { id: 'year', label: 'Cette année' },
            { id: 'custom', label: 'Période personnalisée' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setPeriod(tab.id as any)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
                period === tab.id
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {period === 'custom' && (
          <div className="flex items-center gap-2 text-xs">
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="py-1 px-2 border border-slate-300 rounded"
            />
            <span className="text-slate-400">à</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="py-1 px-2 border border-slate-300 rounded"
            />
          </div>
        )}
      </div>

      {/* Financial KPIs for Selected Period */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Chiffre d'Affaires Période"
          value={formatMoney(turnover, settings.currency)}
          subtitle={`${filteredSales.length} ventes sur la période`}
          icon={TrendingUp}
          tone="cyan"
        />

        <StatCard
          label="Montant Encaissé Période"
          value={formatMoney(collected, settings.currency)}
          subtitle={`Créances émises : ${formatMoney(totalDebtsPeriod, settings.currency)}`}
          icon={CheckCircle}
          tone="emerald"
        />

        <StatCard
          label="Dépenses d'Exploitation"
          value={formatMoney(totalExpenses, settings.currency)}
          subtitle={`${filteredExpenses.length} dépense(s) payée(s)`}
          icon={Receipt}
          tone="rose"
        />

        <StatCard
          label="Bénéfice Net Estimé"
          value={formatMoney(netEstimatedProfit, settings.currency)}
          subtitle={`Marge brute : ${formatMoney(grossProfit, settings.currency)}`}
          icon={BarChart3}
          tone="indigo"
        />
      </div>

      {/* Two Columns: Top Products & Top Customers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-cyan-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Produits les plus vendus sur la période
              </h3>
            </div>
            <span className="text-xs text-slate-400">{topProducts.length} référence(s)</span>
          </div>

          <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
            {topProducts.length === 0 ? (
              <p className="p-6 text-center text-xs text-slate-400 italic">
                Aucune vente enregistrée sur cette période.
              </p>
            ) : (
              topProducts.map((p, idx) => (
                <div key={idx} className="p-3.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="w-5 font-mono font-bold text-slate-400">
                      #{idx + 1}
                    </span>
                    <div>
                      <span className="font-bold text-slate-900 block">{p.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {p.quantity} unité(s) vendue(s)
                      </span>
                    </div>
                  </div>

                  <span className="font-mono font-bold text-slate-900 tabular-nums">
                    {formatMoney(p.revenue, settings.currency)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Customers */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Clients les plus actifs
              </h3>
            </div>
            <span className="text-xs text-slate-400">{topCustomers.length} client(s)</span>
          </div>

          <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
            {topCustomers.length === 0 ? (
              <p className="p-6 text-center text-xs text-slate-400 italic">
                Aucun client identifié sur cette période.
              </p>
            ) : (
              topCustomers.map((c, idx) => (
                <div key={idx} className="p-3.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="w-5 font-mono font-bold text-slate-400">
                      #{idx + 1}
                    </span>
                    <div>
                      <span className="font-bold text-slate-900 block">{c.name}</span>
                      <span className="text-[10px] text-slate-400">
                        {c.count} achat(s) réalisé(s)
                      </span>
                    </div>
                  </div>

                  <span className="font-mono font-bold text-emerald-600 tabular-nums">
                    {formatMoney(c.spend, settings.currency)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
