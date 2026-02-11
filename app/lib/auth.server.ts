import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User, type IUser } from "~/models/user.server";

// Validar secretos obligatorios en producción
function getJWTSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET es obligatorio en producción");
  }
  return secret || "dev-secret-only-for-development";
}

const JWT_SECRET = getJWTSecret();
const JWT_ACCESS_EXPIRES = "15m"; // Access token de corta duración
const JWT_REFRESH_EXPIRES = "7d"; // Refresh token de larga duración

export interface JWTPayload {
  userId: string;
  email: string;
  rol: string;
  type?: "access" | "refresh";
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateAccessToken(payload: Omit<JWTPayload, "type">): string {
  return jwt.sign({ ...payload, type: "access" }, JWT_SECRET, {
    expiresIn: JWT_ACCESS_EXPIRES,
  });
}

export function generateRefreshToken(payload: Omit<JWTPayload, "type">): string {
  return jwt.sign({ ...payload, type: "refresh" }, JWT_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES,
  });
}

export function generateTokenPair(payload: Omit<JWTPayload, "type">): TokenPair {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
}

// Mantener compatibilidad temporal
export function generateToken(payload: Omit<JWTPayload, "type">): string {
  return generateAccessToken(payload);
}

export function verifyToken(token: string, expectedType: "access" | "refresh" = "access"): JWTPayload | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JWTPayload;
    // Verificar tipo de token si está especificado
    if (payload.type && payload.type !== expectedType) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): JWTPayload | null {
  return verifyToken(token, "refresh");
}

export async function authenticateUser(
  email: string,
  password: string
): Promise<{ user: IUser; tokens: TokenPair } | null> {
  // @ts-ignore - Drizzle compatibility
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || !user.activo) {
    return null;
  }

  const isValid = await verifyPassword(password, user.password);
  if (!isValid) {
    return null;
  }

  const tokens = generateTokenPair({
    userId: user.id,
    email: user.email,
    rol: user.role,
  });

  return { user, tokens };
}

export async function createUser(data: {
  email: string;
  password: string;
  nombre: string;
  apellidos?: string;
  rol?: "admin" | "usuario";
}): Promise<IUser> {

  const hashedPassword = await hashPassword(data.password);

  // @ts-ignore - Drizzle compatibility
  const user = await User.create({
    email: data.email.toLowerCase(),
    password: hashedPassword,
    nombre: data.nombre,
    apellidos: data.apellidos || "",
    role: data.rol || "usuario",
    activo: true,
  });

  return user;
}

export async function getUserById(userId: string): Promise<IUser | null> {
  return User.findById(userId);
}

export async function getUserByEmail(email: string): Promise<IUser | null> {
  return User.findOne({ email: email.toLowerCase() });
}
