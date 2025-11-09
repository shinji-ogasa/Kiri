type EnvValue = string | undefined;

const cache = new Map<string, string>();

function readEnv(key: string): EnvValue {
  if (cache.has(key)) {
    return cache.get(key);
  }
  const value = process.env?.[key];
  if (typeof value === 'string') {
    cache.set(key, value);
  }
  return value;
}

export function requireEnv(key: string, fallback?: string): string {
  const value = readEnv(key) ?? fallback;
  if (value === undefined || value === '') {
    throw new Error(`Missing required env: ${key}`);
  }
  return value;
}

export function getEnv(key: string, fallback = ''): string {
  return readEnv(key) ?? fallback;
}
