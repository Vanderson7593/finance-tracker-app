import { format, formatDistanceToNow, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { pt } from 'date-fns/locale';
import { CURRENCY_SYMBOLS, DEFAULT_CURRENCY } from '../constants';

export function formatCurrency(amount: number, currency = DEFAULT_CURRENCY): string {
  const symbol = CURRENCY_SYMBOLS[currency as keyof typeof CURRENCY_SYMBOLS] ?? currency;
  const formatted = Math.abs(amount).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${symbol} ${formatted}`;
}

export function formatDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), "dd MMM yyyy", { locale: pt });
  } catch {
    return dateStr;
  }
}

export function formatShortDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), "dd/MM", { locale: pt });
  } catch {
    return dateStr;
  }
}

export function formatRelativeDate(dateStr: string): string {
  try {
    return formatDistanceToNow(parseISO(dateStr), { addSuffix: true, locale: pt });
  } catch {
    return dateStr;
  }
}

export function formatMonth(month: number, year: number): string {
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ];
  return `${months[month - 1]} ${year}`;
}

export function formatShortMonth(month: number): string {
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return months[month - 1] ?? '';
}

export function getMonthRange(month: number, year: number) {
  const date = new Date(year, month - 1, 1);
  return {
    start: startOfMonth(date),
    end: endOfMonth(date),
  };
}

export function getCurrentMonth() {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

export function toISODateString(date: Date): string {
  return date.toISOString();
}

export function formatAmountInput(input: string): string {
  if (!input) return '';
  const cleaned = input.replace(/[^\d,]/g, '');
  const firstComma = cleaned.indexOf(',');
  let intPart: string;
  let decPart: string | undefined;
  if (firstComma === -1) {
    intPart = cleaned;
  } else {
    intPart = cleaned.slice(0, firstComma);
    decPart = cleaned.slice(firstComma + 1).replace(/,/g, '').slice(0, 2);
  }
  if (decPart !== undefined && intPart === '') intPart = '0';
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return decPart !== undefined ? `${formattedInt},${decPart}` : formattedInt;
}

export function parseAmountInput(formatted: string): number {
  if (!formatted) return 0;
  const normalized = formatted.replace(/\./g, '').replace(',', '.');
  const n = parseFloat(normalized);
  return isNaN(n) ? 0 : n;
}
