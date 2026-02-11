import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL no está definida en las variables de entorno");
}

// Para queries
const queryClient = postgres(DATABASE_URL);
export const db = drizzle(queryClient, { schema });

// Para migraciones
const migrationClient = postgres(DATABASE_URL, { max: 1 });
export const migrationDb = drizzle(migrationClient, { schema });
