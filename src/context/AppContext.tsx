import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  Product,
  Customer,
  Sale,
  Debt,
  Order,
  OrderStatus,
  Expense,
  Supplier,
  MarketingPost,
  StockMovement,
  StoreSettings,
  User,
  UserRole,
  UserPermissions,
  PaymentMethod,
  NavigationTab,
  SaleItem,
  PreviewDocument,
} from '../types';
import {
  INITIAL_PRODUCTS,
  INITIAL_CUSTOMERS,
  INITIAL_SALES,
  INITIAL_DEBTS,
  INITIAL_ORDERS,
  INITIAL_EXPENSES,
  INITIAL_SUPPLIERS,
  INITIAL_POSTS,
  INITIAL_MOVEMENTS,
  INITIAL_SETTINGS,
  INITIAL_USERS,
} from './seedData';
import { generateId } from '../utils/formatters';
import { getValidImageUrl, defaultLogoUrl } from '../utils/assets';

const STORAGE_KEY = 'zando_pro_store_v1';

export const ROLE_PERMISSIONS: Record<UserRole, UserPermissions> = {
  ADMIN: {
    canViewDebts: true,
    canDeleteSales: true,
    canModifyProducts: true,
    canViewStats: true,
    canAccessSettings: true,
    canRecordExpenses: true,
    canManageUsers: true,
  },
  GESTIONNAIRE: {
    canViewDebts: true,
    canDeleteSales: false,
    canModifyProducts: true,
    canViewStats: true,
    canAccessSettings: false,
    canRecordExpenses: true,
    canManageUsers: false,
  },
  CAISSIER: {
    canViewDebts: true,
    canDeleteSales: false,
    canModifyProducts: false,
    canViewStats: false,
    canAccessSettings: false,
    canRecordExpenses: true,
    canManageUsers: false,
  },
  VENDEUR: {
    canViewDebts: false,
    canDeleteSales: false,
    canModifyProducts: false,
    canViewStats: false,
    canAccessSettings: false,
    canRecordExpenses: false,
    canManageUsers: false,
  },
};

interface AppContextType {
  products: Product[];
  customers: Customer[];
  sales: Sale[];
  debts: Debt[];
  orders: Order[];
  expenses: Expense[];
  suppliers: Supplier[];
  marketingPosts: MarketingPost[];
  stockMovements: StockMovement[];
  settings: StoreSettings;
  users: User[];
  currentUser: User;
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  saveIndicator: boolean;
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;

  // Actions
  hasPermission: (permission: keyof UserPermissions) => boolean;
  switchUser: (userId: string) => void;
  updateUserRole: (userId: string, role: UserRole) => void;

  // Product & Stock
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Product;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => boolean;
  adjustStock: (productId: string, quantityDelta: number, reason: string) => void;

  // Customers
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'totalPurchases' | 'totalPaid' | 'balanceDue'>) => Customer;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  deleteCustomer: (id: string) => boolean;

  // Sales & POS
  createSale: (saleData: {
    customerId: string | null;
    customerName: string;
    customerPhone?: string;
    items: SaleItem[];
    subtotal: number;
    discount: number;
    total: number;
    amountPaid: number;
    paymentMethod: PaymentMethod;
    notes?: string;
    orderId?: string;
  }) => Sale;
  deleteSale: (saleId: string) => boolean;

  // Debts
  recordDebtRepayment: (debtId: string, amount: number, paymentMethod: PaymentMethod, note?: string) => void;

  // Orders
  createOrder: (orderData: {
    customerId: string;
    customerName: string;
    customerPhone: string;
    items: { productId: string; productName: string; unitPrice: number; quantity: number; subtotal: number }[];
    total: number;
    advancePaid: number;
    deliveryExpectedDate: string;
    notes?: string;
  }) => Order;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  convertOrderToSale: (orderId: string, paymentMethod: PaymentMethod, additionalPaid?: number) => Sale | null;
  deleteOrder: (orderId: string) => boolean;

  // Expenses
  addExpense: (expense: Omit<Expense, 'id' | 'author'>) => Expense;
  deleteExpense: (id: string) => boolean;

  // Suppliers
  addSupplier: (supplier: Omit<Supplier, 'id' | 'totalPurchases' | 'amountPaid' | 'amountDue' | 'purchases' | 'repayments'>) => Supplier;
  addSupplierPurchase: (supplierId: string, amount: number, itemsDesc: string, paidAmount: number, paymentMethod: PaymentMethod) => void;
  addSupplierRepayment: (supplierId: string, amount: number, paymentMethod: PaymentMethod) => void;

  // Marketing Posts
  addMarketingPost: (post: Omit<MarketingPost, 'id' | 'createdAt'>) => MarketingPost;
  updateMarketingPost: (id: string, updates: Partial<MarketingPost>) => void;
  deleteMarketingPost: (id: string) => boolean;

  // Settings & Backups
  updateSettings: (updates: Partial<StoreSettings>) => void;
  exportDataJson: () => string;
  importDataJson: (jsonString: string) => boolean;
  resetToInitialData: () => void;

  // Document preview helper
  previewDocument: PreviewDocument | null;
  setPreviewDocument: (doc: PreviewDocument | null) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Load state from local storage or use initial seed
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_products`);
      if (saved) {
        const parsed: Product[] = JSON.parse(saved);
        return parsed.map((p) => ({
          ...p,
          imageUrl: getValidImageUrl(p.imageUrl, ''),
        }));
      }
      return INITIAL_PRODUCTS;
    } catch {
      return INITIAL_PRODUCTS;
    }
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_customers`);
      return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
    } catch {
      return INITIAL_CUSTOMERS;
    }
  });

  const [sales, setSales] = useState<Sale[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_sales`);
      return saved ? JSON.parse(saved) : INITIAL_SALES;
    } catch {
      return INITIAL_SALES;
    }
  });

  const [debts, setDebts] = useState<Debt[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_debts`);
      return saved ? JSON.parse(saved) : INITIAL_DEBTS;
    } catch {
      return INITIAL_DEBTS;
    }
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_orders`);
      return saved ? JSON.parse(saved) : INITIAL_ORDERS;
    } catch {
      return INITIAL_ORDERS;
    }
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_expenses`);
      return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
    } catch {
      return INITIAL_EXPENSES;
    }
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_suppliers`);
      return saved ? JSON.parse(saved) : INITIAL_SUPPLIERS;
    } catch {
      return INITIAL_SUPPLIERS;
    }
  });

  const [marketingPosts, setMarketingPosts] = useState<MarketingPost[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_posts`);
      if (saved) {
        const parsed: MarketingPost[] = JSON.parse(saved);
        return parsed.map((p) => ({
          ...p,
          mediaUrl: p.mediaUrl ? getValidImageUrl(p.mediaUrl, '') : '',
        }));
      }
      return INITIAL_POSTS;
    } catch {
      return INITIAL_POSTS;
    }
  });

  const [stockMovements, setStockMovements] = useState<StockMovement[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_movements`);
      return saved ? JSON.parse(saved) : INITIAL_MOVEMENTS;
    } catch {
      return INITIAL_MOVEMENTS;
    }
  });

  const [settings, setSettings] = useState<StoreSettings>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_settings`);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...INITIAL_SETTINGS,
          ...parsed,
          logoUrl: getValidImageUrl(parsed.logoUrl, defaultLogoUrl),
        };
      }
      return INITIAL_SETTINGS;
    } catch {
      return INITIAL_SETTINGS;
    }
  });

  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_users`);
      return saved ? JSON.parse(saved) : INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  });

  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_current_user_id`);
      return saved || 'usr_admin';
    } catch {
      return 'usr_admin';
    }
  });

  const [activeTab, setActiveTab] = useState<NavigationTab>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_active_tab`);
      return (saved as NavigationTab) || 'dashboard';
    } catch {
      return 'dashboard';
    }
  });

  const [saveIndicator, setSaveIndicator] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [previewDocument, setPreviewDocument] = useState<PreviewDocument | null>(null);

  const currentUser = useMemo(() => {
    if (!users || users.length === 0) {
      return INITIAL_USERS[0];
    }
    return users.find((u) => u.id === currentUserId) || users[0] || INITIAL_USERS[0];
  }, [users, currentUserId]);

  const triggerSaveFeedback = () => {
    setSaveIndicator(true);
    setTimeout(() => setSaveIndicator(false), 1200);
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 3500);
  };

  // Auto-persist to localStorage on state changes
  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_products`, JSON.stringify(products));
      localStorage.setItem(`${STORAGE_KEY}_customers`, JSON.stringify(customers));
      localStorage.setItem(`${STORAGE_KEY}_sales`, JSON.stringify(sales));
      localStorage.setItem(`${STORAGE_KEY}_debts`, JSON.stringify(debts));
      localStorage.setItem(`${STORAGE_KEY}_orders`, JSON.stringify(orders));
      localStorage.setItem(`${STORAGE_KEY}_expenses`, JSON.stringify(expenses));
      localStorage.setItem(`${STORAGE_KEY}_suppliers`, JSON.stringify(suppliers));
      localStorage.setItem(`${STORAGE_KEY}_posts`, JSON.stringify(marketingPosts));
      localStorage.setItem(`${STORAGE_KEY}_movements`, JSON.stringify(stockMovements));
      localStorage.setItem(`${STORAGE_KEY}_settings`, JSON.stringify(settings));
      localStorage.setItem(`${STORAGE_KEY}_users`, JSON.stringify(users));
      localStorage.setItem(`${STORAGE_KEY}_current_user_id`, currentUserId);
      localStorage.setItem(`${STORAGE_KEY}_active_tab`, activeTab);
      triggerSaveFeedback();
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }, [
    products,
    customers,
    sales,
    debts,
    orders,
    expenses,
    suppliers,
    marketingPosts,
    stockMovements,
    settings,
    users,
    currentUserId,
    activeTab,
  ]);

  const hasPermission = (permission: keyof UserPermissions): boolean => {
    const role = currentUser?.role || 'ADMIN';
    const perms = ROLE_PERMISSIONS[role];
    return perms ? perms[permission] : false;
  };

  const switchUser = (userId: string) => {
    const found = users.find((u) => u.id === userId);
    if (found) {
      setCurrentUserId(found.id);
      showToast(`Connecté en tant que ${found.name} (${found.role})`, 'info');
    }
  };

  const updateUserRole = (userId: string, role: UserRole) => {
    if (!hasPermission('canManageUsers')) {
      showToast('Action non autorisée pour votre profil utilisateur.', 'error');
      return;
    }
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
    showToast('Rôle utilisateur mis à jour.', 'success');
  };

  // --- PRODUCTS ---
  const addProduct = (pData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product => {
    if (!hasPermission('canModifyProducts')) {
      showToast('Permission insuffisante pour créer un produit.', 'error');
      throw new Error('Permission denied');
    }
    const newProduct: Product = {
      ...pData,
      id: generateId('prd'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setProducts((prev) => [newProduct, ...prev]);

    if (newProduct.stockQuantity > 0) {
      const movement: StockMovement = {
        id: generateId('mvt'),
        productId: newProduct.id,
        productName: newProduct.name,
        type: 'ENTREE',
        quantity: newProduct.stockQuantity,
        previousStock: 0,
        newStock: newProduct.stockQuantity,
        reason: 'Stock initial à la création du produit',
        date: new Date().toISOString(),
        userName: currentUser.name,
      };
      setStockMovements((prev) => [movement, ...prev]);
    }

    showToast(`Produit "${newProduct.name}" créé avec succès.`, 'success');
    return newProduct;
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    if (!hasPermission('canModifyProducts')) {
      showToast('Permission insuffisante pour modifier un produit.', 'error');
      return;
    }
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p))
    );
    showToast('Produit mis à jour.', 'success');
  };

  const deleteProduct = (id: string): boolean => {
    if (!hasPermission('canModifyProducts')) {
      showToast('Permission insuffisante pour supprimer un produit.', 'error');
      return false;
    }
    setProducts((prev) => prev.filter((p) => p.id !== id));
    showToast('Produit supprimé du catalogue.', 'info');
    return true;
  };

  const adjustStock = (productId: string, quantityDelta: number, reason: string) => {
    if (!hasPermission('canModifyProducts')) {
      showToast('Permission insuffisante pour ajuster le stock.', 'error');
      return;
    }
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    const previousStock = prod.stockQuantity;
    const newStock = Math.max(0, previousStock + quantityDelta);

    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, stockQuantity: newStock, updatedAt: new Date().toISOString() } : p))
    );

    const movement: StockMovement = {
      id: generateId('mvt'),
      productId: prod.id,
      productName: prod.name,
      type: quantityDelta >= 0 ? 'ENTREE' : 'SORTIE',
      quantity: Math.abs(quantityDelta),
      previousStock,
      newStock,
      reason: reason || (quantityDelta >= 0 ? 'Entrée manuelle de stock' : 'Sortie manuelle de stock'),
      date: new Date().toISOString(),
      userName: currentUser.name,
    };
    setStockMovements((prev) => [movement, ...prev]);
    showToast(`Stock ajusté pour ${prod.name} (Nouveau stock : ${newStock})`, 'success');
  };

  // --- CUSTOMERS ---
  const addCustomer = (cData: Omit<Customer, 'id' | 'createdAt' | 'totalPurchases' | 'totalPaid' | 'balanceDue'>): Customer => {
    const newCustomer: Customer = {
      ...cData,
      id: generateId('cst'),
      totalPurchases: 0,
      totalPaid: 0,
      balanceDue: 0,
      createdAt: new Date().toISOString(),
    };
    setCustomers((prev) => [newCustomer, ...prev]);
    showToast(`Client "${newCustomer.name}" enregistré.`, 'success');
    return newCustomer;
  };

  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
    showToast('Fiche client mise à jour.', 'success');
  };

  const deleteCustomer = (id: string): boolean => {
    // Check if customer has outstanding debt
    const customerDebts = debts.filter((d) => d.customerId === id && d.status !== 'SOLDEE');
    if (customerDebts.length > 0) {
      showToast('Impossible de supprimer un client ayant une dette en cours.', 'error');
      return false;
    }
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    showToast('Client supprimé.', 'info');
    return true;
  };

  // --- SALES & POS ---
  const createSale = (saleData: {
    customerId: string | null;
    customerName: string;
    customerPhone?: string;
    items: SaleItem[];
    subtotal: number;
    discount: number;
    total: number;
    amountPaid: number;
    paymentMethod: PaymentMethod;
    notes?: string;
    orderId?: string;
  }): Sale => {
    const saleCount = sales.length + 1;
    const saleNumber = `VNT-${new Date().getFullYear()}-${String(saleCount).padStart(4, '0')}`;

    const isPartial = saleData.amountPaid < saleData.total;
    const balanceDue = isPartial ? saleData.total - saleData.amountPaid : 0;
    const changeGiven = saleData.amountPaid > saleData.total ? saleData.amountPaid - saleData.total : 0;

    const newSale: Sale = {
      id: generateId('sl'),
      saleNumber,
      customerId: saleData.customerId,
      customerName: saleData.customerName,
      customerPhone: saleData.customerPhone,
      items: saleData.items,
      subtotal: saleData.subtotal,
      discount: saleData.discount,
      total: saleData.total,
      amountPaid: isPartial ? saleData.amountPaid : saleData.total,
      balanceDue,
      changeGiven,
      paymentMethod: saleData.paymentMethod,
      status: isPartial ? 'PARTIEL' : 'COMPLET',
      date: new Date().toISOString(),
      cashierName: currentUser.name,
      notes: saleData.notes,
      orderId: saleData.orderId,
    };

    // 1. DEDUCT STOCK ONLY ONCE SALE IS VALIDATED (without nested state updater side-effects)
    const newMovements: StockMovement[] = [];
    setProducts((prevProducts) => {
      const updated = [...prevProducts];
      for (const item of saleData.items) {
        const pIndex = updated.findIndex((p) => p.id === item.productId);
        if (pIndex !== -1) {
          const currentStock = updated[pIndex].stockQuantity;
          const nextStock = Math.max(0, currentStock - item.quantity);
          updated[pIndex] = {
            ...updated[pIndex],
            stockQuantity: nextStock,
            updatedAt: new Date().toISOString(),
          };

          newMovements.push({
            id: generateId('mvt'),
            productId: item.productId,
            productName: item.productName,
            type: 'VENTE',
            quantity: item.quantity,
            previousStock: currentStock,
            newStock: nextStock,
            reason: `Vente ${saleNumber}`,
            date: new Date().toISOString(),
            userName: currentUser.name,
          });
        }
      }
      return updated;
    });

    if (newMovements.length > 0) {
      setStockMovements((mPrev) => [...newMovements, ...mPrev]);
    }

    // 2. IF PARTIAL PAYMENT -> CREATE DEBT
    if (isPartial) {
      const newDebt: Debt = {
        id: generateId('dbt'),
        saleId: newSale.id,
        saleNumber,
        customerId: saleData.customerId || 'cst_unknown',
        customerName: saleData.customerName,
        customerPhone: saleData.customerPhone || '',
        initialAmount: balanceDue,
        paidAmount: 0,
        remainingAmount: balanceDue,
        createdAt: new Date().toISOString(),
        dueDate: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(), // 7 days default
        status: 'EN_COURS',
        repayments: [],
      };
      setDebts((prev) => [newDebt, ...prev]);
    }

    // 3. UPDATE CUSTOMER STATS IF REGISTERED
    if (saleData.customerId) {
      setCustomers((prev) =>
        prev.map((c) => {
          if (c.id === saleData.customerId) {
            return {
              ...c,
              totalPurchases: c.totalPurchases + saleData.total,
              totalPaid: c.totalPaid + (isPartial ? saleData.amountPaid : saleData.total),
              balanceDue: c.balanceDue + balanceDue,
            };
          }
          return c;
        })
      );
    }

    setSales((prev) => [newSale, ...prev]);
    showToast(
      isPartial
        ? `Vente ${saleNumber} enregistrée avec avance. Dette client de ${balanceDue} FCFA enregistrée.`
        : `Vente ${saleNumber} validée avec succès !`,
      'success'
    );

    return newSale;
  };

  const deleteSale = (saleId: string): boolean => {
    if (!hasPermission('canDeleteSales')) {
      showToast('Suppression de vente réservée aux Administrateurs.', 'error');
      return false;
    }
    const sale = sales.find((s) => s.id === saleId);
    if (!sale) return false;

    // Restore stock
    for (const item of sale.items) {
      const prod = products.find((p) => p.id === item.productId);
      if (prod) {
        adjustStock(item.productId, item.quantity, `Annulation vente ${sale.saleNumber}`);
      }
    }

    // Restore customer balance and stats if registered
    if (sale.customerId) {
      setCustomers((prev) =>
        prev.map((c) => {
          if (c.id === sale.customerId) {
            return {
              ...c,
              totalPurchases: Math.max(0, c.totalPurchases - sale.total),
              totalPaid: Math.max(0, c.totalPaid - sale.amountPaid),
              balanceDue: Math.max(0, c.balanceDue - sale.balanceDue),
            };
          }
          return c;
        })
      );
    }

    // Remove any debt linked
    setDebts((prev) => prev.filter((d) => d.saleId !== saleId));
    setSales((prev) => prev.filter((s) => s.id !== saleId));
    showToast(`Vente ${sale.saleNumber} annulée, stock réintégré et compte client ajusté.`, 'info');
    return true;
  };

  // --- DEBTS ---
  const recordDebtRepayment = (debtId: string, amount: number, paymentMethod: PaymentMethod, note?: string) => {
    if (!hasPermission('canViewDebts')) {
      showToast('Permission insuffisante pour enregistrer un règlement.', 'error');
      return;
    }
    const debt = debts.find((d) => d.id === debtId);
    if (!debt) return;

    if (amount <= 0 || amount > debt.remainingAmount) {
      showToast('Montant de remboursement invalide.', 'error');
      return;
    }

    const nextPaid = debt.paidAmount + amount;
    const nextRemaining = debt.remainingAmount - amount;
    const nextStatus = nextRemaining <= 0 ? 'SOLDEE' : 'EN_COURS';

    const repayment = {
      id: generateId('rep'),
      amount,
      date: new Date().toISOString(),
      paymentMethod,
      note,
      cashierName: currentUser.name,
    };

    setDebts((prev) =>
      prev.map((d) =>
        d.id === debtId
          ? {
              ...d,
              paidAmount: nextPaid,
              remainingAmount: nextRemaining,
              status: nextStatus,
              repayments: [repayment, ...d.repayments],
            }
          : d
      )
    );

    // Update customer balance
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === debt.customerId || c.name === debt.customerName) {
          return {
            ...c,
            totalPaid: c.totalPaid + amount,
            balanceDue: Math.max(0, c.balanceDue - amount),
          };
        }
        return c;
      })
    );

    showToast(
      nextStatus === 'SOLDEE'
        ? `Règlement de ${amount} enregistré. La dette est entièrement SOLDÉE !`
        : `Règlement de ${amount} enregistré. Reste dû : ${nextRemaining} FCFA.`,
      'success'
    );
  };

  // --- ORDERS ---
  const createOrder = (orderData: {
    customerId: string;
    customerName: string;
    customerPhone: string;
    items: { productId: string; productName: string; unitPrice: number; quantity: number; subtotal: number }[];
    total: number;
    advancePaid: number;
    deliveryExpectedDate: string;
    notes?: string;
  }): Order => {
    const orderCount = orders.length + 1;
    const orderNumber = `CMD-${new Date().getFullYear()}-${String(orderCount).padStart(4, '0')}`;

    const newOrder: Order = {
      id: generateId('ord'),
      orderNumber,
      customerId: orderData.customerId,
      customerName: orderData.customerName,
      customerPhone: orderData.customerPhone,
      items: orderData.items,
      total: orderData.total,
      advancePaid: orderData.advancePaid,
      balanceDue: Math.max(0, orderData.total - orderData.advancePaid),
      status: 'EN_ATTENTE',
      deliveryExpectedDate: orderData.deliveryExpectedDate,
      notes: orderData.notes,
      createdAt: new Date().toISOString(),
    };

    // NOTE: Orders DO NOT decrease stock at creation time!
    setOrders((prev) => [newOrder, ...prev]);
    showToast(`Commande ${orderNumber} enregistrée (le stock reste intact).`, 'success');
    return newOrder;
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
    showToast(`Statut de la commande mis à jour : ${status}`, 'info');
  };

  const convertOrderToSale = (orderId: string, paymentMethod: PaymentMethod, additionalPaid?: number): Sale | null => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return null;

    if (order.status === 'LIVREE' && order.convertedSaleId) {
      showToast('Cette commande a déjà été livrée et convertie en vente.', 'error');
      return null;
    }

    // Check stock availability
    for (const item of order.items) {
      const prod = products.find((p) => p.id === item.productId);
      if (prod && prod.stockQuantity < item.quantity) {
        showToast(
          `Stock insuffisant pour "${prod.name}" (Disponible: ${prod.stockQuantity}, Requis: ${item.quantity}). Ajustez le stock d'abord.`,
          'error'
        );
        return null;
      }
    }

    const saleItems: SaleItem[] = order.items.map((item) => {
      const prod = products.find((p) => p.id === item.productId);
      return {
        productId: item.productId,
        productName: item.productName,
        reference: prod?.reference || 'REF-CMD',
        unitPrice: item.unitPrice,
        purchasePrice: prod?.purchasePrice || 0,
        quantity: item.quantity,
        subtotal: item.subtotal,
      };
    });

    const totalPaidOnDelivery = (order.advancePaid || 0) + (additionalPaid !== undefined ? additionalPaid : order.balanceDue);

    // Create Sale
    const sale = createSale({
      customerId: order.customerId,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      items: saleItems,
      subtotal: order.total,
      discount: 0,
      total: order.total,
      amountPaid: totalPaidOnDelivery,
      paymentMethod,
      notes: `Converti depuis la commande ${order.orderNumber}. Avance initiale : ${order.advancePaid} FCFA.`,
      orderId: order.id,
    });

    // Mark order as LIVREE with convertedSaleId
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'LIVREE', convertedSaleId: sale.id } : o))
    );

    showToast(`Commande ${order.orderNumber} convertie en vente ${sale.saleNumber} avec succès !`, 'success');
    return sale;
  };

  const deleteOrder = (orderId: string): boolean => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return false;
    if (order.status === 'LIVREE') {
      showToast('Impossible de supprimer une commande déjà livrée.', 'error');
      return false;
    }
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
    showToast(`Commande ${order.orderNumber} supprimée.`, 'info');
    return true;
  };

  // --- EXPENSES ---
  const addExpense = (eData: Omit<Expense, 'id' | 'author'>): Expense => {
    if (!hasPermission('canRecordExpenses')) {
      showToast('Permission insuffisante pour enregistrer une dépense.', 'error');
      throw new Error('Permission denied');
    }
    const newExpense: Expense = {
      ...eData,
      id: generateId('exp'),
      author: currentUser.name,
    };
    setExpenses((prev) => [newExpense, ...prev]);
    showToast(`Dépense de ${newExpense.amount} FCFA enregistrée.`, 'success');
    return newExpense;
  };

  const deleteExpense = (id: string): boolean => {
    if (!hasPermission('canRecordExpenses')) {
      showToast('Permission insuffisante.', 'error');
      return false;
    }
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    showToast('Dépense supprimée.', 'info');
    return true;
  };

  // --- SUPPLIERS ---
  const addSupplier = (sData: Omit<Supplier, 'id' | 'totalPurchases' | 'amountPaid' | 'amountDue' | 'purchases' | 'repayments'>): Supplier => {
    const newSupplier: Supplier = {
      ...sData,
      id: generateId('sup'),
      totalPurchases: 0,
      amountPaid: 0,
      amountDue: 0,
      purchases: [],
      repayments: [],
    };
    setSuppliers((prev) => [newSupplier, ...prev]);
    showToast(`Fournisseur "${newSupplier.name}" ajouté.`, 'success');
    return newSupplier;
  };

  const addSupplierPurchase = (
    supplierId: string,
    amount: number,
    itemsDesc: string,
    paidAmount: number,
    paymentMethod: PaymentMethod
  ) => {
    const due = Math.max(0, amount - paidAmount);
    const purchase = {
      id: generateId('sp'),
      date: new Date().toISOString().split('T')[0],
      amount,
      itemsDescription: itemsDesc,
      paid: paidAmount,
      due,
    };

    setSuppliers((prev) =>
      prev.map((s) => {
        if (s.id === supplierId) {
          return {
            ...s,
            totalPurchases: s.totalPurchases + amount,
            amountPaid: s.amountPaid + paidAmount,
            amountDue: s.amountDue + due,
            purchases: [purchase, ...s.purchases],
          };
        }
        return s;
      })
    );
    showToast('Achat fournisseur enregistré.', 'success');
  };

  const addSupplierRepayment = (supplierId: string, amount: number, paymentMethod: PaymentMethod) => {
    const repayment = {
      id: generateId('sr'),
      date: new Date().toISOString().split('T')[0],
      amount,
      paymentMethod,
    };

    setSuppliers((prev) =>
      prev.map((s) => {
        if (s.id === supplierId) {
          return {
            ...s,
            amountPaid: s.amountPaid + amount,
            amountDue: Math.max(0, s.amountDue - amount),
            repayments: [repayment, ...s.repayments],
          };
        }
        return s;
      })
    );
    showToast(`Règlement fournisseur de ${amount} FCFA enregistré.`, 'success');
  };

  // --- MARKETING POSTS ---
  const addMarketingPost = (pData: Omit<MarketingPost, 'id' | 'createdAt'>): MarketingPost => {
    const newPost: MarketingPost = {
      ...pData,
      id: generateId('pst'),
      createdAt: new Date().toISOString(),
    };
    setMarketingPosts((prev) => [newPost, ...prev]);
    showToast('Publication commerciale enregistrée.', 'success');
    return newPost;
  };

  const updateMarketingPost = (id: string, updates: Partial<MarketingPost>) => {
    setMarketingPosts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    showToast('Publication mise à jour.', 'success');
  };

  const deleteMarketingPost = (id: string): boolean => {
    setMarketingPosts((prev) => prev.filter((p) => p.id !== id));
    showToast('Publication supprimée.', 'info');
    return true;
  };

  // --- SETTINGS & BACKUPS ---
  const updateSettings = (updates: Partial<StoreSettings>) => {
    const isSensitive =
      updates.companyName !== undefined ||
      updates.taxId !== undefined ||
      updates.address !== undefined ||
      updates.invoiceFooterNote !== undefined ||
      updates.logoUrl !== undefined;

    if (isSensitive && !hasPermission('canAccessSettings')) {
      showToast('Permission insuffisante pour modifier les paramètres.', 'error');
      return;
    }
    setSettings((prev) => ({ ...prev, ...updates }));
    showToast('Paramètres de la boutique mis à jour.', 'success');
  };

  const exportDataJson = (): string => {
    const bundle = {
      exportedAt: new Date().toISOString(),
      app: 'ZANDO Pro',
      version: '1.0',
      data: {
        products,
        customers,
        sales,
        debts,
        orders,
        expenses,
        suppliers,
        marketingPosts,
        stockMovements,
        settings,
        users,
      },
    };
    return JSON.stringify(bundle, null, 2);
  };

  const importDataJson = (jsonString: string): boolean => {
    try {
      const bundle = JSON.parse(jsonString);
      if (!bundle.data) throw new Error('Structure invalide');
      const { data } = bundle;
      if (data.products) setProducts(data.products);
      if (data.customers) setCustomers(data.customers);
      if (data.sales) setSales(data.sales);
      if (data.debts) setDebts(data.debts);
      if (data.orders) setOrders(data.orders);
      if (data.expenses) setExpenses(data.expenses);
      if (data.suppliers) setSuppliers(data.suppliers);
      if (data.marketingPosts) setMarketingPosts(data.marketingPosts);
      if (data.stockMovements) setStockMovements(data.stockMovements);
      if (data.settings) {
        setSettings({
          ...INITIAL_SETTINGS,
          ...data.settings,
          logoUrl: getValidImageUrl(data.settings.logoUrl, defaultLogoUrl),
        });
      }
      if (data.users && Array.isArray(data.users) && data.users.length > 0) setUsers(data.users);
      showToast('Sauvegarde restaurée avec succès !', 'success');
      return true;
    } catch {
      showToast('Échec de la restauration : fichier JSON corrompu ou invalide.', 'error');
      return false;
    }
  };

  const resetToInitialData = () => {
    setProducts(INITIAL_PRODUCTS);
    setCustomers(INITIAL_CUSTOMERS);
    setSales(INITIAL_SALES);
    setDebts(INITIAL_DEBTS);
    setOrders(INITIAL_ORDERS);
    setExpenses(INITIAL_EXPENSES);
    setSuppliers(INITIAL_SUPPLIERS);
    setMarketingPosts(INITIAL_POSTS);
    setStockMovements(INITIAL_MOVEMENTS);
    setSettings(INITIAL_SETTINGS);
    setUsers(INITIAL_USERS);
    setCurrentUserId('usr_admin');
    setActiveTab('dashboard');
    showToast('Données réinitialisées aux valeurs par défaut de démonstration.', 'info');
  };

  return (
    <AppContext.Provider
      value={{
        products,
        customers,
        sales,
        debts,
        orders,
        expenses,
        suppliers,
        marketingPosts,
        stockMovements,
        settings,
        users,
        currentUser,
        activeTab,
        setActiveTab,
        saveIndicator,
        toast,
        showToast,

        hasPermission,
        switchUser,
        updateUserRole,

        addProduct,
        updateProduct,
        deleteProduct,
        adjustStock,

        addCustomer,
        updateCustomer,
        deleteCustomer,

        createSale,
        deleteSale,

        recordDebtRepayment,

        createOrder,
        updateOrderStatus,
        convertOrderToSale,
        deleteOrder,

        addExpense,
        deleteExpense,

        addSupplier,
        addSupplierPurchase,
        addSupplierRepayment,

        addMarketingPost,
        updateMarketingPost,
        deleteMarketingPost,

        updateSettings,
        exportDataJson,
        importDataJson,
        resetToInitialData,

        previewDocument,
        setPreviewDocument,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp(): AppContextType {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
