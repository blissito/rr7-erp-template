import { db } from "~/db";
import { enrollments, members, classes } from "~/db/schema";
import { eq } from "drizzle-orm";

export interface IEnrollment {
  id: string;
  memberId: string;
  classId: string;
  fechaInscripcion: Date;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const Enrollment = {
  async find(query: { classId?: string; activo?: boolean } = {}) {
    let where = query.activo !== undefined ? eq(enrollments.activo, query.activo) : undefined;

    if (query.classId) {
      where = eq(enrollments.classId, query.classId);
    }

    const result = await db
      .select({
        enrollment: enrollments,
        member: members,
      })
      .from(enrollments)
      .leftJoin(members, eq(enrollments.memberId, members.id))
      .where(where);

    return result;
  },

  async create(data: Omit<typeof enrollments.$inferInsert, "id" | "createdAt" | "updatedAt">) {
    const [enrollment] = await db.insert(enrollments).values(data).returning();
    return enrollment;
  },

  async countDocuments() {
    const result = await db.select().from(enrollments);
    return result.length;
  },

  populate(field: string) {
    return this;
  },
};
