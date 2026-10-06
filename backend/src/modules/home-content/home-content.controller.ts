import type { NextFunction, Request, Response } from "express";
import { createHomeContent, editHomeContent, HomeContentNotFoundError, HomeContentValidationError, listHomeContent, parseHomeContentId } from "./home-content.service.js";

function known(error: unknown, response: Response) {
  if (error instanceof HomeContentValidationError) { response.status(400).json({ error: { code: "VALIDATION_ERROR", message: error.message } }); return true; }
  if (error instanceof HomeContentNotFoundError) { response.status(404).json({ error: { code: "HOME_CONTENT_NOT_FOUND", message: error.message } }); return true; }
  return false;
}
async function run(response: Response, next: NextFunction, action: () => Promise<void>) {
  try { await action(); } catch (error) { if (!known(error, response)) next(error); }
}
export const listHomeContentHandler = (request: Request, response: Response, next: NextFunction) => run(response, next, async () => { response.json(await listHomeContent(request.query as Record<string, unknown>)); });
export const createHomeContentHandler = (request: Request, response: Response, next: NextFunction) => run(response, next, async () => {
  const item = await createHomeContent(request.body);
  response.location(`/api/v1/home-content/${item.id}`).status(201).json({ data: item });
});
export const updateHomeContentHandler = (request: Request, response: Response, next: NextFunction) => run(response, next, async () => { response.json({ data: await editHomeContent(parseHomeContentId(String(request.params.id)), request.body) }); });
