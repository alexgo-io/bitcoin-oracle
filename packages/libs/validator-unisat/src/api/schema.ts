import { getLogger } from '@meta-protocols-oracle/commons';
import { UpperCaseStringSchema } from '@meta-protocols-oracle/types';
import { Address, OutScript } from 'scure-btc-signer-cjs';
import { z } from 'zod';

const UnisatAddressToPKScriptSchema = z.preprocess((val, ctx) => {
  if (typeof val === 'string') {
    if (val.length === 0) {
      // decode as empty string to be filter out later
      return '';
    }
    try {
      return Buffer.from(OutScript.encode(Address().decode(val))).toString(
        'hex',
      );
    } catch (e) {
      const message = `Invalid UnisatAddressToPKScriptSchema: [${val}]. ${e}`;
      getLogger('address-to-pkscript').warn(message);
      return '';
    }
  } else {
    ctx.addIssue({
      code: 'custom',
      message: `Invalid UnisatAddressToPKScriptSchema: ${val}`,
    });
  }

  return z.never();
}, z.string());

export const PKScriptToUnisatAddressSchema = z.preprocess((val, ctx) => {
  if (typeof val === 'string') {
    if (val.length === 0) {
      ctx.addIssue({
        code: 'custom',
        message: `Invalid PKScriptToUnisatAddressSchema: empty string`,
      });
      return z.never();
    }
    try {
      return Address().encode(OutScript.decode(Buffer.from(val, 'hex')));
    } catch (e) {
      const message = `Invalid PKScriptToUnisatAddressSchema: [${val}]. ${e}`;
      getLogger('address-to-pkscript').warn(message);
      return '';
    }
  } else {
    ctx.addIssue({
      code: 'custom',
      message: `Invalid PKScriptToUnisatAddressSchema: ${val}`,
    });
  }

  return z.never();
}, z.string());

/*
  {
    "ticker": "rats",
    "type": "transfer",
    "valid": true,
    "txid": "8da514ca1f26bd9ccd0855e934f5d184cb5929d5ab1b5caa7c070bd9e6323172",
    "idx": 0,
    "vout": 0,
    "inscriptionNumber": 41093106,
    "inscriptionId": "8da514ca1f26bd9ccd0855e934f5d184cb5929d5ab1b5caa7c070bd9e6323172i0",
    "from": "bc1pxl55h9yhj6v3uuwx7njp3gyqdd8fv0erya8qfj5dnuuy92jdzmmsjjjl6w",
    "to": "bc1pjflz4kwp427eyqmepp0c6kghjuk8ayd3cpuzdqhj206cfvfav2ds3df9x4",
    "satoshi": 546,
    "amount": "6886331.63091",
    "overallBalance": "",
    "transferBalance": "",
    "availableBalance": "",
    "height": 817187,
    "txidx": 226,
    "blockhash": "000000000000000000016086c999ab350a22ea0bd57caac6ad8031d92ee1fc26",
    "blocktime": 1700237212
  }
 */

const UnisatTypeSchema = z.enum([
  'transfer',
  'inscribe-transfer',
  'inscribe-mint',
  'inscribe-deploy',
]);

const activity = z.object({
  type: UnisatTypeSchema,
  ticker: UpperCaseStringSchema,
  height: z.number(),
  from: UnisatAddressToPKScriptSchema,
  to: UnisatAddressToPKScriptSchema,
  txid: z.string(),
  amount: z.string(),
  vout: z.number(),
  offset: z.number(),
});

function createPaginationSchema<T extends z.ZodTypeAny>(schema: T) {
  return z.object({
    code: z.any().nullish(),
    msg: z.any().nullish(),
    data: z.object({
      data: z.object({
        total: z.number(),
        start: z.number(),
        detail: z.array(schema),
      }),
    }),
  });
}
/*
      {
        "ticker": "sats",
        "overallBalance": "63798589733",
        "transferableBalance": "33798589733",
        "availableBalance": "30000000000",
        "decimal": 18
      }
 */

const balance = z.object({
  ticker: UpperCaseStringSchema,
  availableBalance: z.string(),
  transferableBalance: z.string(),
  overallBalance: z.string(),
  decimal: z.number(),
});

export const UnisatAPISchema = {
  activity: createPaginationSchema(activity),
  balance: createPaginationSchema(balance),
};

export type UnisatAPIType<K extends keyof typeof UnisatAPISchema> = z.infer<
  (typeof UnisatAPISchema)[K]
>;

export const UnisatSchema = {
  activity,
  balance,
};

export type UnisatType<K extends keyof typeof UnisatAPISchema> = z.infer<
  (typeof UnisatSchema)[K]
>;
