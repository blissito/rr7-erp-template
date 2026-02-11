import { db } from "~/db";
import { instructors } from "~/db/schema";
import { eq } from "drizzle-orm";

export interface IInstructor {
  id: string;
  nombre: string;
  apellidos: string;
  email?: string;
  telefono: string;
  especialidades?: string[];
  foto?: string;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const Instructor = {
  async findById(id: string) {
    const [instructor] = await db.select().from(instructors).where(eq(instructors.id, id));
    return instructor;
  },

  async find(query: { activo?: boolean } = {}) {
    if (query.activo !== undefined) {
      return await db.select().from(instructors).where(eq(instructors.activo, query.activo));
    }
    return await db.select().from(instructors);
  },

  async create(data: Omit<typeof instructors.$inferInsert, "id" | "createdAt" | "updatedAt">) {
    const [instructor] = await db.insert(instructors).values(data).returning();
    return instructor;
  },

  async findByIdAndUpdate(id: string, data: Partial<typeof instructors.$inferInsert>) {
    const [instructor] = await db
      .update(instructors)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(instructors.id, id))
      .returning();
    return instructor;
  },

  async findByIdAndDelete(id: string) {
    const [instructor] = await db.delete(instructors).where(eq(instructors.id, id)).returning();
    return instructor;
  },

  async countDocuments() {
    const result = await db.select().from(instructors);
    return result.length;
  },
};
