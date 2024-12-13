import { format, parseISO } from 'date-fns';

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-';
  try {
    const parsedDate = typeof date === 'string' ? parseISO(date) : date;
    return format(parsedDate, 'dd.MM.yyyy');
  } catch (error) {
    console.error('Error formatting date:', error);
    return '-';
  }
}

export function formatMoney(amount: number | null | undefined): string {
  if (amount == null) return '-';
  try {
    return `${amount.toLocaleString('ru-RU')} сум`;
  } catch (error) {
    console.error('Error formatting money:', error);
    return '-';
  }
}

export function numberToWords(num: number): string {
  const units = ['', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять'];
  const teens = ['десять', 'одиннадцать', 'двенадцать', 'тринадцать', 'четырнадцать', 'пятнадцать', 'шестнадцать', 'семнадцать', 'восемнадцать', 'девятнадцать'];
  const tens = ['', '', 'двадцать', 'тридцать', 'сорок', 'пятьдесят', 'шестьдесят', 'семьдесят', 'восемьдесят', 'девяносто'];

  if (num === 0) return 'ноль';
  if (num < 0) return 'минус ' + numberToWords(Math.abs(num));
  if (num < 10) return units[num];
  if (num < 20) return teens[num - 10];
  if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + units[num % 10] : '');
  
  return num.toString();
}