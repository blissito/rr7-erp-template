import { db } from "~/db";
import { accessLogs, members } from "~/db/schema";
import { eq, desc, and, gte, lte } from "drizzle-orm";

export interface IAccessLog {
  id: string;
  memberId: string;
  tipo: string;
  fecha: Date;
  notas?: string;
  createdAt: Date;
}

export const AccessLog = {
  async find(query: any = {}) {
    return await db
      .select({
        log: accessLogs,
        member: members,
      })
      .from(accessLogs)
      .leftJoin(members, eq(accessLogs.memberId, members.id))
      .orderBy(desc(accessLogs.fecha))
      .limit(query.limit || 100);
  },

  async create(data: Omit<typeof accessLogs.$inferInsert, "id" | "createdAt">) {
    const [log] = await db.insert(accessLogs).values(data).returning();
    return log;
  },

  async countDocuments(query: { fecha?: any } = {}) {
    let result = await db.select().from(accessLogs);

    if (query.fecha?.$gte && query.fecha?.$lte) {
      result = result.filter(
        log => log.fecha >= query.fecha.$gte && log.fecha <= query.fecha.$lte
      );
    }

    return result.length;
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
