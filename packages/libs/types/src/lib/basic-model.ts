import { z } from 'zod';

export const BufferSchema = z.preprocess((val, ctx) => {
  if (typeof val === 'string') {
    return Buffer.from(
      val.length >= 2 && val[1] === 'x' ? val.slice(2) : val,
      'hex',
    );
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
  if (typeof val === "bigint") {
    return val;
  }
  if (typeof val === "string") {
    if (val.endsWith("n")) {
      return BigInt(val.slice(0, -1));
    }
    return BigInt(val);
  }
  if (typeof val === "number") {
    return BigInt(val);
  }
  ctx.addIssue({
    message: `val is not a bigint: ${val}`,
    code: "custom"
  });
  return z.NEVER;
}, z.bigint());
export const BigIntStringSchema = z.bigint().transform(arg => arg.toString());
export const BufferStringSchema = z
  .instanceof(Buffer)
  .transform(arg => arg.toString('hex'));
