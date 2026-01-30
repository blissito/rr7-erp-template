// Rate limiting en memoria para protección contra fuerza bruta
// En producción, considerar usar Redis para entornos multi-instancia

interface RateLimitEntry {
  count: number;
  firstAttempt: number;
  blockedUntil?: number;
}

const loginAttempts = new Map<string, RateLimitEntry>();

const CONFIG = {
  maxAttempts: 5,           // Máximo intentos permitidos
  windowMs: 15 * 60 * 1000, // Ventana de 15 minutos
  blockDurationMs: 30 * 60 * 1000, // Bloqueo de 30 minutos
};

function getClientIdentifier(request: Request): string {
  // Usar IP del cliente (considerar X-Forwarded-For en producción)
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";
  return ip;
}

export interface RateLimitResult {
  allowed: boolean;
  remainingAttempts: number;
  blockedUntil?: Date;
  message?: string;
}

export function checkRateLimit(request: Request): RateLimitResult {
  const identifier = getClientIdentifier(request);
  const now = Date.now();
  const entry = loginAttempts.get(identifier);

  // Si no hay entrada, permitir
  if (!entry) {
    return { allowed: true, remainingAttempts: CONFIG.maxAttempts };
  }

  // Si está bloqueado, verificar si el bloqueo expiró
  if (entry.blockedUntil) {
    if (now < entry.blockedUntil) {
      return {
        allowed: false,
        remainingAttempts: 0,
        blockedUntil: new Date(entry.blockedUntil),
        message: `Demasiados intentos fallidos. Intenta de nuevo en ${Math.ceil((entry.blockedUntil - now) / 60000)} minutos.`,
      };
    }
    // Bloqueo expirado, resetear
    loginAttempts.delete(identifier);
    return { allowed: true, remainingAttempts: CONFIG.maxAttempts };
  }

  // Verificar si la ventana expiró
  if (now - entry.firstAttempt > CONFIG.windowMs) {
    loginAttempts.delete(identifier);
    return { allowed: true, remainingAttempts: CONFIG.maxAttempts };
  }

  // Verificar si excedió el límite
  if (entry.count >= CONFIG.maxAttempts) {
    entry.blockedUntil = now + CONFIG.blockDurationMs;
    return {
      allowed: false,
      remainingAttempts: 0,
      blockedUntil: new Date(entry.blockedUntil),
      message: `Demasiados intentos fallidos. Intenta de nuevo en ${Math.ceil(CONFIG.blockDurationMs / 60000)} minutos.`,
    };
  }

  return {
    allowed: true,
    remainingAttempts: CONFIG.maxAttempts - entry.count,
  };
}

export function recordFailedAttempt(request: Request): void {
  const identifier = getClientIdentifier(request);
  const now = Date.now();
  const entry = loginAttempts.get(identifier);

  if (!entry) {
    loginAttempts.set(identifier, {
      count: 1,
      firstAttempt: now,
    });
    return;
  }

  // Si la ventana expiró, resetear
  if (now - entry.firstAttempt > CONFIG.windowMs) {
    loginAttempts.set(identifier, {
      count: 1,
      firstAttempt: now,
    });
    return;
  }

  entry.count++;
}

export function clearFailedAttempts(request: Request): void {
  const identifier = getClientIdentifier(request);
  loginAttempts.delete(identifier);
}

// Limpiar entradas antiguas cada hora para evitar memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of loginAttempts.entries()) {
    const isExpired = now - entry.firstAttempt > CONFIG.windowMs;
    const isUnblocked = entry.blockedUntil && now > entry.blockedUntil;
    if (isExpired || isUnblocked) {
      loginAttempts.delete(key);
    }
  }
}, 60 * 60 * 1000);
