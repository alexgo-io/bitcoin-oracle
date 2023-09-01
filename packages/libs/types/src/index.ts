import { z } from 'zod';

export * from './lib/api-errors';
export * from './lib/db-model';

export const ServiceTypeSchema = z.enum(['RELAYER', 'VALIDATOR']);
export type ServiceType = z.infer<typeof ServiceTypeSchema>;
