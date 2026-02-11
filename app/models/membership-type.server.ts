import { db } from "~/db";
import { membershipTypes } from "~/db/schema";
import { eq } from "drizzle-orm";

export interface IMembershipType {
  id: string;
  nombre: string;
  descripcion?: string;
  duracion: number;
  precio: number;
  color: string;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const MembershipType = {
  async find(query: { activo?: boolean } = {}) {
    if (query.activo !== undefined) {
      return await db.select().from(membershipTypes).where(eq(membershipTypes.activo, query.activo));
    }
    return await db.select().from(membershipTypes);
  },

  async findById(id: string) {
    const [type] = await db.select().from(membershipTypes).where(eq(membershipTypes.id, id));
    return type;
  },

  async create(data: Omit<typeof membershipTypes.$inferInsert, "id" | "createdAt" | "updatedAt">) {
    const [type] = await db.insert(membershipTypes).values(data).returning();
    return type;
  },

  async findByIdAndUpdate(id: string, data: Partial<typeof membershipTypes.$inferInsert>) {
    const [type] = await db
      .update(membershipTypes)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(membershipTypes.id, id))
      .returning();
    return type;
  },

  async findByIdAndDelete(id: string) {
    const [type] = await db.delete(membershipTypes).where(eq(membershipTypes.id, id)).returning();
    return type;
  },
};
