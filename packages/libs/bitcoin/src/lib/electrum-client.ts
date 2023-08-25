import { env } from '@alex-b20/env';
import ElectrumClient from 'electrum-client-sl';

export async function withElectrumClient<T = void>(
  cb: (client: ElectrumClient) => Promise<T>,
): Promise<T> {
  const client = new ElectrumClient(
    env.ELECTRUM_HOST,
    env.ELECTRUM_PORT,
    env.ELECTRUM_PROTOCOL,
  );
  await client.connect();
  try {
    const res = await cb(client);
    await client.close();
    return res;
  } catch (error) {
    console.error(`Error from withElectrumClient`, error);
    await client.close();
    throw error;
  }
}
