import { type Cents, roundCents, sub, sum } from './money';

export type Asset = { basis: Cents; placedInService: number };

// 27.5 years counted in half-months, so the mid-month convention stays in integers.
const RECOVERY_HALF_MONTHS = 660;

// Rounding the cumulative amount (not each month) makes the schedule sum to basis exactly.
const recovered = (basis: Cents, halfMonths: number): Cents =>
  roundCents(
    (basis * Math.min(Math.max(halfMonths, 0), RECOVERY_HALF_MONTHS)) / RECOVERY_HALF_MONTHS,
  );

/** Depreciation taken through the end of `month` while the asset stays in service. */
export const depreciationThrough = (asset: Asset, month: number): Cents =>
  recovered(asset.basis, 2 * (month - asset.placedInService) + 1);

/** Depreciation taken if the asset is disposed of in `month`, which counts as a half month. */
export const depreciationAtDisposal = (asset: Asset, month: number): Cents =>
  recovered(asset.basis, 2 * (month - asset.placedInService));

export const depreciationInMonth = (asset: Asset, month: number): Cents =>
  sub(depreciationThrough(asset, month), depreciationThrough(asset, month - 1));

export const totalDepreciationThrough = (assets: readonly Asset[], month: number): Cents =>
  sum(assets.map((asset) => depreciationThrough(asset, month)));

export const totalDepreciationAtDisposal = (assets: readonly Asset[], month: number): Cents =>
  sum(assets.map((asset) => depreciationAtDisposal(asset, month)));

/** Cost basis of everything placed in service by `month`. */
export const basisInService = (assets: readonly Asset[], month: number): Cents =>
  sum(assets.filter((asset) => asset.placedInService <= month).map((asset) => asset.basis));
