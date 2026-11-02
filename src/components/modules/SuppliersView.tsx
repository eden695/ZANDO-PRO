import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Supplier, PaymentMethod } from '../../types';
import { formatMoney, formatDate } from '../../utils/formatters';
import { Modal } from '../common/Modal';
import {
  Truck,
  Plus,
  Search,
  Phone,
  MapPin,
  Package,
  History,
  CreditCard,
  ArrowDownLeft,
  DollarSign,
} from 'lucide-react';

export const SuppliersView: React.FC = () => {
  const {
    suppliers,
    addSupplier,
    addSupplierPurchase,
    addSupplierRepayment,
    settings,
    showToast,
  } = useApp();

  const [search, setSearch] = useState('');

  // Modals
  const [isAddSupplierModalOpen, setIsAddSupplierModalOpen] = useState(false);
  const [selectedSupplierDetail, setSelectedSupplierDetail] = useState<Supplier | null>(null);

  // New Purchase modal
  const [purchaseTargetSupplier, setPurchaseTargetSupplier] = useState<Supplier | null>(null);
  const [purchaseAmount, setPurchaseAmount] = useState<number>(0);
  const [purchaseDesc, setPurchaseDesc] = useState<string>('');
  const [purchasePaid, setPurchasePaid] = useState<number>(0);
  const [purchaseMethod, setPurchaseMethod] = useState<PaymentMethod>('VIREMENT');

  // Repayment modal
  const [repayTargetSupplier, setRepayTargetSupplier] = useState<Supplier | null>(null);
  const [repayAmount, setRepayAmount] = useState<number>(0);
  const [repayMethod, setRepayMethod] = useState<PaymentMethod>('VIREMENT');

  // Form for new supplier
  const [supplierFormData, setSupplierFormData] = useState({
    name: '',
    phone: '',
    address: '',
    suppliedProducts: '',
  });

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s) => {
      const matchSearch =
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.phone.toLowerCase().includes(search.toLowerCase()) ||
        s.suppliedProducts.some((p) => p.toLowerCase().includes(search.toLowerCase()));
      return matchSearch;
    });
  }, [suppliers, search]);

  const totalDueToSuppliers = useMemo(() => {
    return suppliers.reduce((sum, s) => sum + s.amountDue, 0);
  }, [suppliers]);

  const handleCreateSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierFormData.name.trim()) {
      showToast('Le nom du fournisseur est obligatoire.', 'error');
      return;
    }
    const productsArr = supplierFormData.suppliedProducts
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);

    addSupplier({
      name: supplierFormData.name,
      phone: supplierFormData.phone,
      address: supplierFormData.address,
      suppliedProducts: productsArr,
    });
    setIsAddSupplierModalOpen(false);
  };

  const handlePurchaseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!purchaseTargetSupplier) return;
    if (purchaseAmount <= 0) {
      showToast('Le montant de l\'achat doit être supérieur à zéro.', 'error');
      return;
    }
    addSupplierPurchase(
      purchaseTargetSupplier.id,
      purchaseAmount,
      purchaseDesc || 'Arrivage de stock',
      purchasePaid,
      purchaseMethod
    );
    setPurchaseTargetSupplier(null);
  };

  const handleRepaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repayTargetSupplier) return;
    if (repayAmount <= 0) {
      showToast('Le montant du règlement doit être supérieur à zéro.', 'error');
      return;
    }
    addSupplierRepayment(repayTargetSupplier.id, repayAmount, repayMethod);
    setRepayTargetSupplier(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Gestion des Fournisseurs
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Achats, approvisionnements de stocks et suivi des dettes fournisseurs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 bg-amber-50 border border-amber-200 rounded-xl text-right">
            <span className="text-[10px] font-semibold text-amber-700 uppercase tracking-wider block">
              Dettes Fournisseurs
            </span>
            <span className="text-base font-bold font-mono text-amber-900 tabular-nums">
              {formatMoney(totalDueToSuppliers, settings.currency)}
            </span>
          </div>

          <button
            onClick={() => {
              setSupplierFormData({ name: '', phone: '', address: '', suppliedProducts: '' });
              setIsAddSupplierModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4 text-cyan-400" />
            <span>Nouveau Fournisseur</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Rechercher par nom, téléphone, article fourni..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:border-cyan-500"
        />
      </div>

      {/* Suppliers Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Fournisseur</th>
                <th className="py-3 px-4">Contact & Adresse</th>
                <th className="py-3 px-4">Articles Fournis</th>
                <th className="py-3 px-4 text-right">Volume Acheté</th>
                <th className="py-3 px-4 text-right">Montant Réglé</th>
                <th className="py-3 px-4 text-right">Montant Dû</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Aucun fournisseur enregistré.
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center shrink-0">
                          {s.name.charAt(0)}
                        </div>
                        <span className="font-bold text-slate-900 block truncate max-w-[170px]">
                          {s.name}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-slate-600">
                      <div className="font-mono text-[11px]">{s.phone}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[140px]">
                        {s.address}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-slate-500 truncate max-w-[160px]">
                      {s.suppliedProducts.join(', ') || '—'}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                      {formatMoney(s.totalPurchases, settings.currency)}
                    </td>

                    <td className="py-3 px-4 text-right font-mono text-emerald-600 font-medium tabular-nums">
                      {formatMoney(s.amountPaid, settings.currency)}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold tabular-nums">
                      {s.amountDue > 0 ? (
                        <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          {formatMoney(s.amountDue, settings.currency)}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal">À jour (0)</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setPurchaseTargetSupplier(s);
                            setPurchaseAmount(0);
                            setPurchasePaid(0);
                            setPurchaseDesc('');
                          }}
                          className="px-2 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded text-[11px] flex items-center gap-1"
                          title="Enregistrer un arrivage / facture fournisseur"
                        >
                          <Plus className="w-3 h-3 text-cyan-600" />
                          <span>Achat</span>
                        </button>

                        {s.amountDue > 0 && (
                          <button
                            onClick={() => {
                              setRepayTargetSupplier(s);
                              setRepayAmount(s.amountDue);
                            }}
                            className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold rounded text-[11px] flex items-center gap-1"
                            title="Régler le fournisseur"
                          >
                            <ArrowDownLeft className="w-3 h-3 text-emerald-600" />
                            <span>Régler</span>
                          </button>
                        )}

                        <button
                          onClick={() => setSelectedSupplierDetail(s)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
                          title="Consulter l'historique"
                        >
                          <History className="w-3.5 h-3.5" />
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

      {/* MODAL: AJOUT FOURNISSEUR */}
      <Modal
        isOpen={isAddSupplierModalOpen}
        onClose={() => setIsAddSupplierModalOpen(false)}
        title="Ajouter un nouveau fournisseur"
        subtitle="Coordonnées et produits d'approvisionnement"
      >
        <form onSubmit={handleCreateSupplier} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nom de l'entreprise ou du fournisseur *
            </label>
            <input
              type="text"
              required
              value={supplierFormData.name}
              onChange={(e) => setSupplierFormData({ ...supplierFormData, name: e.target.value })}
              placeholder="ex. Koffi & Frères Import-Export"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Téléphone *
              </label>
              <input
                type="tel"
                required
                value={supplierFormData.phone}
                onChange={(e) => setSupplierFormData({ ...supplierFormData, phone: e.target.value })}
                placeholder="+225 07..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Adresse ou ville
              </label>
              <input
                type="text"
                value={supplierFormData.address}
                onChange={(e) => setSupplierFormData({ ...supplierFormData, address: e.target.value })}
                placeholder="Zone Industrielle Vridi, Abidjan"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Produits fournis (séparés par des virgules)
            </label>
            <input
              type="text"
              value={supplierFormData.suppliedProducts}
              onChange={(e) =>
                setSupplierFormData({ ...supplierFormData, suppliedProducts: e.target.value })
              }
              placeholder="Sneakers, Sacs cuir, Montres..."
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddSupplierModalOpen(false)}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs"
            >
              Enregistrer le fournisseur
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: ENREGISTRER UN ACHAT FOURNISSEUR */}
      {purchaseTargetSupplier && (
        <Modal
          isOpen={true}
          onClose={() => setPurchaseTargetSupplier(null)}
          title={`Enregistrer un achat : ${purchaseTargetSupplier.name}`}
          subtitle="Cet arrivage augmentera le volume d'achat auprès de ce fournisseur."
          maxWidth="md"
        >
          <form onSubmit={handlePurchaseSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Description de l'arrivage / Bon de livraison
              </label>
              <input
                type="text"
                required
                placeholder="ex. Lot 20 Sneakers Urban + 10 chemises"
                value={purchaseDesc}
                onChange={(e) => setPurchaseDesc(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Montant total de la facture ({settings.currency}) *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={purchaseAmount || ''}
                  onChange={(e) => setPurchaseAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Montant payé immédiatement ({settings.currency})
                </label>
                <input
                  type="number"
                  min="0"
                  max={purchaseAmount}
                  value={purchasePaid}
                  onChange={(e) => setPurchasePaid(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono text-emerald-600 font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mode de règlement
              </label>
              <select
                value={purchaseMethod}
                onChange={(e) => setPurchaseMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
              >
                <option value="VIREMENT">Virement bancaire</option>
                <option value="ESPECES">Espèces (Caisse)</option>
                <option value="MOBILE_MONEY">Mobile Money</option>
                <option value="CARTE">Carte Bancaire</option>
              </select>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPurchaseTargetSupplier(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs"
              >
                Valider l'achat
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL: RÉGLER LE FOURNISSEUR */}
      {repayTargetSupplier && (
        <Modal
          isOpen={true}
          onClose={() => setRepayTargetSupplier(null)}
          title={`Règlement dette : ${repayTargetSupplier.name}`}
          subtitle={`Montant total dû : ${formatMoney(repayTargetSupplier.amountDue, settings.currency)}`}
          maxWidth="md"
        >
          <form onSubmit={handleRepaySubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Montant à verser ({settings.currency}) *
              </label>
              <input
                type="number"
                min="1"
                max={repayTargetSupplier.amountDue}
                required
                value={repayAmount || ''}
                onChange={(e) => setRepayAmount(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mode de règlement
              </label>
              <select
                value={repayMethod}
                onChange={(e) => setRepayMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
              >
                <option value="VIREMENT">Virement bancaire</option>
                <option value="ESPECES">Espèces (Caisse)</option>
                <option value="MOBILE_MONEY">Mobile Money</option>
                <option value="CARTE">Carte Bancaire</option>
              </select>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRepayTargetSupplier(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-xs"
              >
                Confirmer le règlement
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL: HISTORIQUE ACHATS FOURNISSEUR */}
      {selectedSupplierDetail && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedSupplierDetail(null)}
          title={`Historique Fournisseur : ${selectedSupplierDetail.name}`}
          subtitle={`Tél : ${selectedSupplierDetail.phone} · Adresse : ${selectedSupplierDetail.address}`}
          maxWidth="2xl"
        >
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Achats et arrivages
            </h4>
            {selectedSupplierDetail.purchases.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Aucun achat enregistré.</p>
            ) : (
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-100 text-slate-500">
                    <tr>
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3">Articles</th>
                      <th className="py-2 px-3 text-right">Montant</th>
                      <th className="py-2 px-3 text-right">Payé</th>
                      <th className="py-2 px-3 text-right">Reste</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedSupplierDetail.purchases.map((p) => (
                      <tr key={p.id}>
                        <td className="py-2 px-3 font-mono">{formatDate(p.date)}</td>
                        <td className="py-2 px-3">{p.itemsDescription}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold">
                          {formatMoney(p.amount, settings.currency)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-emerald-600">
                          {formatMoney(p.paid, settings.currency)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-amber-700 font-bold">
                          {formatMoney(p.due, settings.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
