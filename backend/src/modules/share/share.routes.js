import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import {
  accessShareLink,
  createShareLink,
  listShareLinks,
  revokeShareLink,
} from "./share.controller.js";

export const shareLinkRouter = Router({ mergeParams: true });
export const publicShareRouter = Router();

shareLinkRouter.use(authenticate);
shareLinkRouter.post("/", createShareLink);
shareLinkRouter.get("/", listShareLinks);
shareLinkRouter.delete("/:linkId", revokeShareLink);

publicShareRouter.get("/:token", accessShareLink);
