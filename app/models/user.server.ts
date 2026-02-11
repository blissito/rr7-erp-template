import { db } from "~/db";
import { users } from "~/db/schema";
import { eq } from "drizzle-orm";

export interface IUser {
  id: string;
  email: string;
  password: string;
  nombre: string;
  apellidos: string;
  role: string;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const User = {
  async findOne(query: { email?: string; id?: string }) {
    if (query.email) {
      const [user] = await db.select().from(users).where(eq(users.email, query.email));
      return user;
    }
    if (query.id) {
      const [user] = await db.select().from(users).where(eq(users.id, query.id));
      return user;
    }
    return null;
  },

  async findById(id: string) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  },

  async create(data: Omit<typeof users.$inferInsert, "id" | "createdAt" | "updatedAt">) {
    const [user] = await db.insert(users).values(data).returning();
    return user;
  },

  async findByIdAndUpdate(id: string, data: Partial<typeof users.$inferInsert>) {
    const [user] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  },

  async find(query: Partial<typeof users.$inferSelect> = {}) {
    return await db.select().from(users);
  },

  async countDocuments(query: any = {}) {
    const result = await db.select().from(users);
    return result.length;
  },
};
