import React, { useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CurrencyCode } from '../../types';
import { Modal } from '../common/Modal';
import { compressImage } from '../../utils/imageCompressor';
import {
  Settings,
  Building,
  Image as ImageIcon,
  Upload,
  Coins,
  FileText,
  Database,
  Download,
  UploadCloud,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    exportDataJson,
    importDataJson,
    resetToInitialData,
    saveIndicator,
    showToast,
  } = useApp();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const currencies: { code: CurrencyCode; label: string }[] = [
    { code: 'FCFA', label: 'Franc CFA (FCFA / XOF / XAF)' },
    { code: 'EUR', label: 'Euro (€)' },
    { code: 'USD', label: 'Dollar Américain ($)' },
    { code: 'CDF', label: 'Franc Congolais (CDF)' },
  ];

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file, 400, 400, 0.85);
        updateSettings({ logoUrl: compressed });
        showToast('Logo mis à jour avec succès.', 'success');
      } catch (err) {
        showToast('Erreur lors du traitement de l\'image.', 'error');
      }
    }
  };

  const handleExportBackup = () => {
    const jsonStr = exportDataJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zando_pro_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Sauvegarde complète exportée sur votre appareil.', 'success');
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const content = evt.target?.result as string;
        importDataJson(content);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Paramètres Généraux de la Boutique
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configuration de l'entreprise, devise active, format des factures et sauvegardes.
          </p>
        </div>

        {/* Subtle auto-save indicator */}
        <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
          <CheckCircle2 className="w-4 h-4" />
          <span>Sauvegarde automatique active</span>
        </div>
      </div>

      {/* 1. Informations de l'Entreprise */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Building className="w-4 h-4 text-cyan-600" />
          <h2 className="text-sm font-bold text-slate-900">
            Identité Commerciale de l'Établissement
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nom de l'entreprise / Boutique
            </label>
            <input
              type="text"
              value={settings.companyName}
              onChange={(e) => updateSettings({ companyName: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:border-cyan-500 font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Slogan / Activité principale
            </label>
            <input
              type="text"
              value={settings.tagline}
              onChange={(e) => updateSettings({ tagline: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Numéro RCCM / NIF fiscal
            </label>
            <input
              type="text"
              value={settings.taxId}
              onChange={(e) => updateSettings({ taxId: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:border-cyan-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Téléphone officiel
            </label>
            <input
              type="text"
              value={settings.phone}
              onChange={(e) => updateSettings({ phone: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:border-cyan-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Adresse email professionnelle
            </label>
            <input
              type="email"
              value={settings.email}
              onChange={(e) => updateSettings({ email: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Adresse physique / Ville
            </label>
            <input
              type="text"
              value={settings.address}
              onChange={(e) => updateSettings({ address: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Logo Upload */}
        <div className="pt-3 border-t border-slate-100 flex items-center gap-4">
          <img
            src={settings.logoUrl || '/src/assets/images/zando_app_logo_1793623512765.jpg'}
            alt="Logo actuel"
            className="w-14 h-14 rounded-xl object-cover ring-1 ring-slate-300 shrink-0"
          />
          <div>
            <span className="text-xs font-bold text-slate-900 block">
              Logo de l'entreprise
            </span>
            <span className="text-[11px] text-slate-500 block mb-2">
              Affiché sur les factures, reçus et publications commerciales.
            </span>
            <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 transition-colors">
              <Upload className="w-3.5 h-3.5" />
              <span>Changer le logo</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* 2. Devise Principale */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Coins className="w-4 h-4 text-emerald-600" />
          <h2 className="text-sm font-bold text-slate-900">
            Devise d'Affichage & de Facturation
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {currencies.map((curr) => (
            <div
              key={curr.code}
              onClick={() => updateSettings({ currency: curr.code })}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                settings.currency === curr.code
                  ? 'border-cyan-500 bg-cyan-50/50 ring-1 ring-cyan-500 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div>
                <span className="text-xs font-bold text-slate-900 block">{curr.label}</span>
                <span className="text-[10px] text-slate-400 font-mono">Code : {curr.code}</span>
              </div>
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  settings.currency === curr.code
                    ? 'border-cyan-600 bg-cyan-600 text-white'
                    : 'border-slate-300'
                }`}
              >
                {settings.currency === curr.code && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Paramètres de Facturation */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <FileText className="w-4 h-4 text-indigo-600" />
          <h2 className="text-sm font-bold text-slate-900">
            Personnalisation des Factures & Reçus
          </h2>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Note de bas de page (Facture A4)
          </label>
          <textarea
            rows={2}
            value={settings.invoiceFooterNote}
            onChange={(e) => updateSettings({ invoiceFooterNote: e.target.value })}
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:border-cyan-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Mention ticket thermique 80 mm
          </label>
          <input
            type="text"
            value={settings.receiptHeaderNote}
            onChange={(e) => updateSettings({ receiptHeaderNote: e.target.value })}
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:border-cyan-500"
          />
        </div>
      </div>

      {/* 4. Sauvegardes, Exportation et Restauration */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Database className="w-4 h-4 text-rose-600" />
          <h2 className="text-sm font-bold text-slate-900">
            Sauvegarde & Restauration Intégrale des Données
          </h2>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Toutes vos données (produits, ventes, créances, dépenses, clients) sont stockées localement sur cet appareil.
          Vous pouvez exporter une archive complète en fichier JSON pour sécuriser vos données ou migrer vers un autre poste.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={handleExportBackup}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>Télécharger la Sauvegarde JSON</span>
          </button>

          <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-semibold text-xs rounded-xl transition-colors">
            <UploadCloud className="w-4 h-4 text-indigo-600" />
            <span>Restaurer depuis un fichier JSON</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleImportFile}
              className="hidden"
            />
          </label>

          <button
            onClick={() => setIsResetModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-xl transition-colors font-medium ml-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Réinitialiser aux données de démo</span>
          </button>
        </div>
      </div>

      {/* MODAL CONFIRMATION RÉINITIALISATION */}
      {isResetModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsResetModalOpen(false)}
          title="Réinitialiser les données"
          subtitle="Restauration du jeu de données initial de démonstration"
          maxWidth="sm"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-600">
              Voulez-vous restaurer les données initiales de démonstration ? Toutes les modifications, ventes et produits ajoutés depuis seront réinitialisés.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsResetModalOpen(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  resetToInitialData();
                  setIsResetModalOpen(false);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-xs"
              >
                Confirmer la réinitialisation
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
