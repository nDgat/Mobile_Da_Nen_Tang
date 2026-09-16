import { Router } from "express";

import {
  getLearningExample,
  postLearningExample,
} from "./learning.controller.js";

export const learningRouter = Router();

learningRouter.get("/:id", getLearningExample);
learningRouter.post("/", postLearningExample);
