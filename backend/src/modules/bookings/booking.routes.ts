import { Router } from "express";
import { requireAuthentication } from "../auth/auth.middleware.js";
import { getBookingHandler, releaseHoldHandler, submitBookingHandler } from "./booking.controller.js";
export const bookingRouter = Router();
bookingRouter.get("/:id", requireAuthentication, getBookingHandler);
bookingRouter.post("/:id/submit", requireAuthentication, submitBookingHandler);
bookingRouter.delete("/:id/hold", requireAuthentication, releaseHoldHandler);
