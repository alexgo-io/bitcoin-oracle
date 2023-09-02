import { z } from 'zod';

export const IndexerTypeSchema = z.enum(['bis', 'okx']);
export type IndexerType = z.infer<typeof IndexerTypeSchema>;

export const ServiceTypeSchema = z.enum(['RELAYER', 'VALIDATOR']);
export type ServiceType = z.infer<typeof ServiceTypeSchema>;

