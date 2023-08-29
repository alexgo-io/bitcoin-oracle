import { z } from 'zod';

export * from './lib/api-errors';
export * from './lib/db.types';

export const ServiceTypeSchema = z.enum(['RELAYER', 'VALIDATOR']);
export type ServiceType = z.infer<typeof ServiceTypeSchema>;
