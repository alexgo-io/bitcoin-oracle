export function parseErrorDetail(e: unknown): string {
  if (e instanceof Error) {
    return `message: ${e.message}\nstack: ${e.stack}`;
  } else {
    return JSON.stringify(e);
  }
}
