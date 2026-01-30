import { z } from "zod";

export const emailSchema = z
  .string()
  .email("Email inválido")
  .min(1, "El email es requerido");

export const passwordSchema = z
  .string()
  .min(8, "La contraseña debe tener al menos 8 caracteres")
  .regex(/[A-Z]/, "La contraseña debe tener al menos una mayúscula")
  .regex(/[a-z]/, "La contraseña debe tener al menos una minúscula")
  .regex(/[0-9]/, "La contraseña debe tener al menos un número")
  .regex(/[^A-Za-z0-9]/, "La contraseña debe tener al menos un carácter especial");

export const phoneSchema = z
  .string()
  .min(10, "El teléfono debe tener al menos 10 dígitos")
  .regex(/^[\d\s\-\(\)]+$/, "Teléfono inválido");

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const memberSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  apellidos: z.string().min(1, "Los apellidos son requeridos"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  telefono: phoneSchema,
  fechaNacimiento: z.string().optional(),
  notas: z.string().optional(),
});

export const membershipTypeSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  duracionDias: z.coerce.number().min(1, "La duración debe ser al menos 1 día"),
  precio: z.coerce.number().min(0, "El precio no puede ser negativo"),
  descripcion: z.string().optional(),
  accesosIncluidos: z.coerce.number().optional(),
});

export const newMembershipSchema = z.object({
  membershipTypeId: z.string().min(1, "Selecciona un tipo de membresía"),
  metodoPago: z.enum(["efectivo", "tarjeta", "transferencia"]),
  montoPagado: z.coerce.number().min(0),
  notas: z.string().optional(),
});

export const classSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  descripcion: z.string().optional(),
  duracionMinutos: z.coerce.number().min(15, "Mínimo 15 minutos"),
  capacidadMaxima: z.coerce.number().min(1, "Mínimo 1 persona"),
  nivel: z.enum(["principiante", "intermedio", "avanzado"]).optional(),
  edadMinima: z.coerce.number().optional(),
  edadMaxima: z.coerce.number().optional(),
});

export const instructorSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  apellidos: z.string().min(1, "Los apellidos son requeridos"),
  telefono: phoneSchema,
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  especialidades: z.array(z.string()).optional(),
});

export const scheduleSchema = z.object({
  classId: z.string().min(1, "La clase es requerida"),
  instructorId: z.string().min(1, "El instructor es requerido"),
  diaSemana: z.coerce.number().min(0).max(6),
  horaInicio: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Hora inválida"),
  horaFin: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Hora inválida"),
  carril: z.coerce.number().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type MemberInput = z.infer<typeof memberSchema>;
export type MembershipTypeInput = z.infer<typeof membershipTypeSchema>;
export type NewMembershipInput = z.infer<typeof newMembershipSchema>;
export type ClassInput = z.infer<typeof classSchema>;
export type InstructorInput = z.infer<typeof instructorSchema>;
export type ScheduleInput = z.infer<typeof scheduleSchema>;
