import { Router } from "express";

import { learningRouter } from "../modules/learning/learning.routes.js";

export const apiRouter = Router();

apiRouter.get("/", (_request, response) => {
  response.status(200).json({
    data: {
      name: "CineBook API",
      version: "v1",
    },
  });
});

apiRouter.use("/examples", learningRouter);
