import { interestOnlyArm } from './interestOnlyArm';
import { longHold } from './longHold';
import { simple } from './simple';
import type { Scenario } from './types';

export type { Scenario } from './types';

export const scenarios: readonly Scenario[] = [simple, interestOnlyArm, longHold];
