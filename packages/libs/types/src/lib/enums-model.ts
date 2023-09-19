import { z } from 'zod';

const IndexerType = z.enum(['bis', 'okx']);
const ServiceType = z.enum(['RELAYER', 'VALIDATOR']);

export const Enums = {
  IndexerType,
  ServiceType,
};

type InferEnums<S extends keyof typeof Enums> = z.infer<(typeof Enums)[S]>;

export type IndexerType = InferEnums<'IndexerType'>;
export type ServiceType = InferEnums<'ServiceType'>;
