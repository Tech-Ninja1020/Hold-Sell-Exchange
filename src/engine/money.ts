export type Cents = number & { readonly __brand: 'Cents' };

export const ZERO = 0 as Cents;

// Half away from zero: symmetric for inflows and outflows, and how lenders and the IRS round.
export const roundCents = (amount: number): Cents =>
  (Math.sign(amount) * Math.round(Math.abs(amount)) + 0) as Cents; // + 0 normalizes -0

export const cents = (wholeCents: number): Cents => {
  if (!Number.isInteger(wholeCents)) throw new RangeError(`not whole cents: ${wholeCents}`);
  return wholeCents as Cents;
};

export const fromDollars = (dollars: number): Cents => roundCents(dollars * 100);

export const add = (a: Cents, b: Cents): Cents => (a + b) as Cents;

export const sub = (a: Cents, b: Cents): Cents => (a - b) as Cents;

export const neg = (a: Cents): Cents => (0 - a) as Cents;

export const sum = (amounts: readonly Cents[]): Cents =>
  amounts.reduce<number>((total, amount) => total + amount, 0) as Cents;

export const minCents = (a: Cents, b: Cents): Cents => (a < b ? a : b);

export const maxCents = (a: Cents, b: Cents): Cents => (a > b ? a : b);

/** Multiplies by a rate or fraction and rounds back to whole cents. */
export const scale = (amount: Cents, factor: number): Cents => roundCents(amount * factor);
