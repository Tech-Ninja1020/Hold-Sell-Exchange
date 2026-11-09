import type { Cents } from '../engine/money';
import type { YearMonth } from '../engine/types';

const whole = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const compact = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
});

const percent = new Intl.NumberFormat('en-US', {
  style: 'percent',
  minimumFractionDigits: 1,
  maximumFractionDigits: 3,
});

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const formatMoney = (amount: Cents): string => whole.format(amount / 100);

export const formatMoneyCompact = (amount: number): string => compact.format(amount / 100);

export const formatRate = (rate: number): string => percent.format(rate);

export const formatMonth = ({ year, month }: YearMonth): string => `${MONTHS[month - 1]} ${year}`;

export const formatYears = (years: number): string => (years === 1 ? '1 year' : `${years} years`);
