import { Router } from "express";
import { listVouchersHandler } from "./voucher.controller.js";

export const voucherRouter = Router();
voucherRouter.get("/", listVouchersHandler);
