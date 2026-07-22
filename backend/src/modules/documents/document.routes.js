import { Router } from "express";
import multer from "multer";
import { authenticate } from "../../middleware/auth.js";
import {
  deleteDocument,
  getDocument,
  listDocuments,
  updateDocument,
  uploadDocument,
  verifyDocument,
} from "./document.controller.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

export const documentRouter = Router();

documentRouter.use(authenticate);

documentRouter.get("/", listDocuments);
documentRouter.get("/:id", getDocument);
documentRouter.post("/", upload.single("file"), uploadDocument);
documentRouter.get("/:id", getDocument);
documentRouter.put("/:id", updateDocument);
documentRouter.patch("/:id/verify", verifyDocument);
documentRouter.delete("/:id", deleteDocument);
