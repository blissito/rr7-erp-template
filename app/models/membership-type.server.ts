import { Schema, model, models, type Document, type Types } from "mongoose";

export interface IMembershipType extends Document {
  _id: Types.ObjectId;
  nombre: string;
  duracionDias: number;
  precio: number;
  descripcion?: string;
  accesosIncluidos?: number;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const membershipTypeSchema = new Schema<IMembershipType>(
  {
    nombre: {
      type: String,
      required: [true, "El nombre es requerido"],
      trim: true,
    },
    duracionDias: {
      type: Number,
      required: [true, "La duración es requerida"],
      min: [1, "La duración mínima es 1 día"],
    },
    precio: {
      type: Number,
      required: [true, "El precio es requerido"],
      min: [0, "El precio no puede ser negativo"],
    },
    descripcion: {
      type: String,
      trim: true,
    },
    accesosIncluidos: {
      type: Number,
      default: null,
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

export const MembershipType =
  models.MembershipType ||
  model<IMembershipType>("MembershipType", membershipTypeSchema);
