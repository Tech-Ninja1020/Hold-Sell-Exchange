import type { Source, Sourced } from '../engine/provenance';

export const confirmed = <T>(value: T, source: Source, note?: string): Sourced<T> => ({
  value,
  source,
  confirmed: true,
  ...(note && { note }),
});

export const unconfirmed = <T>(value: T, source: Source, note?: string): Sourced<T> => ({
  value,
  source,
  confirmed: false,
  ...(note && { note }),
});
