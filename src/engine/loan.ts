import { type Cents, ZERO, add, minCents, roundCents, scale, sub } from './money';

export type RateReset = { afterMonth: number; annualRate: number };

export type LoanTerms = {
  principal: Cents;
  annualRate: number;
  termMonths: number;
  interestOnlyMonths: number;
  rateReset: RateReset | null;
};

export type LoanPayment = {
  month: number;
  annualRate: number;
  payment: Cents;
  interest: Cents;
  principal: Cents;
  balance: Cents;
};

/** Level payment that amortizes `balance` over `months` at a fixed annual rate. */
export const monthlyPayment = (balance: Cents, annualRate: number, months: number): Cents => {
  if (annualRate === 0) return roundCents(balance / months);
  const r = annualRate / 12;
  return roundCents((balance * r) / (1 - (1 + r) ** -months));
};

export const amortize = (terms: LoanTerms): LoanPayment[] => {
  const { termMonths, interestOnlyMonths, rateReset } = terms;
  const schedule: LoanPayment[] = [];
  let balance = terms.principal;
  let annualRate = terms.annualRate;
  let levelPayment = ZERO;

  for (let month = 1; balance > 0 && month <= termMonths; month++) {
    const resets = rateReset !== null && month === rateReset.afterMonth + 1;
    if (resets) annualRate = rateReset.annualRate;

    const interestOnly = month <= interestOnlyMonths;
    if (!interestOnly && (resets || month === interestOnlyMonths + 1)) {
      levelPayment = monthlyPayment(balance, annualRate, termMonths - month + 1);
    }

    const interest = scale(balance, annualRate / 12);
    const scheduled = interestOnly ? ZERO : sub(levelPayment, interest);
    // The last payment absorbs rounding drift (or the balloon) so the balance lands on zero.
    const principal = month === termMonths ? balance : minCents(scheduled, balance);

    balance = sub(balance, principal);
    schedule.push({
      month,
      annualRate,
      payment: add(interest, principal),
      interest,
      principal,
      balance,
    });
  }
  return schedule;
};

export const balanceAfter = (schedule: readonly LoanPayment[], month: number): Cents =>
  schedule[month - 1]?.balance ?? ZERO;
