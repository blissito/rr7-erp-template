import { Schema, model, models, type Document, type Types } from "mongoose";

export interface IClass extends Document {
  _id: Types.ObjectId;
  nombre: string;
  descripcion?: string;
  duracionMinutos: number;
  capacidadMaxima: number;
  nivel?: "principiante" | "intermedio" | "avanzado";
  edadMinima?: number;
  edadMaxima?: number;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const classSchema = new Schema<IClass>(
  {
    nombre: {
      type: String,
      required: [true, "El nombre es requerido"],
      trim: true,
    },
    descripcion: {
      type: String,
      trim: true,
    },
    duracionMinutos: {
      type: Number,
      required: [true, "La duración es requerida"],
      min: [15, "La duración mínima es 15 minutos"],
    },
    capacidadMaxima: {
      type: Number,
      required: [true, "La capacidad máxima es requerida"],
      min: [1, "La capacidad mínima es 1"],
    },
    nivel: {
      type: String,
      enum: ["principiante", "intermedio", "avanzado"],
    },
    edadMinima: {
      type: Number,
      min: 0,
    },
    edadMaxima: {
      type: Number,
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

classSchema.index({ nombre: "text" });

export const Class = models.Class || model<IClass>("Class", classSchema);
