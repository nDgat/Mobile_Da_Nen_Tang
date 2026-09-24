import type { NextFunction, Request, Response } from "express";
import { adminBookings, adminDashboard, adminReviews, adminUsers, AdminConflictError, AdminNotFoundError, AdminValidationError, setAdminReviewVisibility, setAdminUserStatus } from "./admin.service.js";
import { auditLogs } from "../audit/audit.service.js";
function handle(error: unknown, response: Response) { if (error instanceof AdminValidationError) { response.status(400).json({ error: { code: "VALIDATION_ERROR", message: error.message } }); return true; } if (error instanceof AdminNotFoundError) { response.status(404).json({ error: { code: "ADMIN_RESOURCE_NOT_FOUND", message: error.message } }); return true; } if (error instanceof AdminConflictError) { response.status(409).json({ error: { code: "ADMIN_CONFLICT", message: error.message } }); return true; } return false; }
async function run(res: Response, next: NextFunction, action: () => Promise<unknown>) { try { res.json({ data: await action() }); } catch (error) { if (!handle(error, res)) next(error); } }
async function runList(res: Response, next: NextFunction, action: () => Promise<unknown>) { try { res.json(await action()); } catch (error) { if (!handle(error, res)) next(error); } }
export const dashboardHandler = (_req: Request, res: Response, next: NextFunction) => run(res, next, adminDashboard);
export const adminUserListHandler = (req: Request, res: Response, next: NextFunction) => runList(res, next, () => adminUsers(req.query as Record<string, unknown>));
const auditContext = (req: Request, res: Response) => ({ requestId: String(res.locals.requestId), ...(req.ip ? { ipAddress: req.ip } : {}), ...(req.get("user-agent") ? { userAgent: req.get("user-agent")!.slice(0, 255) } : {}) });
export const adminUserStatusHandler = (req: Request, res: Response, next: NextFunction) => run(res, next, () => setAdminUserStatus(String(req.params.id), res.locals.auth.userId as number, req.body, auditContext(req, res)));
export const adminBookingListHandler = (req: Request, res: Response, next: NextFunction) => runList(res, next, () => adminBookings(req.query as Record<string, unknown>));
export const adminReviewListHandler = (req: Request, res: Response, next: NextFunction) => runList(res, next, () => adminReviews(req.query as Record<string, unknown>));
export const adminReviewVisibilityHandler = (req: Request, res: Response, next: NextFunction) => run(res, next, () => setAdminReviewVisibility(String(req.params.id), res.locals.auth.userId as number, req.body, auditContext(req, res)));
export const adminAuditLogListHandler = (req: Request, res: Response, next: NextFunction) => runList(res, next, () => auditLogs(req.query as Record<string, unknown>));
