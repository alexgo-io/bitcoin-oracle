export type EnvironmentOptions = Record<string, unknown>;
export function withEnvironmentVars<T extends EnvironmentOptions>(
  options: T,
): T {
  const readEnvironment: Record<string, unknown> = {};
  if (options != null) {
    for (const [key, value] of Object.entries(options)) {
      if (typeof value === 'string') {
        const envVarKey = value.match(/\${(.*)}/)?.[1];
        if (envVarKey != null && process.env[envVarKey] != null) {
          readEnvironment[key] = process.env[envVarKey];
        }
      }
    }
  }

  return {
    ...options,
    ...readEnvironment,
  } as T;
}
