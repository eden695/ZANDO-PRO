import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Debt, PaymentMethod } from '../../types';
import { formatMoney, formatDate, formatDateTime } from '../../utils/formatters';
import { Modal } from '../common/Modal';
import {
  CreditCard,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Printer,
  History,
  ArrowDownLeft,
} from 'lucide-react';

export const DebtsView: React.FC = () => {
  const { debts, recordDebtRepayment, settings, setPreviewDocument, showToast } = useApp();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'EN_COURS' | 'SOLDEE' | 'EN_RETARD'>('ALL');

  // Repayment Modal
  const [selectedDebtForRepay, setSelectedDebtForRepay] = useState<Debt | null>(null);
  const [repayAmount, setRepayAmount] = useState<number>(0);
  const [repayMethod, setRepayMethod] = useState<PaymentMethod>('ESPECES');
  const [repayNote, setRepayNote] = useState<string>('');

  // History modal
  const [historyTargetDebt, setHistoryTargetDebt] = useState<Debt | null>(null);

  // Compute status including delay check
  const processedDebts = useMemo(() => {
    const now = new Date();
    return debts.map((d) => {
      let status = d.status;
      if (status === 'EN_COURS' && d.dueDate) {
        if (new Date(d.dueDate) < now) {
          status = 'EN_RETARD';
        }
      }
      return { ...d, computedStatus: status };
    });
  }, [debts]);

  const filteredDebts = useMemo(() => {
    return processedDebts.filter((d) => {
      const matchSearch =
        d.customerName.toLowerCase().includes(search.toLowerCase()) ||
        d.saleNumber.toLowerCase().includes(search.toLowerCase()) ||
        d.customerPhone.toLowerCase().includes(search.toLowerCase());

      const matchStatus =
        statusFilter === 'ALL' || d.computedStatus === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [processedDebts, search, statusFilter]);

  const totalOutstanding = useMemo(() => {
    return processedDebts
      .filter((d) => d.computedStatus !== 'SOLDEE')
      .reduce((sum, d) => sum + d.remainingAmount, 0);
  }, [processedDebts]);

  const handleOpenRepay = (debt: Debt) => {
    setSelectedDebtForRepay(debt);
    setRepayAmount(debt.remainingAmount);
    setRepayMethod('ESPECES');
    setRepayNote('');
  };

  const handleRepaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDebtForRepay) return;
    if (repayAmount <= 0) {
      showToast('Le montant du règlement doit être supérieur à zéro.', 'error');
      return;
    }
    if (repayAmount > selectedDebtForRepay.remainingAmount) {
      showToast('Le montant dépasse le solde restant dû.', 'error');
      return;
    }

    recordDebtRepayment(
      selectedDebtForRepay.id,
      repayAmount,
      repayMethod,
      repayNote
    );
    setSelectedDebtForRepay(null);
  };

  return (
    <div className="space-y-6">
      {/* Header & Total Receivables Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Dettes Clients & Suivi des Créances
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Gestion rigoureuse des ventes à crédit, paiements échelonnés et relances.
          </p>
        </div>

        <div className="px-4 py-2 bg-rose-50 border border-rose-200 rounded-xl text-right">
          <span className="text-[10px] font-semibold text-rose-600 uppercase tracking-wider block">
            Total Créances en Cours
          </span>
          <span className="text-xl font-bold font-mono text-rose-700 tabular-nums">
            {formatMoney(totalOutstanding, settings.currency)}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par client, téléphone, vente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-1">
          {[
            { label: 'Toutes', val: 'ALL' },
            { label: 'En cours', val: 'EN_COURS' },
            { label: 'En retard', val: 'EN_RETARD' },
            { label: 'Soldées', val: 'SOLDEE' },
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

      {/* Debts Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Vente Liée</th>
                <th className="py-3 px-4 text-right">Montant Initial</th>
                <th className="py-3 px-4 text-right">Déjà Réglé</th>
                <th className="py-3 px-4 text-right">Solde Restant</th>
                <th className="py-3 px-4">Date Émission</th>
                <th className="py-3 px-4">Échéance</th>
                <th className="py-3 px-4 text-center">État</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDebts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Aucun dossier de dette ne correspond à votre filtre.
                  </td>
                </tr>
              ) : (
                filteredDebts.map((d) => {
                  const isSettled = d.computedStatus === 'SOLDEE';
                  const isOverdue = d.computedStatus === 'EN_RETARD';

                  return (
                    <tr key={d.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block truncate max-w-[150px]">
                          {d.customerName}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {d.customerPhone || 'Pas de numéro'}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-slate-700">
                        {d.saleNumber}
                      </td>

                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-600">
                        {formatMoney(d.initialAmount, settings.currency)}
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-emerald-600 font-medium tabular-nums">
                        {formatMoney(d.paidAmount, settings.currency)}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold tabular-nums">
                        {isSettled ? (
                          <span className="text-slate-400">0</span>
                        ) : (
                          <span className={isOverdue ? 'text-rose-700 font-extrabold' : 'text-rose-600'}>
                            {formatMoney(d.remainingAmount, settings.currency)}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-500">
                        {formatDate(d.createdAt)}
                      </td>

                      <td className="py-3 px-4">
                        <span className={`text-[11px] ${isOverdue ? 'text-rose-600 font-bold' : 'text-slate-600'}`}>
                          {formatDate(d.dueDate)}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isSettled
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : isOverdue
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {isSettled ? 'Soldée' : isOverdue ? 'En retard' : 'En cours'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isSettled && (
                            <button
                              onClick={() => handleOpenRepay(d)}
                              className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg text-[11px] flex items-center gap-1 transition-colors shadow-xs"
                              title="Enregistrer un remboursement"
                            >
                              <ArrowDownLeft className="w-3 h-3" />
                              <span>Régler</span>
                            </button>
                          )}

                          <button
                            onClick={() => setHistoryTargetDebt(d)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                            title="Historique des règlements"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setPreviewDocument({ type: 'debtReceipt', debt: d })}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-cyan-600 hover:bg-slate-100 transition-colors"
                            title="Imprimer le reçu de dette"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: ENREGISTRER UN REMBOURSEMENT */}
      {selectedDebtForRepay && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedDebtForRepay(null)}
          title="Enregistrer un remboursement de dette"
          subtitle={`Client : ${selectedDebtForRepay.customerName} · Vente : ${selectedDebtForRepay.saleNumber}`}
          maxWidth="md"
        >
          <form onSubmit={handleRepaymentSubmit} className="space-y-4">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between text-slate-600">
                <span>Créance initiale :</span>
                <span className="font-mono">{formatMoney(selectedDebtForRepay.initialAmount, settings.currency)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Déjà remboursé :</span>
                <span className="font-mono text-emerald-600">{formatMoney(selectedDebtForRepay.paidAmount, settings.currency)}</span>
              </div>
              <div className="flex justify-between font-bold text-rose-700 border-t border-slate-200 pt-1.5 text-sm">
                <span>Solde restant à devoir :</span>
                <span className="font-mono">{formatMoney(selectedDebtForRepay.remainingAmount, settings.currency)}</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Montant remboursé ({settings.currency}) *
                </label>
                <button
                  type="button"
                  onClick={() => setRepayAmount(selectedDebtForRepay.remainingAmount)}
                  className="text-[10px] text-cyan-600 hover:underline font-bold"
                >
                  Solder la totalité
                </button>
              </div>
              <input
                type="number"
                min="1"
                max={selectedDebtForRepay.remainingAmount}
                required
                value={repayAmount || ''}
                onChange={(e) => setRepayAmount(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm font-bold rounded-lg border border-slate-300 font-mono text-slate-900 focus:outline-hidden focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mode de paiement
              </label>
              <select
                value={repayMethod}
                onChange={(e) => setRepayMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
              >
                <option value="ESPECES">Espèces (Caisse)</option>
                <option value="MOBILE_MONEY">Mobile Money</option>
                <option value="CARTE">Carte Bancaire</option>
                <option value="VIREMENT">Virement Bancaire</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Remarque ou numéro de reçu
              </label>
              <input
                type="text"
                value={repayNote}
                onChange={(e) => setRepayNote(e.target.value)}
                placeholder="ex. Versement partiel en magasin..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
              />
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedDebtForRepay(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs"
              >
                Valider l'encaissement
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL: HISTORIQUE DES RÈGLEMENTS */}
      {historyTargetDebt && (
        <Modal
          isOpen={true}
          onClose={() => setHistoryTargetDebt(null)}
          title={`Historique des remboursements : ${historyTargetDebt.saleNumber}`}
          subtitle={`Client : ${historyTargetDebt.customerName}`}
          maxWidth="md"
        >
          <div className="space-y-4">
            {historyTargetDebt.repayments.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">
                Aucun versement n'a encore été enregistré sur cette créance.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {historyTargetDebt.repayments.map((rep) => (
                  <div key={rep.id} className="p-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-slate-800 block">
                        {rep.paymentMethod} · Reçu par {rep.cashierName}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {formatDateTime(rep.date)}
                        {rep.note && ` — ${rep.note}`}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-emerald-600 tabular-nums">
                      +{formatMoney(rep.amount, settings.currency)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setHistoryTargetDebt(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                Fermer
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
