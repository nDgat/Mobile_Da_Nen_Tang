import { Router } from "express";
import { requireAuthentication, requireRole } from "../auth/auth.middleware.js";
import { adminAuditLogListHandler, adminBookingListHandler, adminReviewListHandler, adminReviewVisibilityHandler, adminUserListHandler, adminUserStatusHandler, dashboardHandler } from "./admin.controller.js";
import { validateRequest } from "../../validation/request-validation.js";
import { adminSchemas, idParams } from "../../validation/schemas.js";

export const adminRouter = Router();
adminRouter.use(requireAuthentication, requireRole("ADMIN"));
adminRouter.get("/dashboard", dashboardHandler);
adminRouter.get("/users", validateRequest({ query: adminSchemas.userQuery }), adminUserListHandler);
adminRouter.patch("/users/:id/status", validateRequest({ params: idParams(), body: adminSchemas.statusBody }), adminUserStatusHandler);
adminRouter.get("/bookings", validateRequest({ query: adminSchemas.bookingQuery }), adminBookingListHandler);
adminRouter.get("/reviews", validateRequest({ query: adminSchemas.reviewQuery }), adminReviewListHandler);
adminRouter.patch("/reviews/:id/visibility", validateRequest({ params: idParams(), body: adminSchemas.visibilityBody }), adminReviewVisibilityHandler);
adminRouter.get("/audit-logs", validateRequest({ query: adminSchemas.auditQuery }), adminAuditLogListHandler);
