import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { InvoiceDocument } from './components/documents/InvoiceDocument';
import { ErrorBoundary } from './components/common/ErrorBoundary';

// Modules
import { DashboardView } from './components/modules/DashboardView';
import { ProductsView } from './components/modules/ProductsView';
import { CustomersView } from './components/modules/CustomersView';
import { SalesPosView } from './components/modules/SalesPosView';
import { OrdersView } from './components/modules/OrdersView';
import { DebtsView } from './components/modules/DebtsView';
import { ExpensesView } from './components/modules/ExpensesView';
import { InvoicesView } from './components/modules/InvoicesView';
import { SuppliersView } from './components/modules/SuppliersView';
import { PublicationsView } from './components/modules/PublicationsView';
import { AssistantView } from './components/modules/AssistantView';
import { ReportsView } from './components/modules/ReportsView';
import { UsersPermissionsView } from './components/modules/UsersPermissionsView';
import { SettingsView } from './components/modules/SettingsView';

const MainLayout: React.FC = () => {
  const { activeTab, setActiveTab, currentUser, hasPermission, previewDocument, setPreviewDocument, toast } = useApp();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Auto-redirect if currentUser lacks permission for the active tab
  React.useEffect(() => {
    if (activeTab === 'debts' && !hasPermission('canViewDebts')) {
      setActiveTab('dashboard');
    } else if (activeTab === 'reports' && !hasPermission('canViewStats')) {
      setActiveTab('dashboard');
    } else if (activeTab === 'users' && !hasPermission('canManageUsers')) {
      setActiveTab('dashboard');
    } else if (activeTab === 'settings' && !hasPermission('canAccessSettings')) {
      setActiveTab('dashboard');
    }
  }, [currentUser.role, activeTab, hasPermission, setActiveTab]);

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'products':
        return <ProductsView />;
      case 'customers':
        return <CustomersView />;
      case 'sales':
        return <SalesPosView />;
      case 'orders':
        return <OrdersView />;
      case 'debts':
        return hasPermission('canViewDebts') ? <DebtsView /> : <DashboardView />;
      case 'expenses':
        return <ExpensesView />;
      case 'invoices':
        return <InvoicesView />;
      case 'suppliers':
        return <SuppliersView />;
      case 'posts':
        return <PublicationsView />;
      case 'assistant':
        return <AssistantView />;
      case 'reports':
        return hasPermission('canViewStats') ? <ReportsView /> : <DashboardView />;
      case 'users':
        return hasPermission('canManageUsers') ? <UsersPermissionsView /> : <DashboardView />;
      case 'settings':
        return hasPermission('canAccessSettings') ? <SettingsView /> : <DashboardView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar onToggleSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)} />

      {/* Main Container */}
      <div className="flex-1 flex w-full">
        {/* Sidebar */}
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full transition-all">
          {renderActiveView()}
        </main>
      </div>

      {/* Printable Invoice / Receipt Modal */}
      {previewDocument && (
        <InvoiceDocument
          sale={previewDocument.sale}
          debt={previewDocument.debt}
          defaultMode={previewDocument.defaultMode || 'A4'}
          onClose={() => setPreviewDocument(null)}
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 no-print animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div
            className={`px-4 py-2.5 rounded-xl shadow-lg text-xs font-semibold flex items-center gap-2 border ${
              toast.type === 'error'
                ? 'bg-rose-900 text-white border-rose-800'
                : toast.type === 'info'
                ? 'bg-slate-900 text-white border-slate-800'
                : 'bg-slate-900 text-white border-cyan-500/40'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                toast.type === 'error'
                  ? 'bg-rose-400'
                  : toast.type === 'info'
                  ? 'bg-cyan-400'
                  : 'bg-emerald-400'
              }`}
            />
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <MainLayout />
      </AppProvider>
    </ErrorBoundary>
  );
}
