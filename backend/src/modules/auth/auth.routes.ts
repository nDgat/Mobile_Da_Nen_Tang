import { Router } from "express";
import { loginHandler, logoutHandler, meHandler, refreshHandler, registerHandler } from "./auth.controller.js";
import { requireAuthentication } from "./auth.middleware.js";
export const authRouter = Router();
authRouter.post("/register", registerHandler);
authRouter.post("/login", loginHandler);
authRouter.get("/me", requireAuthentication, meHandler);
authRouter.post("/refresh", refreshHandler);
authRouter.post("/logout", logoutHandler);
