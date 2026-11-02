import React from 'react';
import { useApp } from '../../context/AppContext';
import { NavigationTab } from '../../types';
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  ClipboardList,
  CreditCard,
  Receipt,
  FileText,
  Truck,
  Share2,
  Sparkles,
  BarChart3,
  ShieldCheck,
  Settings,
  ChevronLeft,
  ChevronRight,
  Lock,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}) => {
  const {
    activeTab,
    setActiveTab,
    products,
    orders,
    debts,
    hasPermission,
  } = useApp();

  // Compute live badges
  const lowStockCount = products.filter(
    (p) => p.stockQuantity === 0 || p.stockQuantity <= p.lowStockThreshold
  ).length;

  const pendingOrdersCount = orders.filter(
    (o) => o.status !== 'LIVREE' && o.status !== 'ANNULEE'
  ).length;

  const activeDebtsCount = debts.filter((d) => d.status !== 'SOLDEE').length;

  interface NavItem {
    id: NavigationTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
    badgeColor?: string;
    requiredPerm?: 'canViewDebts' | 'canViewStats' | 'canAccessSettings' | 'canManageUsers';
  }

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    {
      id: 'products',
      label: 'Produits & Stocks',
      icon: Package,
      badge: lowStockCount > 0 ? lowStockCount : undefined,
      badgeColor: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    },
    { id: 'customers', label: 'Clients', icon: Users },
    { id: 'sales', label: 'Ventes & Caisse', icon: ShoppingCart },
    {
      id: 'orders',
      label: 'Commandes',
      icon: ClipboardList,
      badge: pendingOrdersCount > 0 ? pendingOrdersCount : undefined,
      badgeColor: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30',
    },
    {
      id: 'debts',
      label: 'Dettes & Avances',
      icon: CreditCard,
      badge: activeDebtsCount > 0 ? activeDebtsCount : undefined,
      badgeColor: 'bg-rose-500/20 text-rose-400 border border-rose-500/30',
      requiredPerm: 'canViewDebts',
    },
    { id: 'expenses', label: 'Dépenses', icon: Receipt },
    { id: 'invoices', label: 'Factures & Reçus', icon: FileText },
    { id: 'suppliers', label: 'Fournisseurs', icon: Truck },
    { id: 'posts', label: 'Publications & Partage', icon: Share2 },
    {
      id: 'assistant',
      label: 'Assistant ZANDO',
      icon: Sparkles,
      badgeColor: 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30',
    },
    {
      id: 'reports',
      label: 'Rapports & Stats',
      icon: BarChart3,
      requiredPerm: 'canViewStats',
    },
    {
      id: 'users',
      label: 'Utilisateurs & Rôles',
      icon: ShieldCheck,
      requiredPerm: 'canManageUsers',
    },
    {
      id: 'settings',
      label: 'Paramètres',
      icon: Settings,
      requiredPerm: 'canAccessSettings',
    },
  ];

  const handleNavClick = (item: NavItem) => {
    if (item.requiredPerm && !hasPermission(item.requiredPerm)) {
      // Permission blocked
      return;
    }
    setActiveTab(item.id);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-950/70 z-40 lg:hidden backdrop-blur-xs"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-0 lg:top-16 z-40 h-full lg:h-[calc(100vh-4rem)] bg-slate-900 border-r border-slate-800 text-slate-300 transition-all duration-200 flex flex-col no-print ${
          collapsed ? 'w-20' : 'w-64'
        } ${mobileOpen ? 'left-0' : '-left-full lg:left-0'}`}
      >
        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-2.5 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isForbidden = item.requiredPerm && !hasPermission(item.requiredPerm);

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item)}
                disabled={isForbidden}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all group relative ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-300 font-semibold border border-cyan-500/30 shadow-xs'
                    : isForbidden
                    ? 'opacity-40 cursor-not-allowed text-slate-500'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                } ${collapsed ? 'justify-center' : 'justify-between'}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  {!collapsed && (
                    <span className="truncate text-left">{item.label}</span>
                  )}
                </div>

                {!collapsed && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    {isForbidden && <Lock className="w-3 h-3 text-slate-500" />}
                    {item.badge !== undefined && (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${item.badgeColor || 'bg-slate-800 text-slate-300'}`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}

                {/* Collapsed Badge Dot indicator */}
                {collapsed && item.badge !== undefined && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-cyan-400" />
                )}
              </button>
            );
          })}
        </div>

        {/* Collapse toggle at bottom for desktop */}
        <div className="p-3 border-t border-slate-800 hidden lg:flex items-center justify-between">
          {!collapsed && (
            <div className="text-[11px] text-slate-500 font-medium">
              ZANDO Pro v1.0
            </div>
          )}
          <button
            onClick={onToggleCollapse}
            className={`p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ${
              collapsed ? 'mx-auto' : ''
            }`}
            title={collapsed ? 'Agrandir le menu' : 'Réduire le menu'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </aside>
    </>
  );
};
