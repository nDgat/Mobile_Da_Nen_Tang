import { Router } from "express";
import { z } from "zod";
import { bannerRepository } from "./banner.repository.js";
import { validateRequest } from "../../validation/request-validation.js";
import { requireAuthentication, requireRole } from "../auth/auth.middleware.js";

export const bannerRouter = Router();
export const bannerSchema = z.object({
  imageUrl: z.union([z.literal(""), z.string().regex(/^\/uploads\/[a-f0-9-]{36}\.jpg$/), z.string().max(2048).url().refine(value => /^https?:\/\//i.test(value), "Chỉ chấp nhận URL http/https")]),
  title: z.string().trim().min(1).max(150),
}).strict();
bannerRouter.get("/", async (_req, res) => {
  res.json({ data: await bannerRepository.read() ?? { id: 1, imageUrl: "", title: "Một bộ phim hay, một buổi tối đáng nhớ." } });
});
bannerRouter.put("/", requireAuthentication, requireRole("ADMIN"), validateRequest({ body: bannerSchema }), async (req, res) => {
  const data = bannerSchema.parse(req.body);
  res.json({ data: await bannerRepository.save(data) });
});
