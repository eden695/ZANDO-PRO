import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';
import { formatMoney, formatDateTime } from '../../utils/formatters';
import { Modal } from '../common/Modal';
import { compressImage } from '../../utils/imageCompressor';
import {
  Package,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  History,
  Edit2,
  Trash2,
  ArrowUpDown,
  Upload,
  Image as ImageIcon,
  Check,
} from 'lucide-react';

export const ProductsView: React.FC = () => {
  const {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    adjustStock,
    stockMovements,
    settings,
    hasPermission,
    showToast,
  } = useApp();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('TOUTES');
  const [activeTab, setActiveTab] = useState<'catalog' | 'movements'>('catalog');

  // Modal states
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustTargetProduct, setAdjustTargetProduct] = useState<Product | null>(null);
  const [adjustDelta, setAdjustDelta] = useState<number>(1);
  const [adjustReason, setAdjustReason] = useState<string>('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form fields
  const [formData, setFormData] = useState({
    name: '',
    reference: '',
    category: '',
    purchasePrice: 0,
    salePrice: 0,
    stockQuantity: 0,
    lowStockThreshold: 5,
    description: '',
    imageUrl: '',
  });

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category).filter(Boolean));
    return ['TOUTES', ...Array.from(set)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.reference.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase());
      const matchCategory =
        selectedCategory === 'TOUTES' || p.category === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [products, search, selectedCategory]);

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      reference: `REF-${Math.floor(1000 + Math.random() * 9000)}`,
      category: 'Général',
      purchasePrice: 0,
      salePrice: 0,
      stockQuantity: 10,
      lowStockThreshold: 3,
      description: '',
      imageUrl: '',
    });
    setIsAddEditModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      reference: p.reference,
      category: p.category,
      purchasePrice: p.purchasePrice,
      salePrice: p.salePrice,
      stockQuantity: p.stockQuantity,
      lowStockThreshold: p.lowStockThreshold,
      description: p.description,
      imageUrl: p.imageUrl,
    });
    setIsAddEditModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file, 600, 600, 0.82);
        setFormData((prev) => ({ ...prev, imageUrl: compressed }));
      } catch (err) {
        showToast('Erreur lors du traitement de l\'image.', 'error');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('Le nom du produit est obligatoire.', 'error');
      return;
    }
    if (formData.salePrice <= 0) {
      showToast('Le prix de vente doit être supérieur à zéro.', 'error');
      return;
    }

    if (editingProduct) {
      updateProduct(editingProduct.id, formData);
    } else {
      addProduct(formData);
    }
    setIsAddEditModalOpen(false);
  };

  const handleAdjustStockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustTargetProduct) return;
    adjustStock(adjustTargetProduct.id, adjustDelta, adjustReason);
    setIsAdjustModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Produits et Gestion des Stocks
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Catalogue complet, alertes de rupture et mouvements de stock en temps réel.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Sub-tabs: Catalogue vs Historique mouvements */}
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
            <button
              onClick={() => setActiveTab('catalog')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'catalog'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Catalogue ({products.length})
            </button>
            <button
              onClick={() => setActiveTab('movements')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'movements'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mouvements ({stockMovements.length})
            </button>
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Nouveau Produit</span>
          </button>
        </div>
      </div>

      {activeTab === 'catalog' ? (
        <>
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher par nom, référence..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="py-2 px-3 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-hidden focus:border-cyan-500"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Products Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Produit</th>
                    <th className="py-3 px-4">Réf.</th>
                    <th className="py-3 px-4">Catégorie</th>
                    <th className="py-3 px-4 text-right">Prix Achat</th>
                    <th className="py-3 px-4 text-right">Prix Vente</th>
                    <th className="py-3 px-4 text-center">Quantité</th>
                    <th className="py-3 px-4 text-right">Valeur Stock</th>
                    <th className="py-3 px-4 text-center">État Stock</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        Aucun produit ne correspond à vos critères de recherche.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((p) => {
                      const isOutOfStock = p.stockQuantity === 0;
                      const isLowStock = p.stockQuantity > 0 && p.stockQuantity <= p.lowStockThreshold;

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              {p.imageUrl ? (
                                <img
                                  src={p.imageUrl}
                                  alt={p.name}
                                  className="w-10 h-10 rounded-lg object-cover ring-1 ring-slate-200 shrink-0"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                                  <Package className="w-5 h-5" />
                                </div>
                              )}
                              <div>
                                <span className="font-bold text-slate-900 block truncate max-w-[200px]">
                                  {p.name}
                                </span>
                                {p.description && (
                                  <span className="text-[11px] text-slate-400 block truncate max-w-[200px]">
                                    {p.description}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4 font-mono text-slate-600">{p.reference}</td>
                          <td className="py-3 px-4 text-slate-600">{p.category}</td>
                          <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-500">
                            {formatMoney(p.purchasePrice, settings.currency)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold tabular-nums text-slate-900">
                            {formatMoney(p.salePrice, settings.currency)}
                          </td>
                          <td className="py-3 px-4 text-center font-mono font-bold text-sm">
                            <span
                              className={
                                isOutOfStock
                                  ? 'text-rose-600'
                                  : isLowStock
                                  ? 'text-amber-600'
                                  : 'text-slate-800'
                              }
                            >
                              {p.stockQuantity}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono tabular-nums font-medium text-slate-700">
                            {formatMoney(p.stockQuantity * p.salePrice, settings.currency)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isOutOfStock ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                                Rupture
                              </span>
                            ) : isLowStock ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                Stock Faible ({p.stockQuantity})
                              </span>
                            ) : (
                              <span className="text-[10px] font-medium text-slate-500">
                                Disponible
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => {
                                  setAdjustTargetProduct(p);
                                  setAdjustDelta(1);
                                  setAdjustReason('');
                                  setIsAdjustModalOpen(true);
                                }}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-cyan-600 hover:bg-slate-100 transition-colors"
                                title="Ajuster le stock"
                              >
                                <ArrowUpDown className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => openEditModal(p)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                                title="Modifier"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(p.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                title="Supprimer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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
        </>
      ) : (
        /* --- HISTORIQUE MOUVEMENTS DE STOCK --- */
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900">
              Journal des Entrées et Sorties de Stock
            </h2>
            <p className="text-xs text-slate-500">
              Traçabilité exhaustive des mouvements liés aux ventes, arrivages et ajustements.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Produit</th>
                  <th className="py-2.5 px-4">Type</th>
                  <th className="py-2.5 px-4 text-center">Quantité</th>
                  <th className="py-2.5 px-4 text-center">Stock Avant / Après</th>
                  <th className="py-2.5 px-4">Motif / Justification</th>
                  <th className="py-2.5 px-4">Opérateur</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stockMovements.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 text-slate-500">{formatDateTime(m.date)}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{m.productName}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          m.type === 'ENTREE'
                            ? 'bg-emerald-50 text-emerald-700'
                            : m.type === 'VENTE'
                            ? 'bg-cyan-50 text-cyan-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {m.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold">
                      {m.type === 'ENTREE' ? `+${m.quantity}` : `-${m.quantity}`}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-slate-500">
                      {m.previousStock} → <strong className="text-slate-800">{m.newStock}</strong>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{m.reason}</td>
                    <td className="py-3 px-4 text-slate-500">{m.userName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: AJOUT / MODIFICATION PRODUIT */}
      <Modal
        isOpen={isAddEditModalOpen}
        onClose={() => setIsAddEditModalOpen(false)}
        title={editingProduct ? 'Modifier le produit' : 'Ajouter un nouveau produit'}
        subtitle="Renseignez les détails, prix et stock initial"
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nom du produit *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="ex. Sneakers Lifestyle Urban"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Référence / Code-barres
              </label>
              <input
                type="text"
                value={formData.reference}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                placeholder="ex. SNK-001"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:border-cyan-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Catégorie
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="ex. Chaussures & Baskets"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Seuil d'alerte stock faible
              </label>
              <input
                type="number"
                min="0"
                value={formData.lowStockThreshold}
                onChange={(e) =>
                  setFormData({ ...formData, lowStockThreshold: parseInt(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:border-cyan-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Prix d'achat ({settings.currency})
              </label>
              <input
                type="number"
                min="0"
                value={formData.purchasePrice}
                onChange={(e) =>
                  setFormData({ ...formData, purchasePrice: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:border-cyan-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Prix de vente ({settings.currency}) *
              </label>
              <input
                type="number"
                min="0"
                required
                value={formData.salePrice}
                onChange={(e) =>
                  setFormData({ ...formData, salePrice: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:border-cyan-500 font-mono font-bold"
              />
            </div>

            {!editingProduct && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Quantité en stock initiale
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.stockQuantity}
                  onChange={(e) =>
                    setFormData({ ...formData, stockQuantity: parseInt(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:border-cyan-500 font-mono font-bold text-cyan-700"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description du produit
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Caractéristiques, matière, détails..."
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:border-cyan-500"
            />
          </div>

          {/* Image Upload from device */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Photo du produit (depuis l'appareil)
            </label>
            <div className="flex items-center gap-4">
              {formData.imageUrl ? (
                <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-300 shrink-0">
                  <img
                    src={formData.imageUrl}
                    alt="Aperçu"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, imageUrl: '' })}
                    className="absolute top-0.5 right-0.5 p-1 bg-rose-600 text-white rounded-full text-[10px]"
                    title="Supprimer la photo"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="w-16 h-16 rounded-lg bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center text-slate-400 shrink-0">
                  <ImageIcon className="w-6 h-6" />
                </div>
              )}

              <label className="cursor-pointer flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg border border-slate-300 transition-colors">
                <Upload className="w-4 h-4" />
                <span>Choisir une image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddEditModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg shadow-xs transition-colors"
            >
              {editingProduct ? 'Enregistrer les modifications' : 'Créer le produit'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: AJUSTER LE STOCK MANUELLEMENT */}
      <Modal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        title="Ajustement manuel de stock"
        subtitle={`Produit : ${adjustTargetProduct?.name}`}
      >
        <form onSubmit={handleAdjustStockSubmit} className="space-y-4">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Stock actuel :</span>
              <span className="font-mono font-bold text-slate-900">{adjustTargetProduct?.stockQuantity}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Quantité à ajouter (+) ou retirer (-)
            </label>
            <input
              type="number"
              required
              value={adjustDelta}
              onChange={(e) => setAdjustDelta(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono font-bold text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Motif de l'ajustement *
            </label>
            <input
              type="text"
              required
              placeholder="ex. Réassort fournisseur, casse, inventaire..."
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 text-xs"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAdjustModalOpen(false)}
              className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
            >
              Valider l'ajustement
            </button>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRMATION */}
      {deleteConfirmId && (
        <Modal
          isOpen={true}
          onClose={() => setDeleteConfirmId(null)}
          title="Confirmer la suppression"
          subtitle="Cette action retirera définitivement ce produit du catalogue."
          maxWidth="sm"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-600">
              Êtes-vous sûr de vouloir supprimer cet article ? Cette opération est irréversible.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  deleteProduct(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg"
              >
                Confirmer la suppression
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
