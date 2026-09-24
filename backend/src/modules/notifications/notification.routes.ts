import { Router } from "express";
import { requireAuthentication } from "../auth/auth.middleware.js";
import { listNotificationHandler, readAllNotificationHandler, readNotificationHandler } from "./notification.controller.js";
import { validateRequest } from "../../validation/request-validation.js";
import { idParams, notificationSchemas } from "../../validation/schemas.js";

export const notificationRouter = Router();
notificationRouter.get("/", requireAuthentication, validateRequest({ query: notificationSchemas.listQuery }), listNotificationHandler);
notificationRouter.patch("/read-all", requireAuthentication, readAllNotificationHandler);
notificationRouter.patch("/:id/read", requireAuthentication, validateRequest({ params: idParams() }), readNotificationHandler);
