import { Schema, model, models, type Document, type Types } from "mongoose";

export interface ISchedule extends Document {
  _id: Types.ObjectId;
  classId: Types.ObjectId;
  instructorId: Types.ObjectId;
  diaSemana: number;
  horaInicio: string;
  horaFin: string;
  carril?: number;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const scheduleSchema = new Schema<ISchedule>(
  {
    classId: {
      type: Schema.Types.ObjectId,
      ref: "Class",
      required: [true, "La clase es requerida"],
    },
    instructorId: {
      type: Schema.Types.ObjectId,
      ref: "Instructor",
      required: [true, "El instructor es requerido"],
    },
    diaSemana: {
      type: Number,
      required: [true, "El día de la semana es requerido"],
      min: 0,
      max: 6,
    },
    horaInicio: {
      type: String,
      required: [true, "La hora de inicio es requerida"],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato de hora inválido (HH:MM)"],
    },
    horaFin: {
      type: String,
      required: [true, "La hora de fin es requerida"],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato de hora inválido (HH:MM)"],
    },
    // Optional domain-specific field (example: lane for pools)
    // Controlled by ENABLE_CARRIL env variable
    carril: {
      type: Number,
      min: 1,
    },
    activo: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

scheduleSchema.index({ classId: 1 });
scheduleSchema.index({ instructorId: 1 });
scheduleSchema.index({ diaSemana: 1, horaInicio: 1 });

export const Schedule =
  models.Schedule || model<ISchedule>("Schedule", scheduleSchema);
