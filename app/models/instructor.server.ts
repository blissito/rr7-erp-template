import { Schema, model, models, type Document, type Types } from "mongoose";

export interface IInstructor extends Document {
  _id: Types.ObjectId;
  nombre: string;
  apellidos: string;
  telefono: string;
  email?: string;
  especialidades: string[];
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const instructorSchema = new Schema<IInstructor>(
  {
    nombre: {
      type: String,
      required: [true, "El nombre es requerido"],
      trim: true,
    },
    apellidos: {
      type: String,
      required: [true, "Los apellidos son requeridos"],
      trim: true,
    },
    telefono: {
      type: String,
      required: [true, "El teléfono es requerido"],
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    especialidades: {
      type: [String],
      default: [],
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

instructorSchema.virtual("nombreCompleto").get(function () {
  return `${this.nombre} ${this.apellidos}`;
});

instructorSchema.set("toJSON", { virtuals: true });
instructorSchema.set("toObject", { virtuals: true });

export const Instructor =
  models.Instructor || model<IInstructor>("Instructor", instructorSchema);
