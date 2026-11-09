import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  type Asset,
  basisInService,
  depreciationAtDisposal,
  depreciationInMonth,
  depreciationThrough,
  totalDepreciationThrough,
} from '../src/engine/depreciation';
import { cents, fromDollars, sum } from '../src/engine/money';

// IRS Pub 946, Table A-6: residential rental, 27.5 years, mid-month, first-year % by month.
const TABLE_A6_YEAR_1 = [
  3.485, 3.182, 2.879, 2.576, 2.273, 1.97, 1.667, 1.364, 1.061, 0.758, 0.455, 0.152,
];
const TABLE_A6_FULL_YEAR = 3.636;
const TABLE_ROUNDING = 0.0005;

const building: Asset = { basis: fromDollars(320_000), placedInService: 1 };

const percentOfBasis = (asset: Asset, amount: number) => (amount / asset.basis) * 100;

const anyAsset = fc.record({
  basis: fc.integer({ min: 1, max: 5_000_000_00 }).map(cents),
  placedInService: fc.integer({ min: 1, max: 240 }),
});

describe('residential straight-line depreciation', () => {
  it('takes $11,151.52 in year one on a $320,000 building placed in service in January', () => {
    // 11.5 months of 330: 320,000 x 11.5 / 330
    expect(depreciationThrough(building, 12)).toBe(1_115_152);
  });

  it('takes $11,636.36 in each full year after that', () => {
    const yearTwo = depreciationThrough(building, 24) - depreciationThrough(building, 12);
    expect(yearTwo).toBe(1_163_636);
    expect(percentOfBasis(building, yearTwo)).toBeCloseTo(TABLE_A6_FULL_YEAR, 3);
  });

  it('matches the first-year percentage in Pub 946 Table A-6 for every month placed in service', () => {
    TABLE_A6_YEAR_1.forEach((tablePercent, i) => {
      const calendarMonth = i + 1;
      const asset = { ...building, placedInService: calendarMonth };
      const firstYear = depreciationThrough(asset, 12);
      expect(Math.abs(percentOfBasis(asset, firstYear) - tablePercent)).toBeLessThanOrEqual(
        TABLE_ROUNDING,
      );
    });
  });

  it('takes half a month in the month placed in service', () => {
    expect(depreciationInMonth(building, 1)).toBe(48_485);
    expect(depreciationInMonth(building, 2)).toBe(96_970);
  });

  it('takes half a month in the month of disposal', () => {
    const beforeSale = depreciationThrough(building, 59);
    expect(depreciationAtDisposal(building, 60) - beforeSale).toBe(48_485);
    expect(depreciationThrough(building, 60) - beforeSale).toBe(96_970);
  });

  it('takes nothing before the asset is placed in service', () => {
    const later = { ...building, placedInService: 30 };
    expect(depreciationThrough(later, 29)).toBe(0);
    expect(depreciationInMonth(later, 12)).toBe(0);
  });

  it('is fully depreciated after 27.5 years and takes nothing more', () => {
    expect(depreciationThrough(building, 330)).toBeLessThan(building.basis);
    expect(depreciationThrough(building, 331)).toBe(building.basis);
    expect(depreciationInMonth(building, 332)).toBe(0);
  });
});

describe('improvements', () => {
  const roof: Asset = { basis: fromDollars(33_000), placedInService: 61 };

  it('depreciate on their own schedule from the month they are placed in service', () => {
    expect(totalDepreciationThrough([building, roof], 60)).toBe(depreciationThrough(building, 60));
    expect(depreciationInMonth(roof, 61)).toBe(5_000);
    expect(depreciationInMonth(roof, 62)).toBe(10_000);
    expect(depreciationThrough(roof, 391)).toBe(roof.basis);
  });

  it('join the cost basis only once placed in service', () => {
    expect(basisInService([building, roof], 60)).toBe(building.basis);
    expect(basisInService([building, roof], 61)).toBe(building.basis + roof.basis);
  });
});

describe('any asset', () => {
  it('never depreciates past its basis', () => {
    fc.assert(
      fc.property(anyAsset, fc.integer({ min: 0, max: 720 }), (asset, month) => {
        expect(depreciationThrough(asset, month)).toBeLessThanOrEqual(asset.basis);
        expect(depreciationAtDisposal(asset, month)).toBeLessThanOrEqual(
          depreciationThrough(asset, month),
        );
      }),
    );
  });

  it('never takes negative depreciation in a month', () => {
    fc.assert(
      fc.property(anyAsset, fc.integer({ min: 0, max: 720 }), (asset, month) => {
        expect(depreciationInMonth(asset, month)).toBeGreaterThanOrEqual(0);
      }),
    );
  });

  it('recovers exactly its basis across the monthly schedule', () => {
    fc.assert(
      fc.property(anyAsset, (asset) => {
        const months = Array.from({ length: 331 }, (_, i) => asset.placedInService + i);
        expect(sum(months.map((month) => depreciationInMonth(asset, month)))).toBe(asset.basis);
      }),
    );
  });
});
