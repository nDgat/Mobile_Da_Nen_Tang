import { prisma } from "../../database/prisma.js";

export const bannerRepository = {
  read: () => prisma.siteBanner.findUnique({ where: { id: 1 } }),
  save: (data: { imageUrl: string; title: string }) => prisma.siteBanner.upsert({ where: { id: 1 }, create: { id: 1, ...data }, update: data }),
};
