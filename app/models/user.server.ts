import { Schema, model, models, type Document, type Types } from "mongoose";

export interface IUser extends Document {
  _id: Types.ObjectId;
  email: string;
  passwordHash: string;
  nombre: string;
  rol: "admin" | "recepcion" | "instructor";
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, "El email es requerido"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: [true, "La contraseña es requerida"],
    },
    nombre: {
      type: String,
      required: [true, "El nombre es requerido"],
      trim: true,
    },
    rol: {
      type: String,
      enum: ["admin", "recepcion", "instructor"],
      default: "recepcion",
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

userSchema.index({ email: 1 });

export const User = models.User || model<IUser>("User", userSchema);
