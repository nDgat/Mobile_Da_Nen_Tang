import type { NextFunction, Request, Response } from "express";

import {
  CinemaNotFoundError,
  CinemaValidationError,
  createCinema,
  deactivateCinema,
  getCinema,
  listCinemas,
  parseCinemaId,
  updateCinema,
} from "./cinema.service.js";

function sendKnownError(error: unknown, response: Response): boolean {
  if (error instanceof CinemaValidationError) {
    response.status(400).json({
      error: { code: "VALIDATION_ERROR", message: error.message },
    });
    return true;
  }
  if (error instanceof CinemaNotFoundError) {
    response.status(404).json({
      error: { code: "CINEMA_NOT_FOUND", message: error.message },
    });
    return true;
  }
  return false;
}

async function runAction(
  response: Response,
  next: NextFunction,
  action: () => Promise<void>,
): Promise<void> {
  try {
    await action();
  } catch (error) {
    if (!sendKnownError(error, response)) {
      next(error);
    }
  }
}

export async function listCinemaHandler(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  await runAction(response, next, async () => {
    response.status(200).json(
      await listCinemas(request.query as Record<string, unknown>),
    );
  });
}

export async function getCinemaHandler(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  await runAction(response, next, async () => {
    const id = parseCinemaId(String(request.params.id));
    response.status(200).json({ data: await getCinema(id) });
  });
}

export async function createCinemaHandler(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  await runAction(response, next, async () => {
    const cinema = await createCinema(request.body);
    response
      .location(`/api/v1/cinemas/${cinema.id}`)
      .status(201)
      .json({ data: cinema });
  });
}

export async function updateCinemaHandler(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  await runAction(response, next, async () => {
    const id = parseCinemaId(String(request.params.id));
    response.status(200).json({ data: await updateCinema(id, request.body) });
  });
}

export async function deleteCinemaHandler(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  await runAction(response, next, async () => {
    const id = parseCinemaId(String(request.params.id));
    await deactivateCinema(id);
    response.status(204).send();
  });
}

