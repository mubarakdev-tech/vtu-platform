import { Request } from "express";
import AdminAuditLog from "../models/adminAuditLog.model";
import logger from "./logger";

export const writeAdminAuditLog = async (args: {
  actor: any;
  action: string;
  resource: string;
  method?: string;
  statusCode?: number;
  req?: Request;
  changedFields?: string[];
}) => {
  const { actor, action, resource, req } = args;
  if (!actor?._id || !["admin", "super_admin"].includes(String(actor.role))) return;

  try {
    await AdminAuditLog.create({
      actor: actor._id,
      actorName: String(actor.name || "Admin"),
      actorEmail: String(actor.email || "").toLowerCase(),
      actorRole: String(actor.role),
      action,
      resource,
      method: args.method || req?.method || "SYSTEM",
      statusCode: args.statusCode ?? 200,
      ipAddress: req?.ip,
      userAgent: req?.get("user-agent")?.slice(0, 500),
      changedFields: (args.changedFields || []).slice(0, 25),
    });
  } catch (error) {
    logger.error("Admin audit log write failed", { action, resource, error });
    throw error;
  }
};

export const writeAdminLoginFailureLog = async (args: {
  email?: unknown;
  failureReason: "ACCOUNT_NOT_FOUND" | "NOT_ADMIN" | "INVALID_PASSWORD";
  statusCode: number;
  req: Request;
}) => {
  try {
    await AdminAuditLog.create({
      actor: null,
      actorName: "Unauthenticated",
      actorEmail: String(args.email || "").trim().toLowerCase().slice(0, 254),
      actorRole: args.failureReason === "NOT_ADMIN" ? "non_admin" : "unknown",
      action: "ADMIN_LOGIN_FAILED",
      resource: "/api/auth/admin-login",
      method: "POST",
      statusCode: args.statusCode,
      failureReason: args.failureReason,
      ipAddress: args.req.ip,
      userAgent: args.req.get("user-agent")?.slice(0, 500),
      changedFields: [],
    });
  } catch (error) {
    logger.error("Failed admin login audit write failed", {
      failureReason: args.failureReason,
      error,
    });
  }
};