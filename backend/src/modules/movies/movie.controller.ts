import type { NextFunction, Request, Response } from "express";

import {
  createMovie,
  deactivateMovie,
  getMovie,
  listMovies,
  MovieNotFoundError,
  MovieValidationError,
  parseMovieId,
  updateMovie,
} from "./movie.service.js";

function sendKnownError(error: unknown, response: Response): boolean {
  if (error instanceof MovieValidationError) {
    response.status(400).json({
      error: { code: "VALIDATION_ERROR", message: error.message },
    });
    return true;
  }

  if (error instanceof MovieNotFoundError) {
    response.status(404).json({
      error: { code: "MOVIE_NOT_FOUND", message: error.message },
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

export async function listMovieHandler(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  await runAction(response, next, async () => {
    response.status(200).json(
      await listMovies(request.query as Record<string, unknown>),
    );
  });
}

export async function getMovieHandler(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  await runAction(response, next, async () => {
    const id = parseMovieId(String(request.params.id));
    response.status(200).json({ data: await getMovie(id) });
  });
}

export async function createMovieHandler(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  await runAction(response, next, async () => {
    const movie = await createMovie(request.body);
    response
      .location(`/api/v1/movies/${movie.id}`)
      .status(201)
      .json({ data: movie });
  });
}

export async function updateMovieHandler(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  await runAction(response, next, async () => {
    const id = parseMovieId(String(request.params.id));
    response.status(200).json({ data: await updateMovie(id, request.body) });
  });
}

export async function deleteMovieHandler(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  await runAction(response, next, async () => {
    const id = parseMovieId(String(request.params.id));
    await deactivateMovie(id);
    response.status(204).send();
  });
}

