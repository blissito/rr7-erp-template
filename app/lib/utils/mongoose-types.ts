import type { Document } from "mongoose";
import type { IMember } from "~/models/member.server";
import type { IClass } from "~/models/class.server";
import type { IInstructor } from "~/models/instructor.server";
import type { IMemberMembership } from "~/models/member-membership.server";
import type { ISchedule } from "~/models/schedule.server";

// Helper generico para tipar resultados de .lean()
// .lean() devuelve POJOs sin los metodos de Mongoose Document
export function asLean<T>(doc: unknown): T {
  return doc as T;
}

// Tipos para resultados lean (sin metodos de Mongoose)
// Omitimos las propiedades del Document de Mongoose que no estan en el POJO
type DocumentMethods = keyof Document;

export type LeanMember = Omit<IMember, DocumentMethods>;
export type LeanClass = Omit<IClass, DocumentMethods>;
export type LeanInstructor = Omit<IInstructor, DocumentMethods>;
export type LeanMemberMembership = Omit<IMemberMembership, DocumentMethods>;
export type LeanSchedule = Omit<ISchedule, DocumentMethods>;

// Tipo para resultados de populate (el campo poblado es un objeto completo)
export interface PopulatedMemberMembership extends Omit<LeanMemberMembership, "membershipTypeId" | "createdBy" | "memberId"> {
  membershipTypeId: { _id: string; nombre: string } | null;
  createdBy: { _id: string; nombre: string } | null;
  memberId: LeanMember | null;
}

export interface PopulatedSchedule extends Omit<LeanSchedule, "classId" | "instructorId"> {
  classId: LeanClass | null;
  instructorId: LeanInstructor | null;
}

export interface PopulatedEnrollment {
  _id: string;
  memberId: LeanMember | null;
  scheduleId: PopulatedSchedule | null;
  estado: string;
}
