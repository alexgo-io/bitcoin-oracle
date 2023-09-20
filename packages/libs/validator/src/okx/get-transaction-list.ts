import { env } from '@alex-b20/env';
import got from 'got-cjs';
import { z } from 'zod';
import { OKXActionTypeSchema, kOKXBaseURL } from './base';
/*
https://www.okx.com/web3/build/docs/bitcoin-ecosystem/brc20-api#query-token-transaction-list
Query token transaction list
#1.Request address
「GET」/transaction-list

#2.Description
Query transaction list by address, transaction hash, block height.

#3.Request param
Parameter	Type	Required	Description
address	String	No	BTC Address
token	String	No	tick
inscriptionNumber	String	No	Inscription Number
actionType	String	No	Action Type: deploy, mint, inscribeTransfer, transfer
toAddress	String	No	Sender BTC Address
fromAddress	String	No	Receiver BTC Address
txId	String	No	Transaction Hash
blockHeight	String	No	Block Height
page	String	No	Page
limit	String	No	Number of results per request. The maximum is 100. The default is 20.
#4.Response param
Parameter	Type	Description
page	String	Current page number
limit	String	The amount of data
totalPage	String	Total number of pages
totalTransaction	String	Total Transaction
transactionList	Array	Transaction List
> txid	String	Transaction Hash
> blockHeight	String	Block Height
> state	String	State (success, fail)
> tokenType	String	Token Type, BRC20
> actionType	String	Action Type: deploy, mint, inscribeTransfer, transfer
> fromAddress	String	Sender BTC Address
> toAddress	String	Receiver BTC Address
> amount	String	Amount
> token	String	tick
> inscriptionId	String	Inscription Id
> inscriptionNumber	String	Inscription Number
> index	String	The inscription corresponds to the index of the vout (output) in a transaction.
> location	String	The location of an inscription is represented in the format of "txid:vout:offset"
> msg	String	Msg
> time	String	Time
#5.Request example
curl --location --globoff 'https://www.okx.com/api/v1/endpoints/btc/transaction-list' \ --header 'Ok-Access-Key: ********'
#6.Response example
{
    "code": "0",
    "msg": "",
    "data": [
        {
            "page": "1",
            "limit": "1",
            "totalPage": "2",
            "totalTransaction": "2",
            "inscriptionsList": [
                {
                    "txId": "15f3bad7d7eeac1fad3cffa22812ab43aeaf8f4f6fad83732fc30b2273a0ffd6",
                    "blockHeight": "791466",
                    "state": "success",
                    "tokenType": "BRC20",
                    "actionType": "inscribeTransfer",
                    "fromAddress": "",
                    "toAddress": "bc1p40d22fknr7gu29vswn2r40v3dd39uwavtsnltmdj6sp5lju5davqgwdajy",
                    "amount": "5000",
                    "token": "OXBT",
                    "inscriptionId": "15f3bad7d7eeac1fad3cffa22812ab43aeaf8f4f6fad83732fc30b2273a0ffd6i0",
                    "inscriptionNumber": "9244252",
                    "index": "0",
                    "location": "15f3bad7d7eeac1fad3cffa22812ab43aeaf8f4f6fad83732fc30b2273a0ffd6:0:0",
                    "msg": "",
                    "time": "1685092041000"
                }
            ]
        }
    ]
}
 */

const TransactionListRequestSchema = z.object({
  address: z.string().optional(),
  token: z.string().optional(),
  inscriptionNumber: z.string().optional(),
  actionType: z.string().optional(),
  toAddress: z.string().optional(),
  fromAddress: z.string().optional(),
  txId: z.string().optional(),
  blockHeight: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});
type TransactionListRequest = z.infer<typeof TransactionListRequestSchema>;

export const OKXInscriptionSchema = z.object({
  txId: z.string(),
  blockHeight: z.string(),
  state: z.string(),
  tokenType: z.string(),
  actionType: OKXActionTypeSchema,
  fromAddress: z.string(),
  toAddress: z.string(),
  amount: z.string(),
  token: z.string(),
  inscriptionId: z.string(),
  inscriptionNumber: z.string(),
  index: z.string(),
  location: z.string(),
  msg: z.string(),
  time: z.string(),
});
export type OKXInscription = z.infer<typeof OKXInscriptionSchema>;

const TransactionListResponseSchema = z.object({
  page: z.string(),
  limit: z.string(),
  totalPage: z.string(),
  totalTransaction: z.string(),
  inscriptionsList: z.array(OKXInscriptionSchema),
});
type TransactionListResponse = z.infer<typeof TransactionListResponseSchema>;

export async function getTransactionList(
  params: TransactionListRequest,
): Promise<TransactionListResponse> {
  const result = (await got(`${kOKXBaseURL}/transaction-list`, {
    searchParams: TransactionListRequestSchema.parse(params),
    headers: {
      'Ok-Access-Key': env.OK_ACCESS_KEY,
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }).json()) as any;

  if (result['code'] !== '0') {
    throw new Error(`Failed to get transaction list: ${result['msg']}`);
  } else {
    return TransactionListResponseSchema.parse(result['data'][0]);
  }
}
