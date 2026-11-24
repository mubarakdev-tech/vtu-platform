import { NextFunction, Response } from "express";
import { AuthRequest } from "./auth.middleware";
import { writeAdminAuditLog } from "../utils/adminAudit";
import logger from "../utils/logger";

export const auditAdminActivity = (req: AuthRequest, res: Response, next: NextFunction) => {
  const method = req.method.toUpperCase();
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(method)) return next();

  res.once("finish", () => {
    if (res.statusCode < 200 || res.statusCode >= 300 || !req.user) return;
    const resource = req.baseUrl + req.path;
    const action = `${method} ${resource}`;
    const sensitiveKey = /(password|token|secret|api.?key|authorization|credential|cookie)/i;
    const changedFields = Object.keys(req.body || {})
      .filter((key) => !sensitiveKey.test(key))
      .slice(0, 25);
    void writeAdminAuditLog({
      actor: req.user,
      action,
      resource,
      method,
      statusCode: res.statusCode,
      req,
      changedFields,
    }).catch((error) => logger.error("Unable to persist admin activity", { action, error }));
  });

  next();
};
