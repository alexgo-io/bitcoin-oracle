import fetch from 'node-fetch';

export function startHeartBeat(url?: string) {
  if (url) {
    console.log(`Starting heartbeat to ${url}`);
    setInterval(() => {
      fetch(url).catch(e => {
        console.error(`Heartbeat failed: ${e}`);
      });
    }, 1000 * 5);
  } else {
    console.log('No heartbeat url specified, skipping heartbeat');
  }
}
