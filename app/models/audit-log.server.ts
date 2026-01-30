import { Schema, model, models, type Document, type Types } from "mongoose";

export interface IAuditLog extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  userEmail: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    userEmail: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        "create",
        "update",
        "delete",
        "login",
        "logout",
        "toggle_status",
        "assign_membership",
        "enroll",
        "access_granted",
        "access_denied",
      ],
    },
    resource: {
      type: String,
      required: true,
      enum: [
        "user",
        "member",
        "class",
        "instructor",
        "schedule",
        "membership",
        "enrollment",
        "session",
      ],
    },
    resourceId: {
      type: String,
    },
    details: {
      type: Schema.Types.Mixed,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Índices para búsquedas eficientes
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ resource: 1, action: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 });

export const AuditLog = models.AuditLog || model<IAuditLog>("AuditLog", auditLogSchema);

// Helper para crear entradas de auditoría
export async function logAudit(
  request: Request,
  user: { userId: string; email: string },
  action: IAuditLog["action"],
  resource: IAuditLog["resource"],
  resourceId?: string,
  details?: Record<string, unknown>
): Promise<void> {
  const forwarded = request.headers.get("x-forwarded-for");
  const ipAddress = forwarded?.split(",")[0]?.trim() || "unknown";
  const userAgent = request.headers.get("user-agent") || undefined;

  await AuditLog.create({
    userId: user.userId,
    userEmail: user.email,
    action,
    resource,
    resourceId,
    details,
    ipAddress,
    userAgent,
  });
}
