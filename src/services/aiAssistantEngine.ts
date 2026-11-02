import {
  Sale,
  Expense,
  Debt,
  Order,
  Product,
  Customer,
  CurrencyCode,
  AssistantMessage,
} from '../types';
import { formatMoney } from '../utils/formatters';
import {
  computeFinancialSummary,
  filterSalesByPeriod,
  filterExpensesByPeriod,
} from './financialEngine';

export interface AssistantContext {
  sales: Sale[];
  expenses: Expense[];
  debts: Debt[];
  orders: Order[];
  products: Product[];
  customers: Customer[];
  currency: CurrencyCode;
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export function processCommercialQuery(
  rawQuery: string,
  context: AssistantContext
): AssistantMessage {
  const { sales, expenses, debts, orders, products, customers, currency } = context;
  const q = normalize(rawQuery);
  const now = new Date();
  const summary = computeFinancialSummary(sales, expenses, debts, orders, products, customers);

  // 1. Caisse & solde de caisse ("J'ai combien dans la caisse ?", "solde caisse", "especes")
  if (
    q.includes('caisse') ||
    q.includes('combien dans la caisse') ||
    q.includes('solde caisse') ||
    q.includes('espece en caisse') ||
    q.includes('argent liquide')
  ) {
    const todaySales = filterSalesByPeriod(sales, 'today');
    const todayExpenses = filterExpensesByPeriod(expenses, 'today');

    const todayCashIn = todaySales
      .filter((s) => s.paymentMethod === 'ESPECES')
      .reduce((sum, s) => sum + s.amountPaid, 0);

    const todayCashOut = todayExpenses
      .filter((e) => e.paymentMethod === 'ESPECES')
      .reduce((sum, e) => sum + e.amount, 0);

    const todayCashNet = todayCashIn - todayCashOut;

    return {
      id: `msg_${Date.now()}`,
      sender: 'assistant',
      text: `Selon les opérations enregistrées, pour aujourd'hui :\n• Encaissements en espèces : ${formatMoney(todayCashIn, currency)}\n• Dépenses payées en espèces : ${formatMoney(todayCashOut, currency)}\n• Solde net théorique de caisse aujourd'hui : ${formatMoney(todayCashNet, currency)}.\n\nSur l'ensemble de l'activité enregistrée, la caisse espèces théorique totale s'élève à ${formatMoney(summary.cashRegisterTheoretical, currency)} (hors fonds de caisse initial et mouvements non saisis).`,
      timestamp: new Date().toISOString(),
      actionSuggested: {
        label: 'Consulter les ventes du jour',
        tab: 'sales',
      },
      metrics: [
        { label: 'Caisse nette du jour', value: formatMoney(todayCashNet, currency) },
        { label: 'Caisse théorique globale', value: formatMoney(summary.cashRegisterTheoretical, currency) },
      ],
    };
  }

  // 2. Encaissement aujourd'hui ("Combien ai-je encaissé aujourd'hui ?", "recette du jour")
  if (
    q.includes('encaisse') ||
    q.includes('encaissements') ||
    q.includes('recette') ||
    q.includes('recettes aujourdhui')
  ) {
    const isToday = q.includes('aujourd') || (!q.includes('mois') && !q.includes('annee') && !q.includes('total'));
    
    if (isToday) {
      const todaySales = filterSalesByPeriod(sales, 'today');
      const todayCollected = todaySales.reduce((acc, s) => acc + s.amountPaid, 0);
      const todayTurnover = todaySales.reduce((acc, s) => acc + s.total, 0);

      return {
        id: `msg_${Date.now()}`,
        sender: 'assistant',
        text: `Pour la journée d'aujourd'hui (${now.toLocaleDateString('fr-FR')}) :\n• Montant réellement encaissé : ${formatMoney(todayCollected, currency)}\n• Chiffre d'affaires facturé : ${formatMoney(todayTurnover, currency)}\n• Nombre de transactions enregistrées : ${todaySales.length}.\n\nNote : Les ventes avec paiement partiel ne comptabilisent que l'avance réellement perçue.`,
        timestamp: new Date().toISOString(),
        actionSuggested: {
          label: 'Voir les ventes du jour',
          tab: 'sales',
        },
        metrics: [
          { label: 'Encaissé aujourd\'hui', value: formatMoney(todayCollected, currency) },
          { label: 'Facturé aujourd\'hui', value: formatMoney(todayTurnover, currency) },
        ],
      };
    } else {
      return {
        id: `msg_${Date.now()}`,
        sender: 'assistant',
        text: `Sur l'ensemble des opérations enregistrées :\n• Montant total réellement encaissé : ${formatMoney(summary.totalCollected, currency)}\n• Chiffre d'affaires total : ${formatMoney(summary.turnover, currency)}\n• Reste dû par les clients : ${formatMoney(summary.totalOutstandingDebts, currency)}.`,
        timestamp: new Date().toISOString(),
        actionSuggested: {
          label: 'Voir les rapports',
          tab: 'reports',
        },
        metrics: [
          { label: 'Total Encaissé', value: formatMoney(summary.totalCollected, currency) },
        ],
      };
    }
  }

  // 3. Chiffre d'affaires ("Quel est mon chiffre d'affaires ?", "ca total")
  if (
    q.includes('chiffre d\'affaires') ||
    q.includes('chiffre d affaires') ||
    q.includes('mon ca') ||
    q.includes('le ca')
  ) {
    const thisMonthSales = filterSalesByPeriod(sales, 'month');
    const monthTurnover = thisMonthSales.reduce((acc, s) => acc + s.total, 0);

    return {
      id: `msg_${Date.now()}`,
      sender: 'assistant',
      text: `Analyse de votre chiffre d'affaires :\n• Chiffre d'affaires global : ${formatMoney(summary.turnover, currency)} (${sales.length} ventes)\n• Chiffre d'affaires du mois en cours : ${formatMoney(monthTurnover, currency)} (${thisMonthSales.length} ventes).\n\nAttention : le chiffre d'affaires représente le volume facturé, tandis que le montant réellement encaissé à ce jour est de ${formatMoney(summary.totalCollected, currency)}.`,
      timestamp: new Date().toISOString(),
      actionSuggested: {
        label: 'Consulter les statistiques',
        tab: 'reports',
      },
      metrics: [
        { label: 'CA Global', value: formatMoney(summary.turnover, currency) },
        { label: 'CA du mois', value: formatMoney(monthTurnover, currency) },
      ],
    };
  }

  // 4. Dettes clients & créances ("Combien les clients me doivent ?", "dettes", "creances")
  if (
    q.includes('doivent') ||
    q.includes('dette') ||
    q.includes('creance') ||
    q.includes('impaye') ||
    q.includes('reste a encaisser')
  ) {
    const activeDebts = debts.filter((d) => d.status !== 'SOLDEE');
    const totalRemaining = activeDebts.reduce((sum, d) => sum + d.remainingAmount, 0);

    // Find biggest debtor
    const sortedDebts = [...activeDebts].sort((a, b) => b.remainingAmount - a.remainingAmount);
    const topDebtor = sortedDebts[0];

    let debtorText = '';
    if (topDebtor) {
      debtorText = ` Le client ayant la créance la plus élevée est ${topDebtor.customerName} avec ${formatMoney(topDebtor.remainingAmount, currency)} restant dû.`;
    }

    return {
      id: `msg_${Date.now()}`,
      sender: 'assistant',
      text: `Actuellement, vos créances clients enregistrées s'élèvent à ${formatMoney(totalRemaining, currency)}, réparties sur ${activeDebts.length} dossier(s) de dette en cours.${debtorText}\n\nVous pouvez enregistrer un remboursement partiel ou total à tout moment depuis le module Dettes.`,
      timestamp: new Date().toISOString(),
      actionSuggested: {
        label: 'Gérer les dettes',
        tab: 'debts',
      },
      metrics: [
        { label: 'Dettes en cours', value: formatMoney(totalRemaining, currency) },
        { label: 'Dossiers actifs', value: `${activeDebts.length}` },
      ],
    };
  }

  // 5. Quel client me doit le plus d'argent ?
  if (
    q.includes('qui me doit le plus') ||
    q.includes('quel client me doit') ||
    q.includes('plus gros debiteur')
  ) {
    const activeDebts = debts.filter((d) => d.status !== 'SOLDEE');
    if (activeDebts.length === 0) {
      return {
        id: `msg_${Date.now()}`,
        sender: 'assistant',
        text: 'Bonne nouvelle ! Aucun client n\'a de dette non soldée actuellement. Toutes les créances sont réglées.',
        timestamp: new Date().toISOString(),
        actionSuggested: {
          label: 'Voir les clients',
          tab: 'customers',
        },
      };
    }

    const sorted = [...activeDebts].sort((a, b) => b.remainingAmount - a.remainingAmount);
    const top = sorted[0];

    return {
      id: `msg_${Date.now()}`,
      sender: 'assistant',
      text: `Le client qui vous doit le plus d'argent est ${top.customerName} (${top.customerPhone || 'sans tél.'}) avec un solde restant dû de ${formatMoney(top.remainingAmount, currency)} sur un montant initial de ${formatMoney(top.initialAmount, currency)} lié à la vente ${top.saleNumber}.`,
      timestamp: new Date().toISOString(),
      actionSuggested: {
        label: 'Voir la fiche client',
        tab: 'customers',
      },
      metrics: [
        { label: 'Client', value: top.customerName },
        { label: 'Montant dû', value: formatMoney(top.remainingAmount, currency) },
      ],
    };
  }

  // 6. Stocks faibles ou épuisés ("Quels produits sont presque épuisés ?", "rupture", "stock faible")
  if (
    q.includes('epuise') ||
    q.includes('rupture') ||
    q.includes('stock faible') ||
    q.includes('presque fini') ||
    q.includes('manque de stock') ||
    q.includes('reapprovisionner')
  ) {
    const outOfStock = products.filter((p) => p.stockQuantity === 0);
    const lowStock = products.filter((p) => p.stockQuantity > 0 && p.stockQuantity <= p.lowStockThreshold);

    let detail = '';
    if (outOfStock.length > 0) {
      detail += `• Ruptures de stock (0 unité) : ${outOfStock.map((p) => `${p.name} [${p.reference}]`).join(', ')}\n`;
    }
    if (lowStock.length > 0) {
      detail += `• Stocks critiques sous le seuil d'alerte : ${lowStock.map((p) => `${p.name} (reste ${p.stockQuantity} un., seuil ${p.lowStockThreshold})`).join(', ')}`;
    }

    if (outOfStock.length === 0 && lowStock.length === 0) {
      detail = 'Tous vos produits ont un niveau de stock supérieur à leur seuil d\'alerte.';
    }

    return {
      id: `msg_${Date.now()}`,
      sender: 'assistant',
      text: `État des stocks critiques :\n• Ruptures complètes : ${outOfStock.length} produit(s)\n• Stocks sous le seuil d'alerte : ${lowStock.length} produit(s)\n\n${detail}`,
      timestamp: new Date().toISOString(),
      actionSuggested: {
        label: 'Consulter l\'état des stocks',
        tab: 'products',
      },
      metrics: [
        { label: 'Ruptures', value: `${outOfStock.length}` },
        { label: 'Stocks faibles', value: `${lowStock.length}` },
      ],
    };
  }

  // 7. Valeur du stock ("Combien vaut mon stock ?", "valeur stock")
  if (
    q.includes('vaut mon stock') ||
    q.includes('valeur du stock') ||
    q.includes('valeur stock') ||
    q.includes('prix du stock')
  ) {
    const potentialMargin = summary.stockSaleValue - summary.stockCostValue;
    const marginRate = summary.stockSaleValue > 0 ? (potentialMargin / summary.stockSaleValue) * 100 : 0;

    return {
      id: `msg_${Date.now()}`,
      sender: 'assistant',
      text: `Valorisation actuelle de votre inventaire (${products.length} références répertoriées) :\n• Valeur au prix d'achat (capital immobilisé) : ${formatMoney(summary.stockCostValue, currency)}\n• Valeur marchande au prix de vente : ${formatMoney(summary.stockSaleValue, currency)}\n• Marge commerciale potentielle : ${formatMoney(potentialMargin, currency)} (soit environ ${marginRate.toFixed(1)}%).`,
      timestamp: new Date().toISOString(),
      actionSuggested: {
        label: 'Gérer les produits',
        tab: 'products',
      },
      metrics: [
        { label: 'Valeur d\'achat', value: formatMoney(summary.stockCostValue, currency) },
        { label: 'Valeur de vente', value: formatMoney(summary.stockSaleValue, currency) },
      ],
    };
  }

  // 8. Produit le plus vendu ("Quel est mon produit le plus vendu ?", "meilleure vente")
  if (
    q.includes('plus vendu') ||
    q.includes('meilleur produit') ||
    q.includes('top vente') ||
    q.includes('best seller')
  ) {
    const productSalesMap = new Map<string, { name: string; quantity: number; revenue: number }>();
    
    for (const sale of sales) {
      for (const item of sale.items) {
        const existing = productSalesMap.get(item.productId) || { name: item.productName, quantity: 0, revenue: 0 };
        existing.quantity += item.quantity;
        existing.revenue += item.subtotal;
        productSalesMap.set(item.productId, existing);
      }
    }

    const sortedProducts = Array.from(productSalesMap.values()).sort((a, b) => b.quantity - a.quantity);
    const bestSeller = sortedProducts[0];

    if (!bestSeller) {
      return {
        id: `msg_${Date.now()}`,
        sender: 'assistant',
        text: 'Aucune vente n\'a encore été validée pour calculer le produit le plus vendu.',
        timestamp: new Date().toISOString(),
        actionSuggested: {
          label: 'Faire une vente',
          tab: 'sales',
        },
      };
    }

    return {
      id: `msg_${Date.now()}`,
      sender: 'assistant',
      text: `Votre produit numéro 1 des ventes est « ${bestSeller.name} » avec ${bestSeller.quantity} unité(s) vendue(s) générant un total de ${formatMoney(bestSeller.revenue, currency)} de chiffre d'affaires.`,
      timestamp: new Date().toISOString(),
      actionSuggested: {
        label: 'Voir les statistiques des ventes',
        tab: 'reports',
      },
      metrics: [
        { label: 'Top produit', value: bestSeller.name },
        { label: 'Volume vendu', value: `${bestSeller.quantity} unités` },
      ],
    };
  }

  // 9. Dépenses ("Combien ai-je dépensé ce mois-ci ?", "depenses")
  if (
    q.includes('depense') ||
    q.includes('depenses') ||
    q.includes('charges') ||
    q.includes('frais')
  ) {
    const isMonth = q.includes('mois') || (!q.includes('aujourd') && !q.includes('annee') && !q.includes('total'));
    if (isMonth) {
      const monthExpenses = filterExpensesByPeriod(expenses, 'month');
      const totalMonthExp = monthExpenses.reduce((sum, e) => sum + e.amount, 0);

      return {
        id: `msg_${Date.now()}`,
        sender: 'assistant',
        text: `Pour le mois en cours (${now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}) :\n• Total des dépenses enregistrées : ${formatMoney(totalMonthExp, currency)}\n• Nombre de lignes de dépenses : ${monthExpenses.length}.\n\nTotal historique enregistré toutes périodes confondues : ${formatMoney(summary.totalExpenses, currency)}.`,
        timestamp: new Date().toISOString(),
        actionSuggested: {
          label: 'Consulter les dépenses',
          tab: 'expenses',
        },
        metrics: [
          { label: 'Dépenses du mois', value: formatMoney(totalMonthExp, currency) },
        ],
      };
    } else {
      return {
        id: `msg_${Date.now()}`,
        sender: 'assistant',
        text: `Le total cumulé des dépenses enregistrées s'élève à ${formatMoney(summary.totalExpenses, currency)} sur ${expenses.length} opération(s).`,
        timestamp: new Date().toISOString(),
        actionSuggested: {
          label: 'Gérer les dépenses',
          tab: 'expenses',
        },
      };
    }
  }

  // 10. Marge estimée et bénéfice ("Quelle est ma marge estimée ?", "benefice")
  if (
    q.includes('marge') ||
    q.includes('benefice') ||
    q.includes('profit') ||
    q.includes('gain')
  ) {
    return {
      id: `msg_${Date.now()}`,
      sender: 'assistant',
      text: `Calcul de rentabilité basé sur les données réelles enregistrées :\n• Chiffre d'affaires facturé : ${formatMoney(summary.turnover, currency)}\n• Coût d'achat des marchandises vendues : ${formatMoney(summary.costOfGoodsSold, currency)}\n• Marge brute commerciale : ${formatMoney(summary.grossProfit, currency)}\n• Dépenses d'exploitation : ${formatMoney(summary.totalExpenses, currency)}\n• Bénéfice net estimé : ${formatMoney(summary.netEstimatedProfit, currency)}.\n\nCe montant correspond au résultat d'exploitation théorique avant impôts.`,
      timestamp: new Date().toISOString(),
      actionSuggested: {
        label: 'Voir le rapport financier complet',
        tab: 'reports',
      },
      metrics: [
        { label: 'Marge brute', value: formatMoney(summary.grossProfit, currency) },
        { label: 'Bénéfice net estimé', value: formatMoney(summary.netEstimatedProfit, currency) },
      ],
    };
  }

  // 11. Commandes en attente ("Montre-moi les commandes en attente", "commandes")
  if (
    q.includes('commande') ||
    q.includes('commandes en cours') ||
    q.includes('reservations')
  ) {
    const pending = orders.filter((o) => o.status !== 'LIVREE' && o.status !== 'ANNULEE');
    const totalPendingValue = pending.reduce((sum, o) => sum + o.total, 0);
    const advances = pending.reduce((sum, o) => sum + o.advancePaid, 0);

    return {
      id: `msg_${Date.now()}`,
      sender: 'assistant',
      text: `Vous avez actuellement ${pending.length} commande(s) en cours de traitement :\n• Valeur totale des commandes en cours : ${formatMoney(totalPendingValue, currency)}\n• Avances déjà perçues sur ces commandes : ${formatMoney(advances, currency)}\n• Solde à percevoir à la livraison : ${formatMoney(totalPendingValue - advances, currency)}.\n\nRappel : les stocks ne sont décrémentés que lorsque vous livrez et convertissez une commande en vente.`,
      timestamp: new Date().toISOString(),
      actionSuggested: {
        label: 'Ouvrir le module Commandes',
        tab: 'orders',
      },
      metrics: [
        { label: 'Commandes en cours', value: `${pending.length}` },
        { label: 'Valeur en cours', value: formatMoney(totalPendingValue, currency) },
      ],
    };
  }

  // 12. Ventes aujourd'hui ("Quelles sont mes ventes aujourd'hui ?")
  if (
    q.includes('ventes aujourdhui') ||
    q.includes('mes ventes du jour') ||
    q.includes('ventes de ce jour')
  ) {
    const todaySales = filterSalesByPeriod(sales, 'today');
    const total = todaySales.reduce((sum, s) => sum + s.total, 0);
    const collected = todaySales.reduce((sum, s) => sum + s.amountPaid, 0);

    return {
      id: `msg_${Date.now()}`,
      sender: 'assistant',
      text: `Bilan des ventes du jour (${now.toLocaleDateString('fr-FR')}) :\n• Nombre de ventes réalisées : ${todaySales.length}\n• Chiffre d'affaires total : ${formatMoney(total, currency)}\n• Montant effectivement encaissé : ${formatMoney(collected, currency)}${total > collected ? `\n• Reste en créance client : ${formatMoney(total - collected, currency)}` : ''}.`,
      timestamp: new Date().toISOString(),
      actionSuggested: {
        label: 'Voir l\'historique des ventes',
        tab: 'sales',
      },
      metrics: [
        { label: 'Ventes du jour', value: `${todaySales.length}` },
        { label: 'Chiffre du jour', value: formatMoney(total, currency) },
      ],
    };
  }

  // Default fallback guidance
  return {
    id: `msg_${Date.now()}`,
    sender: 'assistant',
    text: `Bonjour ! Je suis l'assistant commercial ZANDO Pro. Je réponds à vos questions en français en calculant les données exactes de votre boutique.\n\nVous pouvez me demander par exemple :\n• « J'ai combien dans la caisse ? »\n• « Combien ai-je encaissé aujourd'hui ? »\n• « Quel est mon chiffre d'affaires ? »\n• « Combien les clients me doivent ? »\n• « Quel client me doit le plus d'argent ? »\n• « Quels produits sont presque épuisés ? »\n• « Quel est mon produit le plus vendu ? »\n• « Combien vaut mon stock ? »\n• « Quelle est ma marge estimée ? »\n• « Montre-moi les commandes en attente. »`,
    timestamp: new Date().toISOString(),
    metrics: [
      { label: 'CA Global', value: formatMoney(summary.turnover, currency) },
      { label: 'Dettes clients', value: formatMoney(summary.totalOutstandingDebts, currency) },
    ],
  };
}
