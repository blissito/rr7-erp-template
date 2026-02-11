import { db } from "~/db";
import { auditLogs, users } from "~/db/schema";
import { eq, desc } from "drizzle-orm";

export interface IAuditLog {
  id: string;
  userId: string;
  accion: string;
  entidad: string;
  entidadId?: string;
  detalles?: string;
  fecha: Date;
}

export const AuditLog = {
  async create(data: Omit<typeof auditLogs.$inferInsert, "id">) {
    const [log] = await db.insert(auditLogs).values(data).returning();
    return log;
  },

  async find(query: any = {}) {
    return await db
      .select({
        log: auditLogs,
        user: users,
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.id))
      .orderBy(desc(auditLogs.fecha))
      .limit(query.limit || 100);
  },

  populate(field: string) {
    return this;
  },

  sort(field: string) {
    return this;
  },

  limit(n: number) {
    return this;
  },
};

// Helper function for logging audit actions
export async function logAudit(
  request: Request,
  user: { id: string; email: string },
  accion: string,
  entidad: string,
  entidadId: string,
  detalles: any = {}
) {
  try {
    await AuditLog.create({
      userId: user.id,
      accion,
      entidad,
      entidadId,
      detalles: JSON.stringify(detalles),
    });
  } catch (error) {
    console.error("Error logging audit:", error);
  }
}
