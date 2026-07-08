import { Router } from "express";
import multer from "multer";
import {
  deleteDocument,
  listDocuments,
  uploadDocument,
  verifyDocument,
} from "./document.controller.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

export const documentRouter = Router();

documentRouter.get("/", listDocuments);
documentRouter.post("/", upload.single("file"), uploadDocument);
documentRouter.patch("/:id/verify", verifyDocument);
documentRouter.delete("/:id", deleteDocument);
