export type CurrencyCode = 'FCFA' | 'EUR' | 'USD' | 'CDF';

export type UserRole = 'ADMIN' | 'GESTIONNAIRE' | 'CAISSIER' | 'VENDEUR';

export interface UserPermissions {
  canViewDebts: boolean;
  canDeleteSales: boolean;
  canModifyProducts: boolean;
  canViewStats: boolean;
  canAccessSettings: boolean;
  canRecordExpenses: boolean;
  canManageUsers: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string;
  avatar?: string;
  active: boolean;
}

export interface Product {
  id: string;
  name: string;
  reference: string;
  category: string;
  purchasePrice: number;
  salePrice: number;
  stockQuantity: number;
  lowStockThreshold: number;
  description: string;
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
}

export type StockMovementType = 'ENTREE' | 'SORTIE' | 'AJUSTEMENT' | 'VENTE' | 'COMMANDE_LIVREE';

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: StockMovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  date: string;
  userName: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  email?: string;
  totalPurchases: number;
  totalPaid: number;
  balanceDue: number;
  createdAt: string;
  notes?: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  reference: string;
  unitPrice: number;
  purchasePrice: number;
  quantity: number;
  subtotal: number;
}

export type PaymentMethod = 'ESPECES' | 'MOBILE_MONEY' | 'CARTE' | 'VIREMENT';

export interface Sale {
  id: string;
  saleNumber: string;
  customerId: string | null;
  customerName: string;
  customerPhone?: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  total: number;
  amountPaid: number;
  balanceDue: number;
  changeGiven: number;
  paymentMethod: PaymentMethod;
  status: 'COMPLET' | 'PARTIEL';
  date: string;
  cashierName: string;
  notes?: string;
  orderId?: string;
}

export interface DebtRepayment {
  id: string;
  amount: number;
  date: string;
  paymentMethod: PaymentMethod;
  note?: string;
  cashierName: string;
}

export interface Debt {
  id: string;
  saleId: string;
  saleNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  initialAmount: number;
  paidAmount: number;
  remainingAmount: number;
  createdAt: string;
  dueDate: string;
  status: 'EN_COURS' | 'SOLDEE' | 'EN_RETARD';
  repayments: DebtRepayment[];
}

export type OrderStatus = 'EN_ATTENTE' | 'CONFIRMEE' | 'EN_PREPARATION' | 'PRETE' | 'LIVREE' | 'ANNULEE';

export interface OrderItem {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  total: number;
  advancePaid: number;
  balanceDue: number;
  status: OrderStatus;
  deliveryExpectedDate: string;
  notes?: string;
  createdAt: string;
  convertedSaleId?: string;
}

export interface Expense {
  id: string;
  label: string;
  category: string;
  amount: number;
  date: string;
  paymentMethod: 'ESPECES' | 'MOBILE_MONEY' | 'BANQUE';
  comment?: string;
  receiptUrl?: string;
  author: string;
}

export interface SupplierPurchase {
  id: string;
  date: string;
  amount: number;
  itemsDescription: string;
  paid: number;
  due: number;
}

export interface SupplierRepayment {
  id: string;
  date: string;
  amount: number;
  paymentMethod: PaymentMethod;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  address: string;
  suppliedProducts: string[];
  totalPurchases: number;
  amountPaid: number;
  amountDue: number;
  purchases: SupplierPurchase[];
  repayments: SupplierRepayment[];
}

export interface MarketingPost {
  id: string;
  title: string;
  adText: string;
  productId?: string;
  productPrice?: number;
  mediaUrl: string;
  mediaType: 'IMAGE' | 'VIDEO';
  hashtags: string;
  status: 'BROUILLON' | 'PRET';
  createdAt: string;
}

export interface StoreSettings {
  companyName: string;
  tagline: string;
  logoUrl: string;
  phone: string;
  email: string;
  address: string;
  taxId: string;
  currency: CurrencyCode;
  taxRate: number;
  invoiceFooterNote: string;
  receiptHeaderNote: string;
}

export interface AssistantMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  actionSuggested?: {
    label: string;
    tab: NavigationTab;
  };
  metrics?: {
    label: string;
    value: string;
  }[];
}

export type NavigationTab =
  | 'dashboard'
  | 'products'
  | 'customers'
  | 'sales'
  | 'orders'
  | 'debts'
  | 'expenses'
  | 'invoices'
  | 'suppliers'
  | 'posts'
  | 'assistant'
  | 'reports'
  | 'users'
  | 'settings';

export interface PreviewDocument {
  type: 'invoice' | 'receipt' | 'debtReceipt';
  sale?: Sale;
  debt?: Debt;
  customer?: Customer;
  defaultMode?: 'A4' | 'TICKET';
}
