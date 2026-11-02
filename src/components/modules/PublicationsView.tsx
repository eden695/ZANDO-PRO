import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { MarketingPost } from '../../types';
import { formatMoney, formatDate } from '../../utils/formatters';
import { compressImage } from '../../utils/imageCompressor';
import { Modal } from '../common/Modal';
import {
  Share2,
  Plus,
  Copy,
  Download,
  ExternalLink,
  MessageCircle,
  Image as ImageIcon,
  Edit2,
  Trash2,
  Upload,
  Globe,
} from 'lucide-react';

export const PublicationsView: React.FC = () => {
  const {
    marketingPosts,
    addMarketingPost,
    updateMarketingPost,
    deleteMarketingPost,
    products,
    settings,
    showToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'posts' | 'create'>('posts');
  const [editingPost, setEditingPost] = useState<MarketingPost | null>(null);
  const [socialModalPost, setSocialModalPost] = useState<MarketingPost | null>(null);
  const [socialPlatform, setSocialPlatform] = useState<'facebook' | 'instagram' | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    adText: '',
    productId: '',
    productPrice: 0,
    mediaUrl: '',
    mediaType: 'IMAGE' as 'IMAGE' | 'VIDEO',
    hashtags: '#ZandoPro #Mode #Promotion #Qualite',
    status: 'PRET' as 'BROUILLON' | 'PRET',
  });

  const [previewPost, setPreviewPost] = useState<MarketingPost | null>(null);

  const openCreate = () => {
    setEditingPost(null);
    setFormData({
      title: '',
      adText: '',
      productId: products[0]?.id || '',
      productPrice: products[0]?.salePrice || 0,
      mediaUrl: products[0]?.imageUrl || '',
      mediaType: 'IMAGE',
      hashtags: '#ZandoPro #Boutique #Qualite #Promotion',
      status: 'PRET',
    });
    setActiveTab('create');
  };

  const openEdit = (post: MarketingPost) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      adText: post.adText,
      productId: post.productId || '',
      productPrice: post.productPrice || 0,
      mediaUrl: post.mediaUrl,
      mediaType: post.mediaType,
      hashtags: post.hashtags,
      status: post.status,
    });
    setActiveTab('create');
  };

  const handleProductSelect = (productId: string) => {
    const prod = products.find((p) => p.id === productId);
    if (prod) {
      setFormData((prev) => ({
        ...prev,
        productId: prod.id,
        productPrice: prod.salePrice,
        mediaUrl: prod.imageUrl || prev.mediaUrl,
        title: `Offre Spéciale : ${prod.name}`,
        adText: `✨ DISPONIBLE DÈS MAINTENANT CHEZ ${settings.companyName.toUpperCase()} !\n\n${prod.name}\n\n${prod.description || 'Produit de qualité supérieure garanti.'}\n\n🏷️ PRIX : ${formatMoney(prod.salePrice, settings.currency)}\n\n📦 Contactez-nous pour commander :\n📞 Tél / WhatsApp : ${settings.phone}\n📍 Adresse : ${settings.address}`,
      }));
    }
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith('video/')) {
      if (file.size > 2 * 1024 * 1024) {
        showToast('Pour préserver l\'espace local, préférez des vidéos courtes de moins de 2 Mo.', 'info');
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          mediaUrl: reader.result as string,
          mediaType: 'VIDEO',
        }));
      };
      reader.readAsDataURL(file);
    } else {
      try {
        const compressed = await compressImage(file, 900, 900, 0.8);
        setFormData((prev) => ({
          ...prev,
          mediaUrl: compressed,
          mediaType: 'IMAGE',
        }));
        showToast('Image optimisée et chargée avec succès.', 'success');
      } catch {
        showToast('Erreur lors du traitement de l\'image.', 'error');
      }
    }
  };

  const handleSavePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.adText.trim()) {
      showToast('Le titre et le texte publicitaire sont requis.', 'error');
      return;
    }

    if (editingPost) {
      updateMarketingPost(editingPost.id, formData);
    } else {
      addMarketingPost(formData);
    }

    setActiveTab('posts');
  };

  // Real Sharing Handlers
  const handleCopyText = (post: MarketingPost) => {
    const fullText = `${post.title}\n\n${post.adText}\n\n${post.hashtags}`;
    navigator.clipboard.writeText(fullText);
    showToast('Texte et hashtags copiés dans le presse-papiers !', 'success');
  };

  const handleWhatsAppShare = (post: MarketingPost) => {
    const fullText = `${post.title}\n\n${post.adText}\n\n${post.hashtags}`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(fullText)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleOpenSocialModal = (post: MarketingPost, platform: 'facebook' | 'instagram') => {
    handleCopyText(post);
    setSocialModalPost(post);
    setSocialPlatform(platform);
  };

  const handleNativeShare = async (post: MarketingPost) => {
    const fullText = `${post.title}\n\n${post.adText}\n\n${post.hashtags}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: fullText,
        });
        showToast('Partage système ouvert avec succès.', 'info');
      } catch {
        // User cancelled or not supported
      }
    } else {
      handleCopyText(post);
      showToast('Partage natif non supporté par ce navigateur. Le texte a été copié.', 'info');
    }
  };

  const handleDownloadMedia = (post: MarketingPost) => {
    if (!post.mediaUrl) {
      showToast('Aucun média n\'est associé à cette publication.', 'error');
      return;
    }
    const a = document.createElement('a');
    a.href = post.mediaUrl;
    a.download = `zando_publication_${post.id}.${post.mediaType === 'VIDEO' ? 'mp4' : 'jpg'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('Téléchargement du média lancé sur votre appareil.', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Publications Commerciales & Réseaux Sociaux
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Préparez vos annonces avec photos et diffusez-les directement sur WhatsApp, Facebook ou Instagram.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('posts')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'posts'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Publications ({marketingPosts.length})
          </button>
          <button
            onClick={openCreate}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'create'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'bg-cyan-50 text-cyan-800 border border-cyan-200 hover:bg-cyan-100'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nouvelle Annonce</span>
          </button>
        </div>
      </div>

      {activeTab === 'posts' ? (
        /* --- LISTE DES PUBLICATIONS --- */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {marketingPosts.map((post) => (
            <div
              key={post.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div>
                {/* Media banner */}
                <div className="relative w-full h-48 bg-slate-900 overflow-hidden">
                  {post.mediaUrl ? (
                    post.mediaType === 'VIDEO' ? (
                      <video
                        src={post.mediaUrl}
                        controls
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src={post.mediaUrl}
                        alt={post.title}
                        className="w-full h-full object-cover"
                      />
                    )
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600">
                      <ImageIcon className="w-12 h-12 opacity-40" />
                    </div>
                  )}

                  {post.productPrice ? (
                    <div className="absolute bottom-2 right-2 px-2.5 py-1 bg-slate-950/80 backdrop-blur-xs text-cyan-300 font-mono font-bold text-xs rounded-lg border border-slate-700">
                      {formatMoney(post.productPrice, settings.currency)}
                    </div>
                  ) : null}
                </div>

                {/* Content */}
                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-slate-400">
                      {formatDate(post.createdAt)}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        post.status === 'PRET'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {post.status === 'PRET' ? 'Prêt à diffuser' : 'Brouillon'}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 leading-snug line-clamp-1">
                    {post.title}
                  </h3>

                  <p className="text-xs text-slate-600 whitespace-pre-line line-clamp-4 leading-relaxed">
                    {post.adText}
                  </p>

                  <p className="text-[11px] text-cyan-600 font-mono line-clamp-1">
                    {post.hashtags}
                  </p>
                </div>
              </div>

              {/* Functional Actions Bar */}
              <div className="p-4 pt-2 border-t border-slate-100 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleWhatsAppShare(post)}
                    className="py-1.5 px-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                    title="Ouvrir WhatsApp avec texte prérempli"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </button>

                  <button
                    onClick={() => handleOpenSocialModal(post, 'facebook')}
                    className="py-1.5 px-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                    title="Partager sur Facebook"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Facebook</span>
                  </button>

                  <button
                    onClick={() => handleOpenSocialModal(post, 'instagram')}
                    className="py-1.5 px-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                    title="Partager sur Instagram"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Instagram</span>
                  </button>

                  <button
                    onClick={() => handleNativeShare(post)}
                    className="py-1.5 px-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                    title="Partager via le menu système"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Partager</span>
                  </button>
                </div>

                <div className="flex items-center justify-between pt-1 text-slate-500 text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopyText(post)}
                      className="hover:text-slate-900 flex items-center gap-1 text-[11px] font-medium"
                      title="Copier le texte"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copier</span>
                    </button>

                    {post.mediaUrl && (
                      <button
                        onClick={() => handleDownloadMedia(post)}
                        className="hover:text-slate-900 flex items-center gap-1 text-[11px] font-medium"
                        title="Télécharger l'image"
                      >
                        <Download className="w-3 h-3" />
                        <span>Média</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(post)}
                      className="p-1 hover:text-slate-900 rounded"
                      title="Modifier"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteMarketingPost(post.id)}
                      className="p-1 hover:text-rose-600 rounded"
                      title="Supprimer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* --- ÉDITEUR DE PUBLICATION AVEC APERÇU LIVE --- */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Form (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              {editingPost ? 'Modifier l\'annonce' : 'Créer une annonce commerciale'}
            </h2>

            <form onSubmit={handleSavePost} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lier à un produit du magasin (remplissage automatique)
                </label>
                <select
                  value={formData.productId}
                  onChange={(e) => handleProductSelect(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                >
                  <option value="">Sélectionnez un produit...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({formatMoney(p.salePrice, settings.currency)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Titre de la publication *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="ex. Arrivage Exclusif : Sneakers Urban"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:border-cyan-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Prix affiché ({settings.currency})
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.productPrice || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, productPrice: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Statut
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as 'BROUILLON' | 'PRET' })
                    }
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="PRET">Prêt pour publication</option>
                    <option value="BROUILLON">Brouillon</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Photo ou Vidéo publicitaire (depuis l'appareil)
                </label>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg border border-slate-300 transition-colors">
                    <Upload className="w-4 h-4" />
                    <span>Téléverser image ou vidéo</span>
                    <input
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleMediaUpload}
                      className="hidden"
                    />
                  </label>
                  {formData.mediaUrl && (
                    <span className="text-xs text-emerald-600 font-medium">
                      ✓ Média prêt
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Texte publicitaire complet *
                </label>
                <textarea
                  rows={6}
                  required
                  value={formData.adText}
                  onChange={(e) => setFormData({ ...formData, adText: e.target.value })}
                  placeholder="Rédigez l'argumentaire, les détails, les modalités de commande..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:border-cyan-500 leading-relaxed font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Hashtags
                </label>
                <input
                  type="text"
                  value={formData.hashtags}
                  onChange={(e) => setFormData({ ...formData, hashtags: e.target.value })}
                  placeholder="#ZandoPro #Boutique #Abidjan"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono text-cyan-700"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('posts')}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs"
                >
                  {editingPost ? 'Mettre à jour l\'annonce' : 'Enregistrer la publication'}
                </button>
              </div>
            </form>
          </div>

          {/* Live Mobile/Social Preview (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-100 p-4 rounded-2xl border border-slate-200">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-3 text-center">
                Aperçu en temps réel
              </span>

              {/* Social Card Mock */}
              <div className="max-w-sm mx-auto bg-white rounded-2xl border border-slate-300 shadow-md overflow-hidden">
                {/* Header Mock */}
                <div className="p-3 border-b border-slate-100 flex items-center gap-2.5">
                  <img
                    src={settings.logoUrl || '/src/assets/images/zando_app_logo_1793623512765.jpg'}
                    alt="Logo"
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div>
                    <span className="font-bold text-xs text-slate-900 block leading-tight">
                      {settings.companyName}
                    </span>
                    <span className="text-[10px] text-slate-400">À l'instant · Public</span>
                  </div>
                </div>

                {/* Media Preview */}
                <div className="relative w-full h-52 bg-slate-900">
                  {formData.mediaUrl ? (
                    formData.mediaType === 'VIDEO' ? (
                      <video src={formData.mediaUrl} controls className="w-full h-full object-cover" />
                    ) : (
                      <img src={formData.mediaUrl} alt="Preview" className="w-full h-full object-cover" />
                    )
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 text-xs">
                      <ImageIcon className="w-8 h-8 opacity-40 mb-1" />
                      <span>Aucune image sélectionnée</span>
                    </div>
                  )}

                  {formData.productPrice > 0 && (
                    <div className="absolute bottom-2 right-2 px-2.5 py-1 bg-slate-950/80 backdrop-blur-xs text-cyan-300 font-mono font-bold text-xs rounded-lg border border-slate-700">
                      {formatMoney(formData.productPrice, settings.currency)}
                    </div>
                  )}
                </div>

                {/* Text Body */}
                <div className="p-3.5 space-y-2">
                  <h4 className="font-bold text-xs text-slate-900">
                    {formData.title || 'Titre de l\'annonce...'}
                  </h4>
                  <p className="text-[11px] text-slate-600 whitespace-pre-line leading-relaxed">
                    {formData.adText || 'Votre texte d\'annonce apparaîtra ici...'}
                  </p>
                  <p className="text-[10px] text-cyan-600 font-mono">
                    {formData.hashtags}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Social Sharing Modal */}
      {socialModalPost && socialPlatform && (
        <Modal
          isOpen={!!socialModalPost}
          onClose={() => {
            setSocialModalPost(null);
            setSocialPlatform(null);
          }}
          title={socialPlatform === 'facebook' ? 'Partage sur Facebook' : 'Partage sur Instagram'}
        >
          <div className="space-y-4">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                ✓
              </div>
              <div className="text-xs text-emerald-950">
                <strong className="block font-bold mb-0.5">Texte et hashtags copiés avec succès !</strong>
                Votre annonce complète est prête à être collée dans votre prochaine publication ou story.
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-600">
              <p className="font-semibold text-slate-800">Comment publier en 3 étapes simples :</p>
              <ol className="list-decimal list-inside space-y-1.5 pl-1">
                <li>
                  {socialModalPost.mediaUrl ? (
                    <span>
                      Téléchargez l'image ou la vidéo ci-dessous sur votre appareil :
                    </span>
                  ) : (
                    <span>Le texte est déjà dans votre presse-papiers.</span>
                  )}
                </li>
                <li>
                  Ouvrez {socialPlatform === 'facebook' ? 'Facebook' : 'Instagram'} via le bouton ci-dessous.
                </li>
                <li>
                  Créez une nouvelle publication, joignez l'image et collez le texte (<kbd className="px-1 py-0.5 bg-slate-100 rounded text-[10px] font-mono border border-slate-300">Ctrl+V</kbd> ou maintien tactile).
                </li>
              </ol>
            </div>

            {socialModalPost.mediaUrl && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <img
                    src={socialModalPost.mediaUrl}
                    alt="Aperçu"
                    className="w-10 h-10 object-cover rounded-lg shrink-0 border border-slate-200"
                  />
                  <div className="truncate text-xs">
                    <span className="font-semibold text-slate-800 block truncate">Visuel de l'annonce</span>
                    <span className="text-[10px] text-slate-500">Prêt pour les réseaux</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDownloadMedia(socialModalPost)}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shrink-0 transition-colors shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Télécharger</span>
                </button>
              </div>
            )}

            <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => handleCopyText(socialModalPost)}
                className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Recopier le texte</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSocialModalPost(null);
                    setSocialPlatform(null);
                  }}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Fermer
                </button>

                <a
                  href={socialPlatform === 'facebook' ? 'https://www.facebook.com' : 'https://www.instagram.com'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`px-4 py-2 text-xs font-bold text-white rounded-lg flex items-center gap-1.5 shadow-xs transition-colors ${
                    socialPlatform === 'facebook'
                      ? 'bg-blue-600 hover:bg-blue-500'
                      : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90'
                  }`}
                >
                  <span>Ouvrir {socialPlatform === 'facebook' ? 'Facebook' : 'Instagram'}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

