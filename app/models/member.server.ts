import { db } from "~/db";
import { members } from "~/db/schema";
import { eq, ilike, or, sql } from "drizzle-orm";

export interface IMember {
  id: string;
  numeroMiembro: string;
  nombre: string;
  apellidos: string;
  email?: string;
  telefono: string;
  fechaNacimiento?: Date;
  foto?: string;
  notas?: string;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const Member = {
  async findById(id: string) {
    const [member] = await db.select().from(members).where(eq(members.id, id));
    return member;
  },

  async findOne(query: { numeroMiembro?: string; email?: string }) {
    if (query.numeroMiembro) {
      const [member] = await db
        .select()
        .from(members)
        .where(eq(members.numeroMiembro, query.numeroMiembro));
      return member;
    }
    if (query.email) {
      const [member] = await db.select().from(members).where(eq(members.email, query.email));
      return member;
    }
    return null;
  },

  async find(query: { activo?: boolean } = {}) {
    if (query.activo !== undefined) {
      return await db.select().from(members).where(eq(members.activo, query.activo));
    }
    return await db.select().from(members);
  },

  async create(data: Omit<typeof members.$inferInsert, "id" | "createdAt" | "updatedAt">) {
    const [member] = await db.insert(members).values(data).returning();
    return member;
  },

  async findByIdAndUpdate(id: string, data: Partial<typeof members.$inferInsert>) {
    const [member] = await db
      .update(members)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(members.id, id))
      .returning();
    return member;
  },

  async findByIdAndDelete(id: string) {
    const [member] = await db.delete(members).where(eq(members.id, id)).returning();
    return member;
  },

  async countDocuments(query: any = {}) {
    const result = await db.select().from(members);
    return result.length;
  },

  async search(searchTerm: string) {
    return await db
      .select()
      .from(members)
      .where(
        or(
          ilike(members.nombre, `%${searchTerm}%`),
          ilike(members.apellidos, `%${searchTerm}%`),
          ilike(members.telefono, `%${searchTerm}%`)
        )
      );
  },
};
