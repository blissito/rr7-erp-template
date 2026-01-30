import { Schema, model, models, type Document, type Types } from "mongoose";

export interface IEnrollment extends Document {
  _id: Types.ObjectId;
  memberId: Types.ObjectId;
  scheduleId: Types.ObjectId;
  fechaInscripcion: Date;
  estado: "inscrito" | "lista_espera" | "cancelado";
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const enrollmentSchema = new Schema<IEnrollment>(
  {
    memberId: {
      type: Schema.Types.ObjectId,
      ref: "Member",
      required: [true, "El miembro es requerido"],
    },
    scheduleId: {
      type: Schema.Types.ObjectId,
      ref: "Schedule",
      required: [true, "El horario es requerido"],
    },
    fechaInscripcion: {
      type: Date,
      default: Date.now,
    },
    estado: {
      type: String,
      enum: ["inscrito", "lista_espera", "cancelado"],
      default: "inscrito",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

enrollmentSchema.index({ memberId: 1, scheduleId: 1 }, { unique: true });
enrollmentSchema.index({ scheduleId: 1, estado: 1 });

export const Enrollment =
  models.Enrollment || model<IEnrollment>("Enrollment", enrollmentSchema);
