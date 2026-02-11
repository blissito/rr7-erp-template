import { db } from "~/db";
import { classes } from "~/db/schema";
import { eq } from "drizzle-orm";

export interface IClass {
  id: string;
  nombre: string;
  descripcion?: string;
  nivel?: string;
  capacidad: number;
  duracion: number;
  color: string;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const Class = {
  async findById(id: string) {
    const [classItem] = await db.select().from(classes).where(eq(classes.id, id));
    return classItem;
  },

  async find(query: { activo?: boolean } = {}) {
    if (query.activo !== undefined) {
      return await db.select().from(classes).where(eq(classes.activo, query.activo));
    }
    return await db.select().from(classes);
  },

  async create(data: Omit<typeof classes.$inferInsert, "id" | "createdAt" | "updatedAt">) {
    const [classItem] = await db.insert(classes).values(data).returning();
    return classItem;
  },

  async findByIdAndUpdate(id: string, data: Partial<typeof classes.$inferInsert>) {
    const [classItem] = await db
      .update(classes)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(classes.id, id))
      .returning();
    return classItem;
  },

  async findByIdAndDelete(id: string) {
    const [classItem] = await db.delete(classes).where(eq(classes.id, id)).returning();
    return classItem;
  },

  async countDocuments() {
    const result = await db.select().from(classes);
    return result.length;
  },
};
