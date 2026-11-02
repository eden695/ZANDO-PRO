import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { computeFinancialSummary } from '../../services/financialEngine';
import { formatMoney, formatDateTime } from '../../utils/formatters';
import { StatCard } from '../common/StatCard';
import {
  TrendingUp,
  CreditCard,
  AlertTriangle,
  Receipt,
  ShoppingCart,
  ClipboardList,
  Users,
  Package,
  PlusCircle,
  Sparkles,
  ArrowRight,
  Eye,
  CheckCircle,
  Clock,
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const {
    sales,
    expenses,
    debts,
    orders,
    products,
    customers,
    settings,
    setActiveTab,
    setPreviewDocument,
  } = useApp();

  const summary = useMemo(() => {
    return computeFinancialSummary(sales, expenses, debts, orders, products, customers);
  }, [sales, expenses, debts, orders, products, customers]);

  // Recent sales (top 5)
  const recentSales = useMemo(() => {
    return [...sales]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [sales]);

  // Recent orders (top 4)
  const recentOrders = useMemo(() => {
    return [...orders]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 4);
  }, [orders]);

  // Critical stock products
  const criticalProducts = useMemo(() => {
    return products.filter(
      (p) => p.stockQuantity === 0 || p.stockQuantity <= p.lowStockThreshold
    );
  }, [products]);

  // Expense categories breakdown
  const expenseBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    for (const exp of expenses) {
      map.set(exp.category, (map.get(exp.category) || 0) + exp.amount);
    }
    return Array.from(map.entries())
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: summary.totalExpenses > 0 ? (amount / summary.totalExpenses) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [expenses, summary.totalExpenses]);

  return (
    <div className="space-y-6">
      {/* Top Welcome / Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Tableau de bord commercial
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Indicateurs en temps réel calculés d'après les opérations de {settings.companyName}.
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('sales')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
          >
            <ShoppingCart className="w-3.5 h-3.5 text-cyan-400" />
            <span>Faire une Vente</span>
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 shadow-xs transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5 text-slate-500" />
            <span>Nouveau Produit</span>
          </button>

          <button
            onClick={() => setActiveTab('expenses')}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 shadow-xs transition-colors"
          >
            <Receipt className="w-3.5 h-3.5 text-slate-500" />
            <span>Dépense</span>
          </button>

          <button
            onClick={() => setActiveTab('assistant')}
            className="flex items-center gap-1.5 px-3 py-2 bg-cyan-50 hover:bg-cyan-100 text-cyan-900 text-xs font-bold rounded-lg border border-cyan-200 shadow-xs transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
            <span>Poser une question</span>
          </button>
        </div>
      </div>

      {/* Critical Stock Alert Banner if any */}
      {criticalProducts.length > 0 && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong className="font-semibold">{criticalProducts.length} produit(s)</strong> en stock faible ou rupture :{' '}
              {criticalProducts.slice(0, 3).map((p) => p.name).join(', ')}
              {criticalProducts.length > 3 && ` et ${criticalProducts.length - 3} autre(s)`}.
            </span>
          </div>
          <button
            onClick={() => setActiveTab('products')}
            className="font-bold underline hover:text-amber-950 shrink-0"
          >
            Gérer les stocks
          </button>
        </div>
      )}

      {/* Key Financial KPIs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Chiffre d'affaires facturé"
          value={formatMoney(summary.turnover, settings.currency)}
          subtitle={`${summary.salesCount} ventes totales réalisées`}
          icon={TrendingUp}
          tone="cyan"
          onClick={() => setActiveTab('sales')}
        />

        <StatCard
          label="Montant réellement encaissé"
          value={formatMoney(summary.totalCollected, settings.currency)}
          subtitle={`Caisse espèces : ${formatMoney(summary.cashRegisterTheoretical, settings.currency)}`}
          icon={CheckCircle}
          tone="emerald"
          onClick={() => setActiveTab('reports')}
        />

        <StatCard
          label="Créances clients à recouvrer"
          value={formatMoney(summary.totalOutstandingDebts, settings.currency)}
          subtitle={`${debts.filter((d) => d.status !== 'SOLDEE').length} dossier(s) de dette en cours`}
          icon={CreditCard}
          tone={summary.totalOutstandingDebts > 0 ? 'rose' : 'default'}
          onClick={() => setActiveTab('debts')}
        />

        <StatCard
          label="Bénéfice net estimé"
          value={formatMoney(summary.netEstimatedProfit, settings.currency)}
          subtitle={`Dépenses totales : ${formatMoney(summary.totalExpenses, settings.currency)}`}
          icon={Receipt}
          tone="indigo"
          onClick={() => setActiveTab('reports')}
        />
      </div>

      {/* Secondary Operational Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          onClick={() => setActiveTab('orders')}
          className="p-3.5 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-slate-300 transition-colors"
        >
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <ClipboardList className="w-3.5 h-3.5 text-cyan-500" />
            <span>Commandes en cours</span>
          </div>
          <div className="mt-1.5 text-lg font-bold font-mono text-slate-900">
            {summary.pendingOrdersCount}
          </div>
        </div>

        <div
          onClick={() => setActiveTab('customers')}
          className="p-3.5 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-slate-300 transition-colors"
        >
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <Users className="w-3.5 h-3.5 text-indigo-500" />
            <span>Clients enregistrés</span>
          </div>
          <div className="mt-1.5 text-lg font-bold font-mono text-slate-900">
            {summary.customersCount}
          </div>
        </div>

        <div
          onClick={() => setActiveTab('products')}
          className="p-3.5 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-slate-300 transition-colors"
        >
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <Package className="w-3.5 h-3.5 text-emerald-500" />
            <span>Valeur du stock (achat)</span>
          </div>
          <div className="mt-1.5 text-lg font-bold font-mono text-slate-900 truncate">
            {formatMoney(summary.stockCostValue, settings.currency)}
          </div>
        </div>

        <div
          onClick={() => setActiveTab('products')}
          className="p-3.5 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-slate-300 transition-colors"
        >
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span>Alertes stock</span>
          </div>
          <div className="mt-1.5 text-lg font-bold font-mono text-slate-900">
            {summary.lowStockCount + summary.outOfStockCount}
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Sales & Expenses Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left (2 cols): Dernières Ventes */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Dernières Ventes Enregistrées
              </h2>
              <p className="text-xs text-slate-500">
                Transactions récentes avec suivi des règlements
              </p>
            </div>
            <button
              onClick={() => setActiveTab('sales')}
              className="text-xs font-semibold text-cyan-600 hover:text-cyan-700 flex items-center gap-1"
            >
              <span>Toutes les ventes</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-2.5 px-4">N° Vente</th>
                  <th className="py-2.5 px-4">Client</th>
                  <th className="py-2.5 px-4">Mode</th>
                  <th className="py-2.5 px-4 text-right">Total</th>
                  <th className="py-2.5 px-4 text-right">Payé</th>
                  <th className="py-2.5 px-4 text-center">État</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">
                      {sale.saleNumber}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-900 block truncate max-w-[140px]">
                        {sale.customerName}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {formatDateTime(sale.date)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                      {sale.paymentMethod}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                      {formatMoney(sale.total, settings.currency)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-600 font-medium tabular-nums">
                      {formatMoney(sale.amountPaid, settings.currency)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          sale.status === 'COMPLET'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {sale.status === 'COMPLET' ? 'Payé' : 'Avance'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setPreviewDocument({ type: 'invoice', sale })}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-600 hover:bg-slate-100 transition-colors"
                        title="Voir la facture"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right (1 col): Dépenses & Commandes récentes */}
        <div className="space-y-6">
          {/* Répartition Dépenses */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900">
                Répartition des Dépenses
              </h2>
              <span className="text-xs font-mono font-bold text-slate-700">
                {formatMoney(summary.totalExpenses, settings.currency)}
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {expenseBreakdown.slice(0, 4).map((item) => (
                <div key={item.category} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600 font-medium truncate">
                      {item.category}
                    </span>
                    <span className="font-mono tabular-nums text-slate-800 font-bold">
                      {formatMoney(item.amount, settings.currency)}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-500 rounded-full"
                      style={{ width: `${Math.min(100, item.percentage)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setActiveTab('expenses')}
              className="mt-4 w-full py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors text-center block"
            >
              Gérer les dépenses
            </button>
          </div>

          {/* Commandes récentes */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900">
                Commandes en Cours
              </h2>
              <button
                onClick={() => setActiveTab('orders')}
                className="text-xs font-semibold text-cyan-600 hover:text-cyan-700"
              >
                Voir tout
              </button>
            </div>

            <div className="mt-3 divide-y divide-slate-100">
              {recentOrders.map((ord) => (
                <div key={ord.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono font-bold text-slate-800 block">
                      {ord.orderNumber}
                    </span>
                    <span className="text-slate-500 truncate block max-w-[130px]">
                      {ord.customerName}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="font-mono font-bold text-slate-900 block">
                      {formatMoney(ord.total, settings.currency)}
                    </span>
                    <span className="text-[10px] text-cyan-600 font-medium">
                      {ord.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
