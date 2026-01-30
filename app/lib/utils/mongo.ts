import { Types } from "mongoose";

/**
 * Valida si un string es un ObjectId válido de MongoDB
 */
export function isValidObjectId(id: string | undefined | null): boolean {
  if (!id) return false;
  return Types.ObjectId.isValid(id) && new Types.ObjectId(id).toString() === id;
}

/**
 * Valida el ObjectId y lanza error si es inválido
 */
export function validateObjectId(id: string | undefined | null, fieldName = "ID"): string {
  if (!isValidObjectId(id)) {
    throw new Response(`${fieldName} inválido`, { status: 400 });
  }
  return id!;
}

/**
 * Convierte string a ObjectId de forma segura
 */
export function toObjectId(id: string): Types.ObjectId {
  return new Types.ObjectId(id);
}
