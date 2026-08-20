export function resolvePort(value: string | undefined, fallback = 3000): number {
  const configuredPort = Number(value);
  return Number.isInteger(configuredPort) && configuredPort >= 1 && configuredPort <= 65535
    ? configuredPort
    : fallback;
}
