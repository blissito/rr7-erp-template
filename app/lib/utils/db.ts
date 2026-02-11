// Utility functions for database operations

export function isValidId(id: string): boolean {
  // UUID v4 regex validation
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

export function toObjectId(id: string): string {
  return id;
}
