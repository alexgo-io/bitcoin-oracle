import z from 'zod';

export const api_model_bridge_steps_transactions = z.object({
  source_tx_hash: z.string(),
});

export type IAPIBridgeStepsTransactions = z.infer<
  typeof api_model_bridge_steps_transactions
>;
