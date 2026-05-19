/** Resolve a field value from a generic record by key. */
export function getFieldValue(item: object, key: string): unknown {
  return (item as Record<string, unknown>)[key];
}

/** Coerce an unknown field value to a display string. */
export function renderFieldValue(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return '';
}
