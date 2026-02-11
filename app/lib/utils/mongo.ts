// Utility for ID validation (PostgreSQL UUID instead of MongoDB ObjectId)

export function validateObjectId(id: string): boolean {
  // UUID v4 validation
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

export function isValidObjectId(id: string): boolean {
  return validateObjectId(id);
}
