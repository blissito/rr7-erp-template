import { createCookie, redirect } from "react-router";
import { verifyToken, verifyRefreshToken, generateAccessToken, type JWTPayload, type TokenPair } from "./auth.server";

// Validar secretos obligatorios en producción
function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET es obligatorio en producción");
  }
  return secret || "dev-session-secret-only-for-development";
}

const SESSION_SECRET = getSessionSecret();

const accessCookie = createCookie("__access", {
  httpOnly: true,
  maxAge: 60 * 15, // 15 minutos
  path: "/",
  sameSite: "lax",
  secrets: [SESSION_SECRET],
  secure: process.env.NODE_ENV === "production",
});

const refreshCookie = createCookie("__refresh", {
  httpOnly: true,
  maxAge: 60 * 60 * 24 * 7, // 7 días
  path: "/",
  sameSite: "lax",
  secrets: [SESSION_SECRET],
  secure: process.env.NODE_ENV === "production",
});

export async function createUserSession(tokens: TokenPair, redirectTo: string) {
  const headers = new Headers();
  headers.append("Set-Cookie", await accessCookie.serialize(tokens.accessToken));
  headers.append("Set-Cookie", await refreshCookie.serialize(tokens.refreshToken));

  return redirect(redirectTo, { headers });
}

interface SessionResult {
  payload: JWTPayload;
  newAccessToken?: string;
}

export async function getUserSession(request: Request): Promise<SessionResult | null> {
  const cookieHeader = request.headers.get("Cookie");

  // Intentar con access token primero
  const accessToken = await accessCookie.parse(cookieHeader);
  if (accessToken) {
    const payload = verifyToken(accessToken, "access");
    if (payload) {
      return { payload };
    }
  }

  // Si access token expiró, intentar refresh
  const refreshToken = await refreshCookie.parse(cookieHeader);
  if (refreshToken) {
    const payload = verifyRefreshToken(refreshToken);
    if (payload) {
      // Generar nuevo access token
      const newAccessToken = generateAccessToken({
        userId: payload.userId,
        email: payload.email,
        rol: payload.rol,
      });
      return { payload, newAccessToken };
    }
  }

  return null;
}

export interface RequireUserResult {
  user: JWTPayload;
  headers?: Headers;
}

export async function requireUser(request: Request): Promise<RequireUserResult> {
  const session = await getUserSession(request);

  if (!session) {
    throw redirect("/login");
  }

  // Si hay nuevo access token, incluir en headers para actualizar cookie
  let headers: Headers | undefined;
  if (session.newAccessToken) {
    headers = new Headers();
    headers.set("Set-Cookie", await accessCookie.serialize(session.newAccessToken));
  }

  return { user: session.payload, headers };
}

export async function requireAdmin(request: Request): Promise<RequireUserResult> {
  const result = await requireUser(request);

  if (result.user.rol !== "admin") {
    throw redirect("/");
  }

  return result;
}

export async function logout(request: Request) {
  const headers = new Headers();
  headers.append("Set-Cookie", await accessCookie.serialize("", { maxAge: 0 }));
  headers.append("Set-Cookie", await refreshCookie.serialize("", { maxAge: 0 }));

  return redirect("/login", { headers });
}

export async function getOptionalUser(request: Request): Promise<JWTPayload | null> {
  const session = await getUserSession(request);
  return session?.payload ?? null;
}
