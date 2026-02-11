import { pgTable, text, timestamp, boolean, integer, serial, varchar, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Users - Sistema de autenticación
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: text("password").notNull(),
  nombre: varchar("nombre", { length: 255 }).notNull(),
  apellidos: varchar("apellidos", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).notNull().default("usuario"), // admin, usuario
  activo: boolean("activo").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Members - Miembros/Clientes
export const members = pgTable("members", {
  id: uuid("id").primaryKey().defaultRandom(),
  numeroMiembro: varchar("numero_miembro", { length: 50 }).notNull().unique(),
  nombre: varchar("nombre", { length: 255 }).notNull(),
  apellidos: varchar("apellidos", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  telefono: varchar("telefono", { length: 50 }).notNull(),
  fechaNacimiento: timestamp("fecha_nacimiento"),
  foto: text("foto"),
  notas: text("notas"),
  activo: boolean("activo").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Classes - Clases/Actividades
export const classes = pgTable("classes", {
  id: uuid("id").primaryKey().defaultRandom(),
  nombre: varchar("nombre", { length: 255 }).notNull(),
  descripcion: text("descripcion"),
  nivel: varchar("nivel", { length: 100 }),
  capacidad: integer("capacidad").notNull().default(20),
  duracion: integer("duracion").notNull().default(60), // minutos
  color: varchar("color", { length: 7 }).notNull().default("#3B82F6"),
  activo: boolean("activo").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Instructors - Instructores
export const instructors = pgTable("instructors", {
  id: uuid("id").primaryKey().defaultRandom(),
  nombre: varchar("nombre", { length: 255 }).notNull(),
  apellidos: varchar("apellidos", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  telefono: varchar("telefono", { length: 50 }).notNull(),
  especialidades: text("especialidades").array(),
  foto: text("foto"),
  activo: boolean("activo").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Schedules - Horarios
export const schedules = pgTable("schedules", {
  id: uuid("id").primaryKey().defaultRandom(),
  classId: uuid("class_id").notNull().references(() => classes.id),
  instructorId: uuid("instructor_id").references(() => instructors.id),
  diaSemana: integer("dia_semana").notNull(), // 0-6 (Domingo-Sábado)
  horaInicio: varchar("hora_inicio", { length: 5 }).notNull(), // HH:MM
  horaFin: varchar("hora_fin", { length: 5 }).notNull(), // HH:MM
  carril: varchar("carril", { length: 50 }), // Opcional, para piscinas
  activo: boolean("activo").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Membership Types - Tipos de membresía
export const membershipTypes = pgTable("membership_types", {
  id: uuid("id").primaryKey().defaultRandom(),
  nombre: varchar("nombre", { length: 255 }).notNull(),
  descripcion: text("descripcion"),
  duracion: integer("duracion").notNull(), // días
  precio: integer("precio").notNull(), // centavos
  color: varchar("color", { length: 7 }).notNull().default("#10B981"),
  activo: boolean("activo").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Member Memberships - Membresías de miembros
export const memberMemberships = pgTable("member_memberships", {
  id: uuid("id").primaryKey().defaultRandom(),
  memberId: uuid("member_id").notNull().references(() => members.id),
  membershipTypeId: uuid("membership_type_id").notNull().references(() => membershipTypes.id),
  fechaInicio: timestamp("fecha_inicio").notNull(),
  fechaFin: timestamp("fecha_fin").notNull(),
  activa: boolean("activa").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Enrollments - Inscripciones a clases
export const enrollments = pgTable("enrollments", {
  id: uuid("id").primaryKey().defaultRandom(),
  memberId: uuid("member_id").notNull().references(() => members.id),
  classId: uuid("class_id").notNull().references(() => classes.id),
  fechaInscripcion: timestamp("fecha_inscripcion").notNull().defaultNow(),
  activo: boolean("activo").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Access Logs - Control de acceso
export const accessLogs = pgTable("access_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  memberId: uuid("member_id").notNull().references(() => members.id),
  tipo: varchar("tipo", { length: 20 }).notNull(), // entrada, salida
  fecha: timestamp("fecha").notNull().defaultNow(),
  notas: text("notas"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Audit Logs - Auditoría
export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  accion: varchar("accion", { length: 100 }).notNull(),
  entidad: varchar("entidad", { length: 100 }).notNull(),
  entidadId: varchar("entidad_id", { length: 255 }),
  detalles: text("detalles"),
  fecha: timestamp("fecha").notNull().defaultNow(),
});

// Relations
export const schedulesRelations = relations(schedules, ({ one }) => ({
  class: one(classes, {
    fields: [schedules.classId],
    references: [classes.id],
  }),
  instructor: one(instructors, {
    fields: [schedules.instructorId],
    references: [instructors.id],
  }),
}));

export const memberMembershipsRelations = relations(memberMemberships, ({ one }) => ({
  member: one(members, {
    fields: [memberMemberships.memberId],
    references: [members.id],
  }),
  membershipType: one(membershipTypes, {
    fields: [memberMemberships.membershipTypeId],
    references: [membershipTypes.id],
  }),
}));

export const enrollmentsRelations = relations(enrollments, ({ one }) => ({
  member: one(members, {
    fields: [enrollments.memberId],
    references: [members.id],
  }),
  class: one(classes, {
    fields: [enrollments.classId],
    references: [classes.id],
  }),
}));

export const accessLogsRelations = relations(accessLogs, ({ one }) => ({
  member: one(members, {
    fields: [accessLogs.memberId],
    references: [members.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));
