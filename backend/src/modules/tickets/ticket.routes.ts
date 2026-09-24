import { Router } from "express";
import { requireAuthentication, requireRole } from "../auth/auth.middleware.js";
import { verifyTicketHandler } from "./ticket.controller.js";

export const ticketRouter = Router();
ticketRouter.post("/verify", requireAuthentication, requireRole("ADMIN"), verifyTicketHandler);
