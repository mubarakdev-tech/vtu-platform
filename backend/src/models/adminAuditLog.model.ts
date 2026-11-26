import mongoose, { Schema } from "mongoose";

export interface IAdminAuditLog extends mongoose.Document {
  actor?: mongoose.Types.ObjectId | null;
  failureReason?: string;
  actorName: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  resource: string;
  method: string;
  statusCode: number;
  ipAddress?: string;
  userAgent?: string;
  changedFields: string[];
  createdAt: Date;
}

const adminAuditLogSchema = new Schema<IAdminAuditLog>(
  {
    actor: { type: Schema.Types.ObjectId, ref: "User", required: false, default: null, index: true },
    failureReason: { type: String, index: true },
    actorName: { type: String, required: true },
    actorEmail: { type: String, required: true, lowercase: true, index: true },
    actorRole: { type: String, required: true },
    action: { type: String, required: true, index: true },
    resource: { type: String, required: true, index: true },
    method: { type: String, required: true },
    statusCode: { type: Number, required: true },
    ipAddress: { type: String },
    userAgent: { type: String },
    changedFields: { type: [String], default: [] },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

adminAuditLogSchema.index({ createdAt: -1 });

const AdminAuditLog = mongoose.models.AdminAuditLog ||
  mongoose.model<IAdminAuditLog>("AdminAuditLog", adminAuditLogSchema);

export default AdminAuditLog;
