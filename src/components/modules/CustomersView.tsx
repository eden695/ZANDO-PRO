import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Customer } from '../../types';
import { formatMoney, formatDate, formatDateTime } from '../../utils/formatters';
import { Modal } from '../common/Modal';
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  ShoppingCart,
  ClipboardList,
  Eye,
  Trash2,
  Edit2,
  AlertCircle,
  FileText,
} from 'lucide-react';

export const CustomersView: React.FC = () => {
  const {
    customers,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    sales,
    orders,
    debts,
    settings,
    setPreviewDocument,
    showToast,
  } = useApp();

  const [search, setSearch] = useState('');
  const [filterDebtors, setFilterDebtors] = useState(false);

  // Modals
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomerDetail, setSelectedCustomerDetail] = useState<Customer | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    email: '',
    notes: '',
  });

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.phone.toLowerCase().includes(search.toLowerCase()) ||
        (c.email && c.email.toLowerCase().includes(search.toLowerCase()));
      const matchDebtor = filterDebtors ? c.balanceDue > 0 : true;
      return matchSearch && matchDebtor;
    });
  }, [customers, search, filterDebtors]);

  const openAddModal = () => {
    setEditingCustomer(null);
    setFormData({ name: '', phone: '', address: '', email: '', notes: '' });
    setIsAddEditModalOpen(true);
  };

  const openEditModal = (c: Customer) => {
    setEditingCustomer(c);
    setFormData({
      name: c.name,
      phone: c.phone,
      address: c.address,
      email: c.email || '',
      notes: c.notes || '',
    });
    setIsAddEditModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('Le nom du client est requis.', 'error');
      return;
    }
    if (editingCustomer) {
      updateCustomer(editingCustomer.id, formData);
    } else {
      addCustomer(formData);
    }
    setIsAddEditModalOpen(false);
  };

  // Customer detailed items
  const customerSales = useMemo(() => {
    if (!selectedCustomerDetail) return [];
    return sales.filter(
      (s) => s.customerId === selectedCustomerDetail.id || s.customerName === selectedCustomerDetail.name
    );
  }, [sales, selectedCustomerDetail]);

  const customerOrders = useMemo(() => {
    if (!selectedCustomerDetail) return [];
    return orders.filter(
      (o) => o.customerId === selectedCustomerDetail.id || o.customerName === selectedCustomerDetail.name
    );
  }, [orders, selectedCustomerDetail]);

  const customerDebts = useMemo(() => {
    if (!selectedCustomerDetail) return [];
    return debts.filter(
      (d) => d.customerId === selectedCustomerDetail.id || d.customerName === selectedCustomerDetail.name
    );
  }, [debts, selectedCustomerDetail]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Gestion de la Clientèle
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Fiches clients, suivi des encaissements, créances et historique d'achats.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4 text-cyan-400" />
          <span>Nouveau Client</span>
        </button>
      </div>

      {/* Filter and search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, téléphone, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:border-cyan-500"
          />
        </div>

        <button
          onClick={() => setFilterDebtors(!filterDebtors)}
          className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1.5 ${
            filterDebtors
              ? 'bg-rose-50 text-rose-700 border-rose-300'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5 text-rose-500" />
          <span>Clients avec dettes en cours</span>
        </button>
      </div>

      {/* Customers Cards / Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Adresse</th>
                <th className="py-3 px-4 text-right">Total Achats</th>
                <th className="py-3 px-4 text-right">Total Payé</th>
                <th className="py-3 px-4 text-right">Solde Dû</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Aucun client trouvé.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-cyan-100 text-cyan-800 font-bold flex items-center justify-center shrink-0">
                          {c.name.charAt(0)}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block truncate max-w-[180px]">
                            {c.name}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Inscrit le {formatDate(c.createdAt)}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-slate-600">
                      <div className="flex items-center gap-1.5 font-mono text-[11px]">
                        <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{c.phone}</span>
                      </div>
                      {c.email && (
                        <div className="flex items-center gap-1.5 text-slate-400 text-[10px] mt-0.5">
                          <Mail className="w-3 h-3 shrink-0" />
                          <span className="truncate max-w-[140px]">{c.email}</span>
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-slate-500 max-w-[160px] truncate">
                      {c.address || '—'}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                      {formatMoney(c.totalPurchases, settings.currency)}
                    </td>

                    <td className="py-3 px-4 text-right font-mono text-emerald-600 font-semibold tabular-nums">
                      {formatMoney(c.totalPaid, settings.currency)}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold tabular-nums">
                      {c.balanceDue > 0 ? (
                        <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                          {formatMoney(c.balanceDue, settings.currency)}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal">À jour (0)</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedCustomerDetail(c)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-cyan-600 hover:bg-slate-100 transition-colors"
                          title="Fiche client complète"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(c)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                          title="Modifier"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(c.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* MODAL: FICHE CLIENT COMPLÈTE */}
      {selectedCustomerDetail && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedCustomerDetail(null)}
          title={`Fiche Client : ${selectedCustomerDetail.name}`}
          subtitle={`Tél : ${selectedCustomerDetail.phone} · Adresse : ${selectedCustomerDetail.address}`}
          maxWidth="3xl"
        >
          <div className="space-y-6">
            {/* Quick stats ribbon */}
            <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-[11px] text-slate-500 uppercase font-semibold block">Total Achats</span>
                <span className="text-base font-bold font-mono text-slate-900">
                  {formatMoney(selectedCustomerDetail.totalPurchases, settings.currency)}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 uppercase font-semibold block">Montant Payé</span>
                <span className="text-base font-bold font-mono text-emerald-600">
                  {formatMoney(selectedCustomerDetail.totalPaid, settings.currency)}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 uppercase font-semibold block">Solde Restant Dû</span>
                <span className={`text-base font-bold font-mono ${selectedCustomerDetail.balanceDue > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                  {formatMoney(selectedCustomerDetail.balanceDue, settings.currency)}
                </span>
              </div>
            </div>

            {/* Dettes du client */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-rose-500" />
                <span>Créances & Avances enregistrées ({customerDebts.length})</span>
              </h4>
              {customerDebts.length === 0 ? (
                <p className="text-xs text-slate-400 italic">Aucune créance enregistrée pour ce client.</p>
              ) : (
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-100 text-slate-500">
                      <tr>
                        <th className="py-2 px-3">Vente</th>
                        <th className="py-2 px-3">Date</th>
                        <th className="py-2 px-3 text-right">Initial</th>
                        <th className="py-2 px-3 text-right">Payé</th>
                        <th className="py-2 px-3 text-right">Reste</th>
                        <th className="py-2 px-3 text-center">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {customerDebts.map((d) => (
                        <tr key={d.id}>
                          <td className="py-2 px-3 font-mono font-bold text-slate-800">{d.saleNumber}</td>
                          <td className="py-2 px-3 text-slate-500">{formatDate(d.createdAt)}</td>
                          <td className="py-2 px-3 text-right font-mono">{formatMoney(d.initialAmount, settings.currency)}</td>
                          <td className="py-2 px-3 text-right font-mono text-emerald-600">{formatMoney(d.paidAmount, settings.currency)}</td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-rose-600">{formatMoney(d.remainingAmount, settings.currency)}</td>
                          <td className="py-2 px-3 text-center">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${d.status === 'SOLDEE' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                              {d.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Ventes du client */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                <ShoppingCart className="w-3.5 h-3.5 text-cyan-600" />
                <span>Historique des Ventes ({customerSales.length})</span>
              </h4>
              {customerSales.length === 0 ? (
                <p className="text-xs text-slate-400 italic">Aucune vente enregistrée.</p>
              ) : (
                <div className="border border-slate-200 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-100 text-slate-500">
                      <tr>
                        <th className="py-2 px-3">N° Vente</th>
                        <th className="py-2 px-3">Date</th>
                        <th className="py-2 px-3 text-right">Total</th>
                        <th className="py-2 px-3 text-right">Payé</th>
                        <th className="py-2 px-3 text-right">Facture</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {customerSales.map((s) => (
                        <tr key={s.id}>
                          <td className="py-2 px-3 font-mono font-bold text-slate-800">{s.saleNumber}</td>
                          <td className="py-2 px-3 text-slate-500">{formatDateTime(s.date)}</td>
                          <td className="py-2 px-3 text-right font-mono font-bold">{formatMoney(s.total, settings.currency)}</td>
                          <td className="py-2 px-3 text-right font-mono text-emerald-600">{formatMoney(s.amountPaid, settings.currency)}</td>
                          <td className="py-2 px-3 text-right">
                            <button
                              onClick={() => {
                                setSelectedCustomerDetail(null);
                                setPreviewDocument({ type: 'invoice', sale: s });
                              }}
                              className="text-cyan-600 hover:underline text-[11px] font-semibold"
                            >
                              Voir
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Notes */}
            {selectedCustomerDetail.notes && (
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-xs text-amber-900">
                <strong>Notes sur le client :</strong> {selectedCustomerDetail.notes}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* MODAL: AJOUTER / MODIFIER CLIENT */}
      <Modal
        isOpen={isAddEditModalOpen}
        onClose={() => setIsAddEditModalOpen(false)}
        title={editingCustomer ? 'Modifier la fiche client' : 'Ajouter un nouveau client'}
        subtitle="Coordonnées et informations de contact"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nom complet *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="ex. Mamadou Diop ou Entreprise XYZ"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Numéro de téléphone *
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+225 07..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono focus:outline-hidden focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Adresse email (facultatif)
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="client@domaine.com"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Adresse physique / Ville / Quartier
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="ex. Abidjan, Cocody Angré"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Commentaires ou remarques
            </label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Habitudes, préférences ou historique..."
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:border-cyan-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddEditModalOpen(false)}
              className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
            >
              {editingCustomer ? 'Mettre à jour' : 'Enregistrer le client'}
            </button>
          </div>
        </form>
      </Modal>

      {/* CONFIRM DELETE */}
      {deleteConfirmId && (
        <Modal
          isOpen={true}
          onClose={() => setDeleteConfirmId(null)}
          title="Supprimer ce client"
          maxWidth="sm"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-600">
              Voulez-vous vraiment supprimer ce client ? S'il possède des dettes non soldées, la suppression sera bloquée pour préserver la comptabilité.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  deleteCustomer(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg"
              >
                Confirmer
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
