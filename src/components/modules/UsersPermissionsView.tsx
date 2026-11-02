import React, { useState } from 'react';
import { useApp, ROLE_PERMISSIONS } from '../../context/AppContext';
import { UserRole, UserPermissions } from '../../types';
import {
  ShieldCheck,
  User as UserIcon,
  CheckCircle,
  XCircle,
  KeyRound,
  Lock,
  UserCheck,
} from 'lucide-react';

export const UsersPermissionsView: React.FC = () => {
  const { users, currentUser, switchUser, updateUserRole, hasPermission, showToast } = useApp();

  const roles: UserRole[] = ['ADMIN', 'GESTIONNAIRE', 'CAISSIER', 'VENDEUR'];

  const permissionDescriptions: { key: keyof UserPermissions; label: string; detail: string }[] = [
    {
      key: 'canViewDebts',
      label: 'Consulter et gérer les dettes clients',
      detail: 'Accès au carnet de créances et enregistrement des remboursements.',
    },
    {
      key: 'canDeleteSales',
      label: 'Supprimer ou annuler des ventes',
      detail: 'Réintégration automatique du stock en cas d\'erreur de caisse.',
    },
    {
      key: 'canModifyProducts',
      label: 'Créer et modifier le catalogue & stocks',
      detail: 'Ajout de produits, ajustement manuel des quantités en magasin.',
    },
    {
      key: 'canRecordExpenses',
      label: 'Enregistrer des sorties de caisse et dépenses',
      detail: 'Saisie des charges d\'exploitation avec justificatifs.',
    },
    {
      key: 'canViewStats',
      label: 'Accéder aux statistiques et rapports financiers',
      detail: 'Chiffre d\'affaires, bénéfice net estimé et exportations comptables.',
    },
    {
      key: 'canAccessSettings',
      label: 'Modifier les paramètres et sauvegardes',
      detail: 'Coordonnées de l\'entreprise, devise, import/export des données.',
    },
    {
      key: 'canManageUsers',
      label: 'Gérer les utilisateurs et attribuer les rôles',
      detail: 'Administration complète des comptes du personnel.',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Gestion des Utilisateurs & Contrôle des Permissions
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Rôles opérationnels stricts : les autorisations sont vérifiées lors de chaque action métier.
        </p>
      </div>

      {/* Active User Switcher Banner */}
      <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-sm border border-cyan-500/30">
            {currentUser.name.charAt(0)}
          </div>
          <div>
            <span className="text-xs text-slate-400 block">Profil actuellement connecté :</span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white">{currentUser.name}</span>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold">
                {currentUser.role}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 hidden sm:inline">Tester un autre compte :</span>
          <select
            value={currentUser.id}
            onChange={(e) => switchUser(e.target.value)}
            className="py-1.5 px-3 bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg font-medium focus:outline-hidden focus:border-cyan-500"
          >
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.role})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Users List & Role Configuration */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-cyan-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Personnel de la Boutique ({users.length})
            </h2>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Utilisateur</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Téléphone</th>
                <th className="py-3 px-4">Rôle Attribué</th>
                <th className="py-3 px-4 text-center">Statut</th>
                <th className="py-3 px-4 text-right">Connexion Rapide</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold flex items-center justify-center">
                        {u.name.charAt(0)}
                      </div>
                      <span>{u.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-500 font-mono">{u.email}</td>
                  <td className="py-3 px-4 text-slate-600 font-mono">{u.phone}</td>
                  <td className="py-3 px-4">
                    <select
                      value={u.role}
                      disabled={!hasPermission('canManageUsers') && u.id !== currentUser.id}
                      onChange={(e) => updateUserRole(u.id, e.target.value as UserRole)}
                      className="py-1 px-2 text-xs font-semibold rounded-md border border-slate-300 bg-white text-slate-800 disabled:opacity-50"
                    >
                      {roles.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Actif
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => switchUser(u.id)}
                      className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                        u.id === currentUser.id
                          ? 'bg-slate-100 text-slate-400 cursor-default'
                          : 'bg-slate-900 hover:bg-slate-800 text-white'
                      }`}
                    >
                      {u.id === currentUser.id ? 'Actif' : 'Basculer'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Permissions Matrix Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-slate-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Matrice de Contrôle d'Accès par Rôle
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Droits d'exécution appliqués sur l'interface et le moteur transactionnel.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Permission Opérationnelle</th>
                <th className="py-3 px-4 text-center">Administrateur</th>
                <th className="py-3 px-4 text-center">Gestionnaire</th>
                <th className="py-3 px-4 text-center">Caissier</th>
                <th className="py-3 px-4 text-center">Vendeur</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {permissionDescriptions.map((perm) => (
                <tr key={perm.key} className="hover:bg-slate-50/60">
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-900 block">{perm.label}</span>
                    <span className="text-[10px] text-slate-400 block">{perm.detail}</span>
                  </td>

                  {roles.map((role) => {
                    const isAllowed = ROLE_PERMISSIONS[role][perm.key];
                    return (
                      <td key={role} className="py-3 px-4 text-center">
                        {isAllowed ? (
                          <div className="inline-flex items-center justify-center text-emerald-600">
                            <CheckCircle className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="inline-flex items-center justify-center text-slate-300">
                            <XCircle className="w-4 h-4" />
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
