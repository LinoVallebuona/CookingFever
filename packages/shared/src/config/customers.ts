export type CustomerTypeId = 'regular' | 'senior' | 'rusher' | 'bigEater' | 'critic';

export interface CustomerTypeDef {
  id: CustomerTypeId;
  name: string;
  description: string;
  /** Multiplier on the level's base patience. */
  patienceMult: number;
  /** Multiplier on tips. */
  tipMult: number;
  /** Min/max number of items ordered (clamped by level max). */
  minItems: number;
  maxItems: number;
}

export const CUSTOMER_TYPES: Record<CustomerTypeId, CustomerTypeDef> = {
  regular: { id: 'regular', name: 'Regular', description: 'Easy-going local. Average patience.', patienceMult: 1, tipMult: 1, minItems: 1, maxItems: 2 },
  senior: { id: 'senior', name: 'Retiree', description: 'Very patient, but tips modestly.', patienceMult: 1.35, tipMult: 0.7, minItems: 1, maxItems: 2 },
  rusher: { id: 'rusher', name: 'Office Rusher', description: 'Always in a hurry. Tips well if you are fast.', patienceMult: 0.7, tipMult: 1.6, minItems: 1, maxItems: 2 },
  bigEater: { id: 'bigEater', name: 'Big Eater', description: 'Orders a feast. Normal patience.', patienceMult: 1.1, tipMult: 1.1, minItems: 2, maxItems: 4 },
  critic: { id: 'critic', name: 'Food Critic', description: 'Impatient and picky, but tips generously.', patienceMult: 0.8, tipMult: 2.2, minItems: 2, maxItems: 3 },
};
