import { prisma } from "../../database/prisma.js";
import type { HomeContentDisplay, HomeContentSection } from "../../generated/prisma/client.js";

export interface HomeContentWriteData {
  section: HomeContentSection;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  badge: string | null;
  displayStyle: HomeContentDisplay;
  sortOrder: number;
  isActive: boolean;
}

export function findHomeContentPage(skip: number, take: number, section?: HomeContentSection, isActive?: boolean) {
  const where = { ...(section ? { section } : {}), ...(isActive === undefined ? {} : { isActive }) };
  return prisma.$transaction([
    prisma.homeContentItem.findMany({ where, orderBy: [{ section: "asc" }, { sortOrder: "asc" }, { id: "desc" }], skip, take }),
    prisma.homeContentItem.count({ where }),
  ]).then(([items, total]) => ({ items, total }));
}

export const findHomeContent = (id: number) => prisma.homeContentItem.findUnique({ where: { id } });
export const insertHomeContent = (data: HomeContentWriteData) => prisma.homeContentItem.create({ data });
export const updateHomeContent = (id: number, data: Partial<HomeContentWriteData>) => prisma.homeContentItem.update({ where: { id }, data });
