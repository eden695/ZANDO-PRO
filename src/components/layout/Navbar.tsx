import React from 'react';
import { useApp } from '../../context/AppContext';
import { CurrencyCode } from '../../types';
import { defaultLogoUrl, getValidImageUrl } from '../../utils/assets';
import {
  ShoppingBag,
  CheckCircle2,
  User as UserIcon,
  Sparkles,
} from 'lucide-react';

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const {
    settings,
    updateSettings,
    currentUser,
    users,
    switchUser,
    saveIndicator,
    setActiveTab,
  } = useApp();

  const currencies: CurrencyCode[] = ['FCFA', 'EUR', 'USD', 'CDF'];

  return (
    <header className="sticky top-0 z-30 h-16 bg-slate-900 text-white border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between gap-4 no-print select-none">
      {/* Zone 1: Brand & Toggle */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          title="Menu"
          aria-label="Ouvrir le menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <img
            src={getValidImageUrl(settings.logoUrl, defaultLogoUrl)}
            alt="ZANDO Pro Logo"
            className="w-8 h-8 rounded-lg object-cover ring-1 ring-cyan-500/30"
          />
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
              ZANDO <span className="text-cyan-400">Pro</span>
            </span>
          </div>
        </div>
      </div>

      {/* Zone 2: Quick Search / Assistant / Save indicator / Currency */}
      <div className="flex items-center gap-3">
        {/* Auto save indicator */}
        <div
          className={`hidden sm:flex items-center gap-1.5 text-xs transition-opacity duration-300 ${
            saveIndicator ? 'opacity-100 text-emerald-400' : 'opacity-0'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Synchronisé</span>
        </div>

        {/* Currency Switcher */}
        <div className="flex items-center bg-slate-800/80 rounded-lg p-0.5 border border-slate-700/60">
          {currencies.map((curr) => (
            <button
              key={curr}
              onClick={() => updateSettings({ currency: curr })}
              className={`px-2 py-1 text-xs font-semibold rounded transition-colors ${
                settings.currency === curr
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {curr}
            </button>
          ))}
        </div>

        {/* Quick Assistant Shortcut */}
        <button
          onClick={() => setActiveTab('assistant')}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700/90 text-cyan-300 text-xs font-medium rounded-lg border border-cyan-500/30 transition-all hover:border-cyan-500/60"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Assistant ZANDO</span>
        </button>
      </div>

      {/* Zone 3: Fast Sale button & User Selector */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Fast Sale CTA */}
        <button
          onClick={() => setActiveTab('sales')}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold rounded-lg shadow-sm transition-transform active:scale-95"
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Nouvelle Vente</span>
          <span className="sm:hidden">Vente</span>
        </button>

        {/* User Role Switcher Dropdown */}
        <div className="relative group">
          <div className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-lg cursor-pointer transition-colors">
            <div className="w-6 h-6 rounded-full bg-cyan-600/30 text-cyan-300 flex items-center justify-center text-xs font-bold">
              {currentUser.name.charAt(0)}
            </div>
            <div className="hidden xl:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-200 leading-tight truncate max-w-[100px]">
                {currentUser.name}
              </span>
              <span className="text-[10px] text-cyan-400 font-medium">
                {currentUser.role}
              </span>
            </div>
          </div>

          {/* Quick role change menu */}
          <div className="absolute right-0 mt-1 w-52 bg-slate-900 border border-slate-800 rounded-xl shadow-xl py-1.5 hidden group-hover:block hover:block z-50">
            <div className="px-3 py-1.5 border-b border-slate-800 text-[11px] text-slate-400 font-medium">
              Changer d'utilisateur actif
            </div>
            {users.map((u) => (
              <button
                key={u.id}
                onClick={() => switchUser(u.id)}
                className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-slate-800 transition-colors ${
                  u.id === currentUser.id ? 'text-cyan-400 bg-slate-800/50 font-semibold' : 'text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <UserIcon className="w-3.5 h-3.5 opacity-60" />
                  <span className="truncate">{u.name}</span>
                </div>
                <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400">
                  {u.role}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
};
