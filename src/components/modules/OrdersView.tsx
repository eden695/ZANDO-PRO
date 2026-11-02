import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Order, OrderStatus, PaymentMethod } from '../../types';
import { formatMoney, formatDate, formatDateTime } from '../../utils/formatters';
import { Modal } from '../common/Modal';
import {
  ClipboardList,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Truck,
  RotateCcw,
  ArrowRight,
  Eye,
  Trash2,
  AlertTriangle,
} from 'lucide-react';

export const OrdersView: React.FC = () => {
  const {
    orders,
    createOrder,
    updateOrderStatus,
    convertOrderToSale,
    deleteOrder,
    products,
    customers,
    settings,
    setPreviewDocument,
    showToast,
  } = useApp();

  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('TOUS');

  // New Order Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newOrderCustomer, setNewOrderCustomer] = useState('');
  const [newOrderPhone, setNewOrderPhone] = useState('');
  const [newOrderExpectedDate, setNewOrderExpectedDate] = useState(
    new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString().split('T')[0]
  );
  const [newOrderNotes, setNewOrderNotes] = useState('');
  const [newOrderItems, setNewOrderItems] = useState<
    Array<{ productId: string; productName: string; unitPrice: number; quantity: number; subtotal: number }>
  >([]);
  const [newOrderAdvance, setNewOrderAdvance] = useState<number>(0);

  // Convert to sale modal
  const [convertTargetOrder, setConvertTargetOrder] = useState<Order | null>(null);
  const [convertPaymentMethod, setConvertPaymentMethod] = useState<PaymentMethod>('ESPECES');
  const [convertAdditionalPaid, setConvertAdditionalPaid] = useState<number>(0);

  // Statuses list
  const statuses: { label: string; value: OrderStatus | 'TOUS' }[] = [
    { label: 'Tous', value: 'TOUS' },
    { label: 'En attente', value: 'EN_ATTENTE' },
    { label: 'Confirmée', value: 'CONFIRMEE' },
    { label: 'En préparation', value: 'EN_PREPARATION' },
    { label: 'Prête', value: 'PRETE' },
    { label: 'Livrée', value: 'LIVREE' },
    { label: 'Annulée', value: 'ANNULEE' },
  ];

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchSearch =
        o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
        o.customerName.toLowerCase().includes(search.toLowerCase()) ||
        o.customerPhone.toLowerCase().includes(search.toLowerCase());
      const matchStatus =
        selectedStatus === 'TOUS' || o.status === selectedStatus;
      return matchSearch && matchStatus;
    });
  }, [orders, search, selectedStatus]);

  const openNewOrder = () => {
    setNewOrderCustomer(customers[0]?.id || '');
    setNewOrderPhone(customers[0]?.phone || '');
    setNewOrderNotes('');
    setNewOrderAdvance(0);
    // Add default product if exists
    if (products.length > 0) {
      setNewOrderItems([
        {
          productId: products[0].id,
          productName: products[0].name,
          unitPrice: products[0].salePrice,
          quantity: 1,
          subtotal: products[0].salePrice,
        },
      ]);
    } else {
      setNewOrderItems([]);
    }
    setIsAddModalOpen(true);
  };

  const handleAddItemToOrder = () => {
    if (products.length === 0) return;
    const firstProd = products[0];
    setNewOrderItems([
      ...newOrderItems,
      {
        productId: firstProd.id,
        productName: firstProd.name,
        unitPrice: firstProd.salePrice,
        quantity: 1,
        subtotal: firstProd.salePrice,
      },
    ]);
  };

  const handleUpdateOrderItem = (index: number, productId: string, quantity: number) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;
    const next = [...newOrderItems];
    next[index] = {
      productId: prod.id,
      productName: prod.name,
      unitPrice: prod.salePrice,
      quantity: Math.max(1, quantity),
      subtotal: Math.max(1, quantity) * prod.salePrice,
    };
    setNewOrderItems(next);
  };

  const handleRemoveOrderItem = (index: number) => {
    setNewOrderItems(newOrderItems.filter((_, idx) => idx !== index));
  };

  const newOrderTotal = useMemo(() => {
    return newOrderItems.reduce((sum, item) => sum + item.subtotal, 0);
  }, [newOrderItems]);

  const handleCreateOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newOrderItems.length === 0) {
      showToast('Ajoutez au moins un produit à la commande.', 'error');
      return;
    }
    const customer = customers.find((c) => c.id === newOrderCustomer);
    createOrder({
      customerId: newOrderCustomer || 'cst_unknown',
      customerName: customer ? customer.name : 'Client Réservation',
      customerPhone: newOrderPhone || customer?.phone || '',
      items: newOrderItems,
      total: newOrderTotal,
      advancePaid: newOrderAdvance,
      deliveryExpectedDate: newOrderExpectedDate,
      notes: newOrderNotes,
    });
    setIsAddModalOpen(false);
  };

  const handleOpenConvert = (order: Order) => {
    setConvertTargetOrder(order);
    setConvertPaymentMethod('ESPECES');
    setConvertAdditionalPaid(order.balanceDue);
  };

  const handleConfirmConvert = () => {
    if (!convertTargetOrder) return;
    const sale = convertOrderToSale(
      convertTargetOrder.id,
      convertPaymentMethod,
      convertAdditionalPaid
    );
    if (sale) {
      setConvertTargetOrder(null);
      setPreviewDocument({ type: 'invoice', sale });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Gestion des Commandes & Réservations
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Les commandes n'impactent pas le stock jusqu'à leur livraison et conversion en vente.
          </p>
        </div>

        <button
          onClick={openNewOrder}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvelle Commande</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par numéro de commande, nom client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:border-cyan-500"
          />
        </div>

        {/* Status segmented tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {statuses.map((st) => (
            <button
              key={st.value}
              onClick={() => setSelectedStatus(st.value)}
              className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
                selectedStatus === st.value
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">N° Commande</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Articles</th>
                <th className="py-3 px-4 text-right">Total</th>
                <th className="py-3 px-4 text-right">Avance Perçue</th>
                <th className="py-3 px-4 text-right">Reste à la livraison</th>
                <th className="py-3 px-4">Date Prévue</th>
                <th className="py-3 px-4 text-center">Statut</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Aucune commande trouvée.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => {
                  const isDelivered = ord.status === 'LIVREE';
                  const isCancelled = ord.status === 'ANNULEE';

                  return (
                    <tr key={ord.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {ord.orderNumber}
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block truncate max-w-[150px]">
                          {ord.customerName}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {ord.customerPhone}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-600 truncate max-w-[180px]">
                        {ord.items.map((i) => `${i.productName} (×${i.quantity})`).join(', ')}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold tabular-nums text-slate-900">
                        {formatMoney(ord.total, settings.currency)}
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-emerald-600 font-medium tabular-nums">
                        {formatMoney(ord.advancePaid, settings.currency)}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-rose-600 tabular-nums">
                        {formatMoney(ord.balanceDue, settings.currency)}
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        {formatDate(ord.deliveryExpectedDate)}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <select
                          disabled={isDelivered || isCancelled}
                          value={ord.status}
                          onChange={(e) =>
                            updateOrderStatus(ord.id, e.target.value as OrderStatus)
                          }
                          className={`text-[10px] font-bold px-2 py-1 rounded-full border ${
                            ord.status === 'LIVREE'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : ord.status === 'ANNULEE'
                              ? 'bg-slate-100 text-slate-500 border-slate-300'
                              : ord.status === 'PRETE'
                              ? 'bg-cyan-50 text-cyan-700 border-cyan-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          <option value="EN_ATTENTE">En attente</option>
                          <option value="CONFIRMEE">Confirmée</option>
                          <option value="EN_PREPARATION">En préparation</option>
                          <option value="PRETE">Prête</option>
                          <option value="LIVREE">Livrée (Convertie)</option>
                          <option value="ANNULEE">Annulée</option>
                        </select>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isDelivered && !isCancelled && (
                            <button
                              onClick={() => handleOpenConvert(ord)}
                              className="px-2.5 py-1 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200 font-bold rounded-md text-[11px] flex items-center gap-1 transition-colors"
                              title="Livrer et déduire le stock"
                            >
                              <Truck className="w-3 h-3 text-cyan-600" />
                              <span>Livrer</span>
                            </button>
                          )}
                          {!isDelivered && (
                            <button
                              onClick={() => deleteOrder(ord.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Supprimer la commande"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
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

      {/* MODAL: NOUVELLE COMMANDE */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Créer une nouvelle commande / réservation"
        subtitle="Le stock sera réservé sans décrémentation immédiate."
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateOrderSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Client *
              </label>
              <select
                required
                value={newOrderCustomer}
                onChange={(e) => {
                  setNewOrderCustomer(e.target.value);
                  const found = customers.find((c) => c.id === e.target.value);
                  if (found) setNewOrderPhone(found.phone);
                }}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Téléphone de contact
              </label>
              <input
                type="text"
                value={newOrderPhone}
                onChange={(e) => setNewOrderPhone(e.target.value)}
                placeholder="+225..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Date prévue de livraison
              </label>
              <input
                type="date"
                required
                value={newOrderExpectedDate}
                onChange={(e) => setNewOrderExpectedDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Avance versée par le client ({settings.currency})
              </label>
              <input
                type="number"
                min="0"
                value={newOrderAdvance}
                onChange={(e) => setNewOrderAdvance(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono text-emerald-600 font-bold"
              />
            </div>
          </div>

          {/* Items selection */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700">Articles commandés</span>
              <button
                type="button"
                onClick={handleAddItemToOrder}
                className="text-xs text-cyan-600 hover:text-cyan-700 font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajouter un article</span>
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {newOrderItems.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                >
                  <select
                    value={item.productId}
                    onChange={(e) => handleUpdateOrderItem(idx, e.target.value, item.quantity)}
                    className="flex-1 py-1 px-2 border border-slate-300 rounded bg-white text-slate-800"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({formatMoney(p.salePrice, settings.currency)})
                      </option>
                    ))}
                  </select>

                  <div className="flex items-center gap-1">
                    <span className="text-slate-500">Qté:</span>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        handleUpdateOrderItem(idx, item.productId, parseInt(e.target.value) || 1)
                      }
                      className="w-14 py-1 px-2 border border-slate-300 rounded font-mono text-center font-bold"
                    />
                  </div>

                  <span className="font-mono font-bold text-slate-900 w-24 text-right">
                    {formatMoney(item.subtotal, settings.currency)}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleRemoveOrderItem(idx)}
                    className="p-1 text-slate-400 hover:text-rose-600"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
              <span className="font-bold text-slate-700">Total Commande :</span>
              <span className="font-mono text-base font-bold text-slate-900">
                {formatMoney(newOrderTotal, settings.currency)}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Instructions ou commentaires particuliers
            </label>
            <textarea
              rows={2}
              value={newOrderNotes}
              onChange={(e) => setNewOrderNotes(e.target.value)}
              placeholder="Adresse de livraison, créneau horaire, emballage spécial..."
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
              className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
            >
              Enregistrer la commande
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: CONVERTIR COMMANDE EN VENTE LIVRÉE */}
      {convertTargetOrder && (
        <Modal
          isOpen={true}
          onClose={() => setConvertTargetOrder(null)}
          title={`Livrer la commande ${convertTargetOrder.orderNumber}`}
          subtitle="Cette opération déduira les articles du stock et émettra la facture finale."
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="p-3 bg-cyan-50/70 border border-cyan-200 rounded-xl text-xs space-y-1.5 text-cyan-950">
              <div className="flex justify-between">
                <span>Client :</span>
                <strong>{convertTargetOrder.customerName}</strong>
              </div>
              <div className="flex justify-between">
                <span>Total commande :</span>
                <strong className="font-mono">{formatMoney(convertTargetOrder.total, settings.currency)}</strong>
              </div>
              <div className="flex justify-between">
                <span>Avance déjà payée :</span>
                <strong className="font-mono text-emerald-600">{formatMoney(convertTargetOrder.advancePaid, settings.currency)}</strong>
              </div>
              <div className="flex justify-between border-t border-cyan-200 pt-1 text-rose-700 font-bold">
                <span>Solde à encaisser à la livraison :</span>
                <span className="font-mono">{formatMoney(convertTargetOrder.balanceDue, settings.currency)}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mode de règlement du solde
              </label>
              <select
                value={convertPaymentMethod}
                onChange={(e) => setConvertPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
              >
                <option value="ESPECES">Espèces (Cash)</option>
                <option value="MOBILE_MONEY">Mobile Money</option>
                <option value="CARTE">Carte Bancaire</option>
                <option value="VIREMENT">Virement</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Montant supplémentaire perçu à la livraison ({settings.currency})
              </label>
              <input
                type="number"
                min="0"
                value={convertAdditionalPaid}
                onChange={(e) => setConvertAdditionalPaid(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono font-bold"
              />
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setConvertTargetOrder(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmConvert}
                className="px-4 py-2 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg shadow-xs"
              >
                Confirmer la livraison & Vente
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
