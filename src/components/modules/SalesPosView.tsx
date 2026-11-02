import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Product, Customer, PaymentMethod, SaleItem, Sale } from '../../types';
import { formatMoney, formatDateTime } from '../../utils/formatters';
import { Modal } from '../common/Modal';
import {
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  CreditCard,
  User,
  Tag,
  Printer,
  History,
  AlertCircle,
  FileText,
  RotateCcw,
  Eye,
} from 'lucide-react';

export const SalesPosView: React.FC = () => {
  const {
    products,
    customers,
    createSale,
    deleteSale,
    sales,
    settings,
    setPreviewDocument,
    showToast,
    hasPermission,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'pos' | 'history'>('pos');
  const [productSearch, setProductSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('TOUTES');

  // Cart State
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('ESPECES');
  const [amountReceivedInput, setAmountReceivedInput] = useState<string>('');
  const [saleNotes, setSaleNotes] = useState<string>('');

  // Partial Payment Modal Confirmation
  const [partialPaymentPrompt, setPartialPaymentPrompt] = useState<{
    total: number;
    amountPaid: number;
    balanceDue: number;
  } | null>(null);

  // Sales History filter
  const [historySearch, setHistorySearch] = useState('');
  const [deleteSaleIdConfirm, setDeleteSaleIdConfirm] = useState<string | null>(null);

  // Product categories
  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category).filter(Boolean));
    return ['TOUTES', ...Array.from(set)];
  }, [products]);

  // Filtered products for quick-click POS grid
  const availableProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.reference.toLowerCase().includes(productSearch.toLowerCase());
      const matchCat =
        selectedCategory === 'TOUTES' || p.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [products, productSearch, selectedCategory]);

  // Cart Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.subtotal, 0);
  }, [cart]);

  const total = useMemo(() => {
    return Math.max(0, subtotal - (discountAmount || 0));
  }, [subtotal, discountAmount]);

  const amountReceived = useMemo(() => {
    const val = parseFloat(amountReceivedInput);
    return isNaN(val) ? 0 : val;
  }, [amountReceivedInput]);

  const changeGiven = useMemo(() => {
    return amountReceived > total ? amountReceived - total : 0;
  }, [amountReceived, total]);

  const balanceDue = useMemo(() => {
    return amountReceived < total ? total - amountReceived : 0;
  }, [amountReceived, total]);

  // Cart actions
  const addToCart = (product: Product) => {
    if (product.stockQuantity <= 0) {
      showToast(`Le produit "${product.name}" est en rupture de stock !`, 'error');
      return;
    }

    const existingIndex = cart.findIndex((item) => item.productId === product.id);
    if (existingIndex !== -1) {
      const currentQty = cart[existingIndex].quantity;
      if (currentQty + 1 > product.stockQuantity) {
        showToast(
          `Quantité maximale atteinte pour "${product.name}" (${product.stockQuantity} en stock).`,
          'error'
        );
        return;
      }
      const updated = [...cart];
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: currentQty + 1,
        subtotal: (currentQty + 1) * updated[existingIndex].unitPrice,
      };
      setCart(updated);
    } else {
      setCart([
        ...cart,
        {
          productId: product.id,
          productName: product.name,
          reference: product.reference,
          unitPrice: product.salePrice,
          purchasePrice: product.purchasePrice,
          quantity: 1,
          subtotal: product.salePrice,
        },
      ]);
    }
  };

  const updateCartQuantity = (productId: string, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }
    const product = products.find((p) => p.id === productId);
    if (product && newQty > product.stockQuantity) {
      showToast(`Stock insuffisant (${product.stockQuantity} disponibles).`, 'error');
      return;
    }
    setCart(
      cart.map((item) =>
        item.productId === productId
          ? {
              ...item,
              quantity: newQty,
              subtotal: newQty * item.unitPrice,
            }
          : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.productId !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscountAmount(0);
    setAmountReceivedInput('');
    setSelectedCustomerId('');
    setSaleNotes('');
  };

  const handleValidateClick = () => {
    if (cart.length === 0) {
      showToast('Votre panier est vide. Sélectionnez au moins un article.', 'error');
      return;
    }

    // Default amount received to total if not typed
    const effectiveAmount = amountReceivedInput.trim() === '' ? total : amountReceived;

    // Check if partial payment
    if (effectiveAmount < total) {
      if (!selectedCustomerId) {
        showToast(
          'Pour accorder une avance avec reste à payer, veuillez sélectionner un client enregistré.',
          'error'
        );
        return;
      }
      // Trigger confirmation dialog for advance acceptance
      setPartialPaymentPrompt({
        total,
        amountPaid: effectiveAmount,
        balanceDue: total - effectiveAmount,
      });
      return;
    }

    // Fully paid sale
    executeSale(effectiveAmount);
  };

  const executeSale = (effectiveAmount: number) => {
    const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

    const sale = createSale({
      customerId: selectedCustomerId || null,
      customerName: selectedCustomer ? selectedCustomer.name : 'Client Comptoir',
      customerPhone: selectedCustomer?.phone,
      items: cart,
      subtotal,
      discount: discountAmount,
      total,
      amountPaid: effectiveAmount,
      paymentMethod,
      notes: saleNotes,
    });

    clearCart();
    setPartialPaymentPrompt(null);
    // Instant invoice preview
    setPreviewDocument({ type: 'invoice', sale });
  };

  // Filtered sales history
  const filteredSalesHistory = useMemo(() => {
    return sales.filter((s) => {
      const matchSearch =
        s.saleNumber.toLowerCase().includes(historySearch.toLowerCase()) ||
        s.customerName.toLowerCase().includes(historySearch.toLowerCase()) ||
        s.cashierName.toLowerCase().includes(historySearch.toLowerCase());
      return matchSearch;
    });
  }, [sales, historySearch]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Caisse & Ventes Rapides
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Encaissement immédiat, gestion des avances et décrémentation automatique du stock.
          </p>
        </div>

        <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
          <button
            onClick={() => setActiveTab('pos')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'pos'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Terminal Caisse
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'history'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Historique des Ventes ({sales.length})
          </button>
        </div>
      </div>

      {activeTab === 'pos' ? (
        /* --- TERMINAL POS INTERFACE --- */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Product Grid & Search (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Search & Category Filter */}
            <div className="flex flex-col sm:flex-row gap-2 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher par nom ou code..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:border-cyan-500"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="py-2 px-3 text-xs rounded-lg border border-slate-200 bg-white text-slate-700"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[600px] overflow-y-auto pr-1">
              {availableProducts.map((p) => {
                const inCart = cart.find((i) => i.productId === p.id);
                const isOutOfStock = p.stockQuantity === 0;

                return (
                  <div
                    key={p.id}
                    onClick={() => !isOutOfStock && addToCart(p)}
                    className={`p-3 bg-white rounded-xl border transition-all text-left flex flex-col justify-between ${
                      isOutOfStock
                        ? 'opacity-40 cursor-not-allowed border-slate-200 bg-slate-50'
                        : inCart
                        ? 'border-cyan-500 ring-1 ring-cyan-500 shadow-sm cursor-pointer'
                        : 'border-slate-200 hover:border-slate-300 hover:shadow-xs cursor-pointer'
                    }`}
                  >
                    <div>
                      {p.imageUrl ? (
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          className="w-full h-24 object-cover rounded-lg mb-2"
                        />
                      ) : (
                        <div className="w-full h-24 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-300 mb-2">
                          <ShoppingCart className="w-8 h-8" />
                        </div>
                      )}

                      <span className="font-bold text-xs text-slate-900 block truncate">
                        {p.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono block">
                        {p.reference}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100">
                      <span className="font-mono font-bold text-xs text-slate-900 tabular-nums">
                        {formatMoney(p.salePrice, settings.currency)}
                      </span>
                      <span
                        className={`text-[10px] font-mono ${
                          isOutOfStock
                            ? 'text-rose-600 font-bold'
                            : p.stockQuantity <= p.lowStockThreshold
                            ? 'text-amber-600 font-bold'
                            : 'text-slate-500'
                        }`}
                      >
                        {isOutOfStock ? '0 en stock' : `Stock: ${p.stockQuantity}`}
                      </span>
                    </div>

                    {inCart && (
                      <div className="mt-1 text-[10px] text-cyan-600 font-bold text-right">
                        Dans le panier : {inCart.quantity}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Active Cart & Cash Register Details (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-cyan-600" />
                <h2 className="text-sm font-bold text-slate-900">
                  Panier en cours ({cart.reduce((sum, i) => sum + i.quantity, 0)} articles)
                </h2>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs text-rose-500 hover:text-rose-700 flex items-center gap-1 font-medium"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Vider</span>
                </button>
              )}
            </div>

            {/* Cart Items List */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {cart.length === 0 ? (
                <div className="py-10 text-center text-slate-400 text-xs">
                  Sélectionnez des articles dans le catalogue pour démarrer la vente.
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.productId}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="font-semibold text-slate-900 block truncate">
                        {item.productName}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {formatMoney(item.unitPrice, settings.currency)} × {item.quantity}
                      </span>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => updateCartQuantity(item.productId, item.quantity - 1)}
                        className="p-1 rounded bg-white border border-slate-300 hover:bg-slate-100 text-slate-700"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center font-mono font-bold text-slate-900">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateCartQuantity(item.productId, item.quantity + 1)}
                        className="p-1 rounded bg-white border border-slate-300 hover:bg-slate-100 text-slate-700"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="text-right min-w-[70px]">
                      <span className="font-mono font-bold text-slate-900 block">
                        {formatMoney(item.subtotal, settings.currency)}
                      </span>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.productId)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded"
                      title="Retirer l'article"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Customer & Payment Form */}
            <div className="pt-3 border-t border-slate-100 space-y-3">
              {/* Customer select */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <User className="w-3 h-3 text-slate-400" />
                  <span>Client assigné</span>
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full py-1.5 px-2.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-800"
                >
                  <option value="">Client Comptoir (Passage)</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone})
                    </option>
                  ))}
                </select>
              </div>

              {/* Discount Input */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <Tag className="w-3 h-3 text-slate-400" />
                    <span>Remise ({settings.currency})</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={discountAmount || ''}
                    onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                    className="w-full py-1.5 px-2.5 text-xs rounded-lg border border-slate-300 font-mono"
                  />
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Mode de paiement
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full py-1.5 px-2.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-800"
                  >
                    <option value="ESPECES">Espèces (Cash)</option>
                    <option value="MOBILE_MONEY">Mobile Money</option>
                    <option value="CARTE">Carte Bancaire</option>
                    <option value="VIREMENT">Virement</option>
                  </select>
                </div>
              </div>

              {/* Montant Reçu */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[11px] font-semibold text-slate-700">
                    Montant versé / reçu ({settings.currency})
                  </label>
                  <button
                    type="button"
                    onClick={() => setAmountReceivedInput(total.toString())}
                    className="text-[10px] text-cyan-600 hover:underline font-semibold"
                  >
                    Montant exact
                  </button>
                </div>
                <input
                  type="number"
                  min="0"
                  placeholder={`ex. ${total}`}
                  value={amountReceivedInput}
                  onChange={(e) => setAmountReceivedInput(e.target.value)}
                  className="w-full py-2 px-3 text-sm font-bold rounded-lg border border-slate-300 font-mono text-slate-900 focus:outline-hidden focus:border-cyan-500"
                />
              </div>

              {/* Totals Summary */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Sous-total :</span>
                  <span className="font-mono">{formatMoney(subtotal, settings.currency)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Remise :</span>
                    <span className="font-mono">-{formatMoney(discountAmount, settings.currency)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-slate-900 border-t border-slate-200 pt-1.5">
                  <span>Total à payer :</span>
                  <span className="font-mono tabular-nums">{formatMoney(total, settings.currency)}</span>
                </div>

                {amountReceivedInput.trim() !== '' && (
                  <>
                    {amountReceived >= total ? (
                      <div className="flex justify-between text-slate-600 pt-1 border-t border-slate-100">
                        <span>Monnaie à rendre :</span>
                        <span className="font-mono font-bold text-emerald-600">
                          {formatMoney(changeGiven, settings.currency)}
                        </span>
                      </div>
                    ) : (
                      <div className="flex justify-between text-rose-600 font-bold pt-1 border-t border-rose-200">
                        <span>Reste à payer (Dette) :</span>
                        <span className="font-mono">
                          {formatMoney(balanceDue, settings.currency)}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Validate Sale Button */}
              <button
                onClick={handleValidateClick}
                disabled={cart.length === 0}
                className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold text-sm rounded-xl shadow-sm transition-transform active:scale-98 flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Valider et Imprimer la Facture</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* --- HISTORIQUE DES VENTES --- */
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher par numéro de vente, client, caissier..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:border-cyan-500"
              />
            </div>
            <span className="text-xs text-slate-500">
              Total : {filteredSalesHistory.length} vente(s) enregistrée(s)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">N° Vente</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Articles</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-4 text-right">Encaissé</th>
                  <th className="py-3 px-4 text-right">Reste</th>
                  <th className="py-3 px-4">Mode</th>
                  <th className="py-3 px-4 text-center">État</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSalesHistory.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400">
                      Aucune vente trouvée.
                    </td>
                  </tr>
                ) : (
                  filteredSalesHistory.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {s.saleNumber}
                      </td>
                      <td className="py-3 px-4 text-slate-500">{formatDateTime(s.date)}</td>
                      <td className="py-3 px-4 font-medium text-slate-900">{s.customerName}</td>
                      <td className="py-3 px-4 text-slate-600 truncate max-w-[150px]">
                        {s.items.map((i) => `${i.productName} (${i.quantity})`).join(', ')}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold tabular-nums">
                        {formatMoney(s.total, settings.currency)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-600 font-semibold tabular-nums">
                        {formatMoney(s.amountPaid, settings.currency)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-rose-600 tabular-nums">
                        {s.balanceDue > 0 ? formatMoney(s.balanceDue, settings.currency) : '0'}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                        {s.paymentMethod}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            s.status === 'COMPLET'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {s.status === 'COMPLET' ? 'Payé' : 'Partiel (Avance)'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setPreviewDocument({ type: 'invoice', sale: s })}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-cyan-600 hover:bg-slate-100 transition-colors"
                            title="Imprimer / Voir la facture"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          {hasPermission('canDeleteSales') && (
                            <button
                              onClick={() => setDeleteSaleIdConfirm(s.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Annuler la vente"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CONFIRMATION PAIEMENT PARTIEL AVEC AVANCE */}
      {partialPaymentPrompt && (
        <Modal
          isOpen={true}
          onClose={() => setPartialPaymentPrompt(null)}
          title="Validation d'un paiement partiel avec avance"
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1.5">
              <p className="font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>Le montant versé est inférieur au total de la vente !</span>
              </p>
              <p>
                Total de la commande : <strong>{formatMoney(partialPaymentPrompt.total, settings.currency)}</strong>
                <br />
                Avance versée : <strong>{formatMoney(partialPaymentPrompt.amountPaid, settings.currency)}</strong>
                <br />
                Solde restant à devoir : <strong className="text-rose-700">{formatMoney(partialPaymentPrompt.balanceDue, settings.currency)}</strong>
              </p>
            </div>

            <p className="text-xs text-slate-600">
              Acceptez-vous d'enregistrer cette vente avec une avance de{' '}
              <strong>{formatMoney(partialPaymentPrompt.amountPaid, settings.currency)}</strong> et de créer une
              dette client de <strong>{formatMoney(partialPaymentPrompt.balanceDue, settings.currency)}</strong> ?
            </p>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setPartialPaymentPrompt(null);
                  showToast('Vente non validée : avance refusée.', 'info');
                }}
                className="px-3.5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
              >
                Refuser l'avance
              </button>
              <button
                type="button"
                onClick={() => executeSale(partialPaymentPrompt.amountPaid)}
                className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
              >
                Accepter l'avance et valider
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* CONFIRMATION ANNULATION VENTE */}
      {deleteSaleIdConfirm && (
        <Modal
          isOpen={true}
          onClose={() => setDeleteSaleIdConfirm(null)}
          title="Annuler cette vente"
          subtitle="Cette action réintégrera les articles dans le stock."
          maxWidth="sm"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-600">
              Êtes-vous sûr de vouloir annuler cette vente ? Le stock sera restitué et la dette associée éventuelle sera annulée.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteSaleIdConfirm(null)}
                className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Retour
              </button>
              <button
                onClick={() => {
                  deleteSale(deleteSaleIdConfirm);
                  setDeleteSaleIdConfirm(null);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg"
              >
                Confirmer l'annulation
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
