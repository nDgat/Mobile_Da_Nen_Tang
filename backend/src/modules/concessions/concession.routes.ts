import { Router } from "express";
import { listConcessionsHandler } from "./concession.controller.js";

export const concessionRouter = Router();
concessionRouter.get("/", listConcessionsHandler);
