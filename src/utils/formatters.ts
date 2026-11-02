import { CurrencyCode } from '../types';

export function formatMoney(amount: number, currency: CurrencyCode = 'FCFA'): string {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  
  if (currency === 'FCFA') {
    return `${Math.round(safeAmount).toLocaleString('fr-FR')} FCFA`;
  }
  
  if (currency === 'EUR') {
    return `${safeAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
  }
  
  if (currency === 'USD') {
    return `$${safeAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  
  if (currency === 'CDF') {
    return `${Math.round(safeAmount).toLocaleString('fr-FR')} CDF`;
  }
  
  return `${safeAmount.toLocaleString('fr-FR')} ${currency}`;
}

export function formatDate(dateString: string): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString: string): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

export function generateId(prefix: string = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
}
