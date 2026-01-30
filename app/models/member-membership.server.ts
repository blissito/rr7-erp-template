import { Schema, model, models, type Document, type Types } from "mongoose";

export interface IMemberMembership extends Document {
  _id: Types.ObjectId;
  memberId: Types.ObjectId;
  membershipTypeId: Types.ObjectId;
  fechaInicio: Date;
  fechaFin: Date;
  estado: "activa" | "vencida" | "cancelada";
  montoPagado: number;
  metodoPago: "efectivo" | "tarjeta" | "transferencia";
  notas?: string;
  createdAt: Date;
  createdBy: Types.ObjectId;
}

const memberMembershipSchema = new Schema<IMemberMembership>(
  {
    memberId: {
      type: Schema.Types.ObjectId,
      ref: "Member",
      required: [true, "El miembro es requerido"],
    },
    membershipTypeId: {
      type: Schema.Types.ObjectId,
      ref: "MembershipType",
      required: [true, "El tipo de membresía es requerido"],
    },
    fechaInicio: {
      type: Date,
      required: [true, "La fecha de inicio es requerida"],
    },
    fechaFin: {
      type: Date,
      required: [true, "La fecha de fin es requerida"],
    },
    estado: {
      type: String,
      enum: ["activa", "vencida", "cancelada"],
      default: "activa",
    },
    montoPagado: {
      type: Number,
      required: [true, "El monto pagado es requerido"],
      min: [0, "El monto no puede ser negativo"],
    },
    metodoPago: {
      type: String,
      enum: ["efectivo", "tarjeta", "transferencia"],
      required: [true, "El método de pago es requerido"],
    },
    notas: {
      type: String,
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

memberMembershipSchema.index({ memberId: 1 });
memberMembershipSchema.index({ estado: 1 });
memberMembershipSchema.index({ fechaFin: 1 });

export const MemberMembership =
  models.MemberMembership ||
  model<IMemberMembership>("MemberMembership", memberMembershipSchema);
