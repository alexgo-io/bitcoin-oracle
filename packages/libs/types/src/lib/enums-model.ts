import { z } from 'zod';

const ValidatorName = z.enum(['bis', 'okx', 'hiro', 'unisat', 'unknown']);
const ServiceType = z.enum(['relayer', 'validator', 'indexer']);

export const Enums = {
  ValidatorName,
  ServiceType,
};

type InferEnums<S extends keyof typeof Enums> = z.infer<(typeof Enums)[S]>;

export type ValidatorName = InferEnums<'ValidatorName'>;
export type ServiceType = InferEnums<'ServiceType'>;
