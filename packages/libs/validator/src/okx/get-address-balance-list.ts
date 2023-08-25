/*
https://www.okx.com/web3/build/docs/bitcoin-ecosystem/brc20-api#query-address-balance-list
Query address balance list
#1.Request address
「GET」/address-balance-list

#2.Description
Query the balance of BRC20 tokens held by BTC address, transferable balance, available balance.

#3.Request param
Parameter	Type	Required	Description
address	String	Yes	BTC Chain Address
token	String	No	tick
page	String	No	Page
limit	String	No	Number of results per request. The maximum is 50. The default is 20.
#4.Response param
Parameter	Type	Description
page	String	Current page number
limit	String	The amount of data
totalPage	String	Total number of pages
balanceList	Array	List of token balances held by BTC address
> token	String	tick
> tokenType	String	Token Type, BRC20
> balance	String	Balance
> availableBalance	String	Available Balance
> transferBalance	String	Transfer Balance
#5.Request example
curl --location --globoff 'https://www.okx.com/api/v1/endpoints/btc/address-balance-list?address=bc1ph0057nc25ka94z8ydg43j8tnnp38u3hxpadutnt4n3jyfrmjzmcqw99mk2' \ --header 'Ok-Access-Key: ********'
#6.Response example
{
    "code": "0",
    "msg": "",
    "data": [
        {
            "page": "1",
            "limit": "1",
            "totalPage": "12",
            "balanceList": [
                {
                    "token": "sats",
                    "tokenType": "BRC20",
                    "balance": "1350000000000",
                    "availableBalance": "1350000000000",
                    "transferBalance": "0"
                }
            ]
        }
    ]
}
 */
import { env } from '@alex-b20/env';
import got from 'got-cjs';
import { z } from 'zod';
import { kOKXBaseURL } from './base';

const GetAddressBalanceListRequestSchema = z.object({
  address: z.string(),
  token: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

type GetAddressBalanceListRequest = z.infer<
  typeof GetAddressBalanceListRequestSchema
>;

const BalanceSchema = z.object({
  token: z.string(),
  tokenType: z.string(),
  balance: z.string(),
  availableBalance: z.string(),
  transferBalance: z.string(),
});

const GetAddressBalanceListResponseSchema = z.object({
  page: z.string(),
  limit: z.string(),
  totalPage: z.string(),
  balanceList: z.array(BalanceSchema),
});

type GetAddressBalanceListResponse = z.infer<
  typeof GetAddressBalanceListResponseSchema
>;

export async function getAddressBalanceList(
  params: GetAddressBalanceListRequest,
): Promise<GetAddressBalanceListResponse> {
  const result = (await got(`${kOKXBaseURL}/address-balance-list`, {
    searchParams: GetAddressBalanceListRequestSchema.parse(params),
    headers: {
      'Ok-Access-Key': env.OK_ACCESS_KEY,
    },
  }).json()) as any;

  if (result['code'] !== '0') {
    throw new Error(result['msg']);
  }

  return GetAddressBalanceListResponseSchema.parse(result['data'][0]);
}
