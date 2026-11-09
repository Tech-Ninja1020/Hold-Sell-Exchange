# hold-sell-exchange

![The simulator showing four strategy outcomes, the value chart, and the sale waterfall](docs/screenshot.png)

Live demo: _not deployed yet_

An owner of a rental property eventually faces three choices: keep holding it, sell it and pay
the tax, or trade it for another property in a 1031 exchange and defer the tax. The right answer
depends on the loan, how much depreciation has been taken, the tax rates, and what the money
would earn elsewhere. Advisors usually work this out in a spreadsheet.

I built this to do that comparison properly. It simulates the property month by month and reports
what each choice is worth after tax, in cash, at any point in time. It also tracks where every
input came from, and flags any result that rests on a number nobody has confirmed.

## Quick start

Requires Node 20 or later.

```
npm install
npm run dev
```

Other commands:

```
npm test            unit and property-based tests
npm run typecheck   strict TypeScript
npm run lint        ESLint and Prettier
npm run build       production build into dist/
```

## Design decisions

**Integer cents.** All money is a branded `Cents` integer. Floats drift over 360 monthly steps,
and a tax tool that is off by a cent is hard to trust. Every conversion from a float goes through
one rounding function, which rounds half away from zero.

**Monthly time step.** Loans amortize monthly and the mid-month depreciation convention needs
months, so the whole engine steps monthly. Rental tax is settled each calendar December.

**Pure engine.** `src/engine` has no React, no DOM, no clock and no randomness. The same inputs
always give deep-equal output, and a lint rule fails the build if the engine imports from the UI
or calls `Date.now()` or `Math.random()`.

**Engine and UI split.** The engine returns data, never formatted strings. The UI formats and
draws; it does no financial arithmetic. Rankings and waterfall running totals are computed in the
engine for that reason.

**Provenance.** Every input is a `Sourced<T>`: a value, where it came from, and whether someone
has confirmed it. A static map records which inputs each output depends on, so each strategy can
list the unconfirmed inputs behind it. The map is tested against the engine: changing an input an
output does not list must leave that output unchanged. Editing a value marks it unconfirmed again.

## Tax rules implemented

- Residential depreciation: straight-line over 27.5 years, mid-month convention, land excluded.
- Improvements depreciate on their own 27.5-year schedules from the month placed in service.
- Closing costs are added to basis, split between land and building by value.
- Rental income is taxed yearly at the ordinary plus state rate.
- Rental losses are suspended, offset later rental income, and are released on a taxable sale.
- Gain on sale is amount realized less adjusted basis.
- Unrecaptured section 1250 gain is the lesser of depreciation taken and gain, taxed at the
  ordinary rate up to a 25% cap.
- Remaining gain is taxed at the long-term rate, or the ordinary rate if held a year or less.
- Net investment income tax of 3.8% on the gain, when switched on.
- State tax on the gain at a flat rate.
- Step-up in basis at death (section 1014): no tax on the deferred gain or recapture.
- 1031 exchange: gain is deferred into a lower replacement basis; boot is taxed, recapture first.
- Boot is cash taken out plus debt relief that is not replaced by new debt or cash paid in.
- Depreciation history and suspended losses carry over to the replacement property.

## Simplifications

- Flat tax rates, not brackets. Selling does not push the owner into a higher bracket.
- Suspended losses ignore the $25,000 allowance and real estate professional status.
- A released suspended loss is valued at the ordinary plus state rate, as if there were other
  income to absorb it.
- A sale at a loss owes no tax and takes no deduction.
- Net investment income tax applies to the sale gain only, not to yearly rental income.
- The replacement property restarts depreciation on a fresh 27.5-year schedule. The real rule
  (Treas. Reg. 1.168(i)-6) continues the old schedule for the carried-over basis.
- The 45-day and 180-day exchange deadlines are ignored.
- The replacement uses the same vacancy and growth rates as the original property, and a
  fixed-rate loan sized by loan-to-value.
- The reinvestment rate is treated as already after tax.
- Step-up is only shown for the original property, not for the replacement after an exchange.
- The interface does not stop you setting a land value above the purchase price.

## What I'd build next

- Portfolios of several properties, with passive losses netted across them.
- Real federal and state brackets, so the sale year reflects the income spike.
- Refinance and cash-out as a fourth strategy.
- An AI document-extraction layer that reads tax returns, closing statements and lender
  statements and produces `Sourced` inputs. The model would only propose values with their
  source; a person confirms them, and the engine stays the only thing doing math.

This is a modeling exercise, not tax advice.
