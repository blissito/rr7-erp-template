import { db } from "~/db";
import { memberMemberships, members, membershipTypes } from "~/db/schema";
import { eq, and, gte } from "drizzle-orm";

export interface IMemberMembership {
  id: string;
  memberId: string;
  membershipTypeId: string;
  fechaInicio: Date;
  fechaFin: Date;
  activa: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const MemberMembership = {
  async findOne(query: { memberId?: string; activa?: boolean }) {
    let conditions = [];

    if (query.memberId) {
      conditions.push(eq(memberMemberships.memberId, query.memberId));
    }
    if (query.activa !== undefined) {
      conditions.push(eq(memberMemberships.activa, query.activa));
    }

    if (conditions.length === 0) return null;

    const [membership] = await db
      .select()
      .from(memberMemberships)
      .where(conditions.length > 1 ? and(...conditions) : conditions[0]);

    return membership;
  },

  async find(query: { memberId?: string } = {}) {
    if (query.memberId) {
      return await db
        .select({
          membership: memberMemberships,
          membershipType: membershipTypes,
        })
        .from(memberMemberships)
        .leftJoin(membershipTypes, eq(memberMemberships.membershipTypeId, membershipTypes.id))
        .where(eq(memberMemberships.memberId, query.memberId));
    }
    return await db.select().from(memberMemberships);
  },

  async create(data: Omit<typeof memberMemberships.$inferInsert, "id" | "createdAt" | "updatedAt">) {
    const [membership] = await db.insert(memberMemberships).values(data).returning();
    return membership;
  },

  async countDocuments(query: { activa?: boolean; fechaFin?: any } = {}) {
    let result = await db.select().from(memberMemberships);

    if (query.activa !== undefined) {
      result = result.filter(m => m.activa === query.activa);
    }
    if (query.fechaFin?.$gte) {
      result = result.filter(m => m.fechaFin >= query.fechaFin.$gte);
    }

    return result.length;
  },

  populate(field: string) {
    return this;
  },
};
