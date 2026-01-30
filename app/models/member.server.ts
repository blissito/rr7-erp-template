import { Schema, model, models, type Document, type Types } from "mongoose";

export interface IMember extends Document {
  _id: Types.ObjectId;
  numeroMiembro: string;
  nombre: string;
  apellidos: string;
  email?: string;
  telefono: string;
  fechaNacimiento?: Date;
  foto?: string;
  notas?: string;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const memberSchema = new Schema<IMember>(
  {
    numeroMiembro: {
      type: String,
      required: [true, "El número de miembro es requerido"],
      unique: true,
    },
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
    email: {
      type: String,
      lowercase: true,
      trim: true,
      sparse: true,
    },
    telefono: {
      type: String,
      required: [true, "El teléfono es requerido"],
      trim: true,
    },
    fechaNacimiento: {
      type: Date,
    },
    foto: {
      type: String,
    },
    notas: {
      type: String,
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

memberSchema.index({ numeroMiembro: 1 });
memberSchema.index({ nombre: "text", apellidos: "text" });
memberSchema.index({ telefono: 1 });

memberSchema.virtual("nombreCompleto").get(function () {
  return `${this.nombre} ${this.apellidos}`;
});

memberSchema.set("toJSON", { virtuals: true });
memberSchema.set("toObject", { virtuals: true });

export const Member = models.Member || model<IMember>("Member", memberSchema);
