export interface RestaurantDef {
  id: string;
  name: string;
  description: string;
  /** Stars required (across all restaurants) to unlock. 0 = available from the start. */
  unlockRequirement: number;
  /** Whether the restaurant is actually implemented and playable. */
  playable: boolean;
  theme: { primary: string; secondary: string; emoji: string };
  sortOrder: number;
}

export const RESTAURANTS: RestaurantDef[] = [
  {
    id: 'diner',
    name: "Sunny's Diner",
    description: 'A classic American diner serving burgers, crispy fries, sodas and milkshakes.',
    unlockRequirement: 0,
    playable: true,
    theme: { primary: '#ef4444', secondary: '#facc15', emoji: '🍔' },
    sortOrder: 1,
  },
  {
    id: 'pizzeria',
    name: 'Nonna Rosa Pizzeria',
    description: 'Wood-fired pizzas and pasta. Currently in development – not playable yet.',
    unlockRequirement: 45,
    playable: false,
    theme: { primary: '#16a34a', secondary: '#f97316', emoji: '🍕' },
    sortOrder: 2,
  },
  {
    id: 'sushi',
    name: 'Koi Sushi Bar',
    description: 'Fresh rolls and miso soup. Currently in development – not playable yet.',
    unlockRequirement: 90,
    playable: false,
    theme: { primary: '#0ea5e9', secondary: '#f43f5e', emoji: '🍣' },
    sortOrder: 3,
  },
];

export function getRestaurant(id: string): RestaurantDef | undefined {
  return RESTAURANTS.find((r) => r.id === id);
}
