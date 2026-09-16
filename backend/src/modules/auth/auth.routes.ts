import { Router } from "express";
import { registerHandler } from "./auth.controller.js";
export const authRouter = Router();
authRouter.post("/register", registerHandler);

