/**
 * SQLite JSON Array Helpers
 *
 * SQLite doesn't support native array columns. These helpers
 * serialize/deserialize string arrays to/from JSON strings
 * for storage in SQLite text columns.
 */

/** Convert a string array to a JSON string for SQLite storage */
export function toJsonArray(arr: string[] | string | undefined | null): string {
  if (typeof arr === 'string') {
    // Already a JSON string — validate and return
    try {
      JSON.parse(arr);
      return arr;
    } catch {
      return JSON.stringify([arr]);
    }
  }
  if (!arr || !Array.isArray(arr)) return '[]';
  return JSON.stringify(arr);
}

/** Parse a JSON string back to a string array */
export function fromJsonArray(json: string | string[] | undefined | null): string[] {
  if (Array.isArray(json)) return json; // already an array
  if (!json || json === '') return [];
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
