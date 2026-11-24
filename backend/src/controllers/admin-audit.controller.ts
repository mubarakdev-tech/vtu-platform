import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import AdminAuditLog from "../models/adminAuditLog.model";

export const getAdminAuditLogs = async (req: AuthRequest, res: Response) => {
  try {
    const page = Math.max(1, Number.parseInt(String(req.query.page || "1"), 10) || 1);
    const limit = Math.min(100, Math.max(10, Number.parseInt(String(req.query.limit || "25"), 10) || 25));
    const search = String(req.query.search || "").trim().slice(0, 100);
    const filter: Record<string, any> = {};

    if (search) {
      const safe = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(safe, "i");
      filter.$or = [
        { actorName: regex }, { actorEmail: regex },
        { action: regex }, { resource: regex },
      ];
    }

    const [logs, total] = await Promise.all([
      AdminAuditLog.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select("actorName actorEmail actorRole action resource method statusCode ipAddress userAgent changedFields failureReason createdAt")
        .lean(),
      AdminAuditLog.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      logs,
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Unable to load admin activity history." });
  }
};
