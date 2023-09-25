import { z } from 'zod';

export const BufferHexSchema = z.preprocess((val, ctx) => {
  if (typeof val === 'string') {
    if (val.length >= 2 && val[1] === 'x') {
      return Buffer.from(val.slice(2), 'hex');
    }
    if (
      val.length >= 3 &&
      val[0] === '\\' &&
      val[1] === '\\' &&
      val[2] === 'x'
    ) {
      return Buffer.from(val.slice(3), 'hex');
    } else {
      return Buffer.from(val, 'hex');
    }
  }
  if (val instanceof Buffer) {
    return val;
  }
  ctx.addIssue({
    message: `val is not a buffer: ${val}`,
    code: 'custom',
  });
  return z.NEVER;
}, z.instanceof(Buffer)) as z.ZodType<Buffer, z.ZodTypeDef, Buffer>;

export const BufferSchema = z.preprocess((val, ctx) => {
  if (typeof val === 'string') {
    return Buffer.from(val.length >= 2 && val[1] === 'x' ? val.slice(2) : val);
  }
  if (val instanceof Buffer) {
    return val;
  }
  ctx.addIssue({
    message: `val is not a buffer: ${val}`,
    code: 'custom',
  });
  return z.NEVER;
}, z.instanceof(Buffer)) as z.ZodType<Buffer, z.ZodTypeDef, Buffer>;

export const BigIntSchema = z.preprocess((val, ctx) => {
  if (typeof val === 'bigint') {
    return val;
  }
  if (typeof val === 'string') {
    if (val.endsWith('n')) {
      return BigInt(val.slice(0, -1));
    }
    return BigInt(val);
  }
  if (typeof val === 'number') {
    return BigInt(val);
  }
  ctx.addIssue({
    message: `val is not a bigint: ${val}`,
    code: 'custom',
  });
  return z.NEVER;
}, z.bigint());
export const BigIntStringSchema = z.preprocess((val, ctx) => {
  if (typeof val === 'bigint') {
    return val.toString();
  }
  if (typeof val === 'string') {
    if (val.endsWith('n')) {
      return val.slice(0, -1);
    }
    return val;
  }
  if (typeof val === 'number') {
    return BigInt(val).toString();
  }
  ctx.addIssue({
    message: `val is not a bigint: ${val}`,
    code: 'custom',
  });
  return z.NEVER;
}, z.string());
export const BufferStringSchema = z.preprocess((val, ctx) => {
  if (typeof val === 'string') {
    return val;
  }
  if (val instanceof Buffer) {
    return val.toString('hex');
  }
  ctx.addIssue({
    message: `val is not a buffer: ${val}`,
    code: 'custom',
  });
  return z.NEVER;
}, z.string());

export const DateSchema = z.preprocess((val, ctx) => {
  if (val instanceof Date) {
    return val;
  }
  if (typeof val === 'string') {
    return new Date(val);
  }
  if (typeof val === 'number') {
    if (val < 1e10) {
      return new Date(val * 1000);
    }
    return new Date(val);
  }
  if (typeof val === 'bigint') {
    if (val < 1e10) {
      return new Date(Number(val) * 1000);
    }
    return new Date(Number(val));
  }
  ctx.addIssue({
    message: `val is not a date: ${val}`,
    code: 'custom',
  });
  return z.never();
}, z.date());
