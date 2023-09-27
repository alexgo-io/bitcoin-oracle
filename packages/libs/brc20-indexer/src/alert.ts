import { getLogger } from '@bitcoin-oracle/commons';
import { env } from './env';

export async function alertToTelegram(
  channel: string,
  event: string,
  metadata?: Record<string, string>,
) {
  const alertUrl = env().ALERT_URL;
  if (alertUrl) {
    await fetch(alertUrl, {
      method: 'POST',
      body: JSON.stringify({
        channel,
        event,
        metadata,
      }),
    }).catch(e => {
      getLogger('alertToTelegram').error(e);
    });
  }
}
