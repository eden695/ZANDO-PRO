import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Expense } from '../../types';
import { formatMoney, formatDate, formatDateTime } from '../../utils/formatters';
import { Modal } from '../common/Modal';
import { compressImage } from '../../utils/imageCompressor';
import {
  Receipt,
  Plus,
  Search,
  Filter,
  Trash2,
  Upload,
  Calendar,
  CreditCard,
  FileText,
  DollarSign,
  PieChart,
} from 'lucide-react';

export const ExpensesView: React.FC = () => {
  const { expenses, addExpense, deleteExpense, settings, hasPermission, showToast } = useApp();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('TOUTES');

  // Add Expense Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    label: '',
    category: 'Loyer & Charges',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'ESPECES' as 'ESPECES' | 'MOBILE_MONEY' | 'BANQUE',
    comment: '',
    receiptUrl: '',
  });

  const categories = [
    'Loyer & Charges',
    'Salaires & Gratifications',
    'Transport & Logistique',
    'Marketing & Publicité',
    'Fournitures & Emballages',
    'Entretien & Réparations',
    'Impôts & Taxes',
    'Autre Dépense',
  ];

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const matchSearch =
        e.label.toLowerCase().includes(search.toLowerCase()) ||
        (e.comment && e.comment.toLowerCase().includes(search.toLowerCase())) ||
        e.author.toLowerCase().includes(search.toLowerCase());
      const matchCat =
        categoryFilter === 'TOUTES' || e.category === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [expenses, search, categoryFilter]);

  const totalFiltered = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [filteredExpenses]);

  // Breakdown
  const categoryStats = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of expenses) {
      map.set(e.category, (map.get(e.category) || 0) + e.amount);
    }
    const grandTotal = expenses.reduce((s, e) => s + e.amount, 0);
    return Array.from(map.entries())
      .map(([name, total]) => ({
        name,
        total,
        pct: grandTotal > 0 ? (total / grandTotal) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [expenses]);

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file, 800, 800, 0.8);
        setFormData((prev) => ({ ...prev, receiptUrl: compressed }));
      } catch (err) {
        showToast('Erreur lors du traitement du justificatif.', 'error');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.label.trim()) {
      showToast('Le libellé de la dépense est requis.', 'error');
      return;
    }
    if (formData.amount <= 0) {
      showToast('Le montant de la dépense doit être supérieur à zéro.', 'error');
      return;
    }

    addExpense({
      ...formData,
      date: new Date(formData.date).toISOString(),
    });
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Gestion des Dépenses & Charges
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Enregistrement des sorties de caisse, charges d'exploitation et justificatifs.
          </p>
        </div>

        <button
          onClick={() => {
            setFormData({
              label: '',
              category: 'Loyer & Charges',
              amount: 0,
              date: new Date().toISOString().split('T')[0],
              paymentMethod: 'ESPECES',
              comment: '',
              receiptUrl: '',
            });
            setIsAddModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4 text-cyan-400" />
          <span>Enregistrer une Dépense</span>
        </button>
      </div>

      {/* Top Category Distribution Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">
            Total des Dépenses
          </span>
          <div className="mt-1.5 text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {formatMoney(totalFiltered, settings.currency)}
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            {filteredExpenses.length} opération(s) enregistrée(s)
          </p>
        </div>

        {categoryStats.slice(0, 3).map((cat) => (
          <div key={cat.name} className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-700 truncate max-w-[130px]">{cat.name}</span>
              <span className="text-[11px] font-mono text-slate-400">{cat.pct.toFixed(0)}%</span>
            </div>
            <div className="mt-2 text-lg font-bold font-mono text-slate-900 tabular-nums">
              {formatMoney(cat.total, settings.currency)}
            </div>
            <div className="mt-2 w-full h-1 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-slate-800 rounded-full"
                style={{ width: `${Math.min(100, cat.pct)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par libellé, auteur, commentaire..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:border-cyan-500"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="py-2 px-3 text-xs rounded-lg border border-slate-200 bg-white text-slate-700"
        >
          <option value="TOUTES">Toutes les catégories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Libellé</th>
                <th className="py-3 px-4">Catégorie</th>
                <th className="py-3 px-4 text-right">Montant</th>
                <th className="py-3 px-4">Mode</th>
                <th className="py-3 px-4">Auteur</th>
                <th className="py-3 px-4">Justificatif</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Aucune dépense enregistrée.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 text-slate-500 font-mono">
                      {formatDate(exp.date)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 block">
                        {exp.label}
                      </span>
                      {exp.comment && (
                        <span className="text-[10px] text-slate-400 block truncate max-w-[200px]">
                          {exp.comment}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{exp.category}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                      {formatMoney(exp.amount, settings.currency)}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 text-[11px]">
                      {exp.paymentMethod}
                    </td>
                    <td className="py-3 px-4 text-slate-500">{exp.author}</td>
                    <td className="py-3 px-4">
                      {exp.receiptUrl ? (
                        <a
                          href={exp.receiptUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-cyan-600 underline font-semibold flex items-center gap-1"
                        >
                          <FileText className="w-3 h-3" />
                          <span>Reçu</span>
                        </a>
                      ) : (
                        <span className="text-slate-300 text-[10px]">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {hasPermission('canRecordExpenses') && (
                        <button
                          onClick={() => deleteExpense(exp.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Supprimer la dépense"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: AJOUTER UNE DÉPENSE */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Enregistrer une dépense ou charge"
        subtitle="Cette sortie sera déduite du solde théorique de caisse ou trésorerie."
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Libellé de la dépense *
            </label>
            <input
              type="text"
              required
              placeholder="ex. Facture électricité magasin ou Transport marchandises"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Catégorie *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Montant ({settings.currency}) *
              </label>
              <input
                type="number"
                min="1"
                required
                value={formData.amount || ''}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Date de l'opération
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mode de règlement
              </label>
              <select
                value={formData.paymentMethod}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    paymentMethod: e.target.value as 'ESPECES' | 'MOBILE_MONEY' | 'BANQUE',
                  })
                }
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
              >
                <option value="ESPECES">Espèces (Caisse)</option>
                <option value="MOBILE_MONEY">Mobile Money</option>
                <option value="BANQUE">Banque / Virement</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Justificatif / Reçu (photo ou scan)
            </label>
            <div className="flex items-center gap-3">
              <label className="cursor-pointer flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg border border-slate-300 transition-colors">
                <Upload className="w-4 h-4" />
                <span>Joindre un justificatif</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleReceiptUpload}
                  className="hidden"
                />
              </label>
              {formData.receiptUrl && (
                <span className="text-xs text-emerald-600 font-medium">
                  ✓ Fichier attaché
                </span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Commentaire ou numéro de pièce
            </label>
            <textarea
              rows={2}
              value={formData.comment}
              onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
              placeholder="ex. Facture CIE n° 9812-C..."
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs"
            >
              Enregistrer la dépense
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
