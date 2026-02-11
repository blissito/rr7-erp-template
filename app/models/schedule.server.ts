import { db } from "~/db";
import { schedules, classes, instructors } from "~/db/schema";
import { eq } from "drizzle-orm";

export interface ISchedule {
  id: string;
  classId: string;
  instructorId?: string;
  diaSemana: number;
  horaInicio: string;
  horaFin: string;
  carril?: string;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const Schedule = {
  async find(query: { activo?: boolean } = {}) {
    if (query.activo !== undefined) {
      return await db
        .select({
          schedule: schedules,
          class: classes,
          instructor: instructors,
        })
        .from(schedules)
        .leftJoin(classes, eq(schedules.classId, classes.id))
        .leftJoin(instructors, eq(schedules.instructorId, instructors.id))
        .where(eq(schedules.activo, query.activo));
    }
    return await db
      .select({
        schedule: schedules,
        class: classes,
        instructor: instructors,
      })
      .from(schedules)
      .leftJoin(classes, eq(schedules.classId, classes.id))
      .leftJoin(instructors, eq(schedules.instructorId, instructors.id));
  },

  async create(data: Omit<typeof schedules.$inferInsert, "id" | "createdAt" | "updatedAt">) {
    const [schedule] = await db.insert(schedules).values(data).returning();
    return schedule;
  },

  async findByIdAndDelete(id: string) {
    const [schedule] = await db.delete(schedules).where(eq(schedules.id, id)).returning();
    return schedule;
  },

  async findByIdAndUpdate(id: string, data: Partial<typeof schedules.$inferInsert>) {
    const [schedule] = await db
      .update(schedules)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schedules.id, id))
      .returning();
    return schedule;
  },

  populate(field: string) {
    return this;
  },
};
