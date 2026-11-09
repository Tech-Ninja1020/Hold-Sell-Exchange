import type { SourcedInputs } from '../engine/provenance';

export type Scenario = {
  id: string;
  name: string;
  address: string;
  propertyType: string;
  summary: string;
  inputs: SourcedInputs;
};
