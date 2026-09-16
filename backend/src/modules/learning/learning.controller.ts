import type { RequestHandler } from "express";

import {
  createLearningExample,
  readLearningExample,
  type LearningExample,
} from "./learning.service.js";

interface ExampleParams {
  id: string;
}

interface ExampleQuery {
  uppercase?: string;
}

interface CreateExampleBody {
  message?: unknown;
}

interface SuccessResponse {
  data: LearningExample;
  meta: {
    method: "GET" | "POST";
  };
}

export const getLearningExample: RequestHandler<
  ExampleParams,
  SuccessResponse,
  never,
  ExampleQuery
> = (request, response) => {
  const data = readLearningExample(
    request.params.id,
    request.query.uppercase === "true",
  );

  response.status(200).json({
    data,
    meta: { method: "GET" },
  });
};

export const postLearningExample: RequestHandler<
  Record<string, never>,
  SuccessResponse | { error: { code: string; message: string } },
  CreateExampleBody
> = (request, response) => {
  if (
    typeof request.body.message !== "string" ||
    request.body.message.trim().length === 0
  ) {
    response.status(400).json({
      error: {
        code: "INVALID_MESSAGE",
        message: "Trường message phải là chuỗi không rỗng.",
      },
    });
    return;
  }

  const data = createLearningExample(request.body.message);

  response
    .location(`/api/v1/examples/${data.id}`)
    .status(201)
    .json({
      data,
      meta: { method: "POST" },
    });
};
