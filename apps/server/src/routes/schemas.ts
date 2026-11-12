import { z } from 'zod';

const idx = z.number().int().min(0).max(16);
const ingredient = z.enum(['bun', 'patty', 'cheese', 'lettuce', 'tomato', 'fries', 'cup', 'milk']);
const customer = z.number().int().min(0).max(10_000).optional();

export const PlayerActionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('bin'), bin: ingredient, plate: idx.optional() }),
  z.object({ type: z.literal('grill'), slot: idx, plate: idx.optional() }),
  z.object({ type: z.literal('plate'), plate: idx, customer }),
  z.object({ type: z.literal('fryer'), basket: idx }),
  z.object({ type: z.literal('warmer'), customer }),
  z.object({ type: z.literal('cup'), slot: idx, customer }),
  z.object({ type: z.literal('shaker'), slot: idx, customer }),
  z.object({ type: z.literal('discard'), station: z.enum(['plate', 'grill', 'fryer', 'cup', 'shaker']), index: idx }),
]);

export const CompleteLevelSchema = z.object({
  actions: z
    .array(z.object({ t: z.number().int().min(0).max(10_000_000), a: PlayerActionSchema }))
    .max(20_000),
  clientResult: z.object({ revenue: z.number(), stars: z.number() }).optional(),
});

export const RegisterSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[A-Za-z0-9_.-]+$/, 'Only letters, numbers, dot, dash and underscore')
    .refine((v) => !/^guest-/i.test(v), 'Usernames starting with "Guest-" are reserved'),
  email: z.email('Please enter a valid email').max(200),
  password: z.string().min(8, 'Password must be at least 8 characters').max(200),
});

export const LoginSchema = z.object({
  identifier: z.string().trim().min(1, 'Enter your username or email').max(200),
  password: z.string().min(1, 'Enter your password').max(200),
});

export const SettingsSchema = z.object({
  audio: z.object({
    master: z.number().min(0).max(1),
    music: z.boolean(),
    sfx: z.boolean(),
    voices: z.boolean(),
    ui: z.boolean(),
  }),
  showHints: z.boolean(),
  reducedMotion: z.boolean(),
});

export const PurchaseSchema = z.object({
  restaurantId: z.string().min(1).max(50),
  upgradeType: z.string().min(1).max(50),
});

export const StartLevelParams = z.object({
  restaurantId: z.string().min(1).max(50),
  levelNumber: z.coerce.number().int().min(1).max(500),
});
