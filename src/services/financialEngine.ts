import {
  Sale,
  Expense,
  Debt,
  Order,
  Product,
  Customer,
} from '../types';

export interface FinancialSummary {
  turnover: number;              // Chiffre d'affaires total facturé
  totalCollected: number;        // Montant réellement encaissé
  totalOutstandingDebts: number; // Solde restant à encaisser (créances)
  totalExpenses: number;         // Total des dépenses
  costOfGoodsSold: number;       // Coût d'achat des marchandises vendues
  grossProfit: number;           // Marge brute = Chiffre d'affaires - COGS
  netEstimatedProfit: number;    // Bénéfice net estimé = Marge brute - Dépenses
  cashRegisterTheoretical: number; // Solde de caisse espèces = Encaissements espèces - Dépenses espèces
  totalTreasuryBalance: number;  // Trésorerie nette totale = Total encaissé - Total dépenses
  salesCount: number;
  pendingOrdersCount: number;
  customersCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  stockCostValue: number;
  stockSaleValue: number;
}

export function computeFinancialSummary(
  sales: Sale[],
  expenses: Expense[],
  debts: Debt[],
  orders: Order[],
  products: Product[],
  customers: Customer[]
): FinancialSummary {
  // 1. Turnover & Collections
  let turnover = 0;
  let totalCollected = 0;
  let cashCollected = 0;
  let costOfGoodsSold = 0;

  for (const sale of sales) {
    turnover += sale.total;
    totalCollected += sale.amountPaid;

    if (sale.paymentMethod === 'ESPECES') {
      cashCollected += sale.amountPaid;
    }

    // Calculate COGS for this sale
    for (const item of sale.items) {
      costOfGoodsSold += (item.purchasePrice || 0) * item.quantity;
    }
  }

  // Add debt repayments collected
  for (const debt of debts) {
    for (const rep of debt.repayments) {
      totalCollected += rep.amount;
      if (rep.paymentMethod === 'ESPECES') {
        cashCollected += rep.amount;
      }
    }
  }

  // 2. Debts outstanding
  let totalOutstandingDebts = 0;
  for (const debt of debts) {
    if (debt.status !== 'SOLDEE') {
      totalOutstandingDebts += debt.remainingAmount;
    }
  }

  // 3. Expenses
  let totalExpenses = 0;
  let cashExpenses = 0;
  for (const exp of expenses) {
    totalExpenses += exp.amount;
    if (exp.paymentMethod === 'ESPECES') {
      cashExpenses += exp.amount;
    }
  }

  // 4. Margins & Profits
  const grossProfit = turnover - costOfGoodsSold;
  const netEstimatedProfit = grossProfit - totalExpenses;

  // 5. Caisse & Trésorerie
  const cashRegisterTheoretical = cashCollected - cashExpenses;
  const totalTreasuryBalance = totalCollected - totalExpenses;

  // 6. Stocks
  let lowStockCount = 0;
  let outOfStockCount = 0;
  let stockCostValue = 0;
  let stockSaleValue = 0;

  for (const p of products) {
    stockCostValue += p.stockQuantity * p.purchasePrice;
    stockSaleValue += p.stockQuantity * p.salePrice;

    if (p.stockQuantity === 0) {
      outOfStockCount++;
    } else if (p.stockQuantity <= p.lowStockThreshold) {
      lowStockCount++;
    }
  }

  // 7. Orders
  const pendingOrdersCount = orders.filter(
    (o) => o.status !== 'LIVREE' && o.status !== 'ANNULEE'
  ).length;

  return {
    turnover,
    totalCollected,
    totalOutstandingDebts,
    totalExpenses,
    costOfGoodsSold,
    grossProfit,
    netEstimatedProfit,
    cashRegisterTheoretical,
    totalTreasuryBalance,
    salesCount: sales.length,
    pendingOrdersCount,
    customersCount: customers.length,
    lowStockCount,
    outOfStockCount,
    stockCostValue,
    stockSaleValue,
  };
}

// Filter metrics by date interval
export function filterSalesByPeriod(sales: Sale[], period: 'today' | 'week' | 'month' | 'year' | 'all'): Sale[] {
  if (period === 'all') return sales;
  const now = new Date();
  
  return sales.filter((s) => {
    const d = new Date(s.date);
    if (period === 'today') {
      return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate()
      );
    }
    if (period === 'week') {
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
      return d >= oneWeekAgo;
    }
    if (period === 'month') {
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    }
    if (period === 'year') {
      return d.getFullYear() === now.getFullYear();
    }
    return true;
  });
}

export function filterExpensesByPeriod(expenses: Expense[], period: 'today' | 'week' | 'month' | 'year' | 'all'): Expense[] {
  if (period === 'all') return expenses;
  const now = new Date();

  return expenses.filter((e) => {
    const d = new Date(e.date);
    if (period === 'today') {
      return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate()
      );
    }
    if (period === 'week') {
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
      return d >= oneWeekAgo;
    }
    if (period === 'month') {
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    }
    if (period === 'year') {
      return d.getFullYear() === now.getFullYear();
    }
    return true;
  });
}
