export function parsePositiveInt(value: string | number | undefined | null): number | null {
  if (value === undefined || value === null) return null
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null
  }
  return parsed
}
