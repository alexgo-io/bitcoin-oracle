import { Address, OutScript } from 'scure-btc-signer-cjs';
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
    path: ctx.path,
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

export const UpperCaseStringSchema = z.string().toUpperCase();

export const PKScriptBufferSchema = z.preprocess((val, ctx) => {
  if (val instanceof Buffer) {
    return val;
  }

  if (typeof val === 'string') {
    if (val.length === 0) {
      throw new Error('empty string address');
    }

    if (val.toLowerCase().startsWith('bc')) {
      try {
        return Buffer.from(OutScript.encode(Address().decode(val)));
      } catch (e) {
        ctx.addIssue({
          code: 'custom',
          message: `Invalid PKScriptBufferSchema: [${val}]. ${e}`,
        });
      }
    }

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
  } else {
    ctx.addIssue({
      code: 'custom',
      message: `Invalid PKScriptBufferSchema: ${val}`,
    });
  }

  return z.never();
}, z.instanceof(Buffer)) as z.ZodType<Buffer, z.ZodTypeDef, string>;

export type PKScriptAddress = {
  pkscript: string;
  address: string;
};

export const PKScriptBufferToAddressSchema = z.preprocess((val, ctx) => {
  let addressBuffer: Buffer;
  if (val instanceof Buffer) {
    addressBuffer = val;
  } else {
    addressBuffer = PKScriptBufferSchema.parse(val);
  }

  try {
    const address = Address().encode(OutScript.decode(addressBuffer));
    const pkscript = addressBuffer.toString('hex');
    return { address, pkscript };
  } catch (e) {
    ctx.addIssue({
      code: 'custom',
      message: `Invalid PKScriptBufferToAddressSchema: ${val}`,
    });
  }

  return z.never();
}, z.object({ pkscript: z.string(), address: z.string() }));

export const BooleanSchema = z.preprocess((val, ctx) => {
  if (typeof val === 'boolean') {
    return val;
  }
  if (typeof val === 'string') {
    return val === 'true';
  }
  if (typeof val === 'number') {
    return val === 1;
  }
  ctx.addIssue({
    message: `val is not a boolean: ${val}`,
    code: 'custom',
  });
  return z.NEVER;
}, z.boolean());
