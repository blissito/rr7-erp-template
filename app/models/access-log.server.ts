import { Schema, model, models, type Document, type Types } from "mongoose";

export interface IAccessLog extends Document {
  _id: Types.ObjectId;
  memberId: Types.ObjectId;
  tipo: "entrada" | "salida";
  fecha: Date;
  registradoPor: Types.ObjectId;
  notas?: string;
  createdAt: Date;
}

const accessLogSchema = new Schema<IAccessLog>(
  {
    memberId: {
      type: Schema.Types.ObjectId,
      ref: "Member",
      required: [true, "El miembro es requerido"],
    },
    tipo: {
      type: String,
      enum: ["entrada", "salida"],
      required: [true, "El tipo es requerido"],
    },
    fecha: {
      type: Date,
      default: Date.now,
    },
    registradoPor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    notas: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

accessLogSchema.index({ memberId: 1, fecha: -1 });
accessLogSchema.index({ fecha: -1 });
accessLogSchema.index({ tipo: 1, fecha: -1 });

export const AccessLog =
  models.AccessLog || model<IAccessLog>("AccessLog", accessLogSchema);
