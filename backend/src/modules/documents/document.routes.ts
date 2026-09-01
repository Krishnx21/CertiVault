import { Router } from "express";
import multer from "multer";
import { protect } from "../../middleware/auth.js";
import {
  uploadDocument,
  listDocuments,
  getDocument,
  patchDocument,
  deleteDocument,
  archiveDocumentController,
  restoreDocumentController,
  favoriteDocumentController,
  unfavoriteDocumentController,
  verifyDocument,
  searchDocumentsController,
  filterDocumentsController,
  getRecentDocumentsController,
  getFavoriteDocumentsController,
  getDownloadUrl,
  viewDocument,
  getSummary,
  getActivityTimelineController,
  getNotificationsController,
} from "./document.controller.js";

import path from "path";
import fs from "fs";

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
});

export const documentRouter = Router();

// Public routes (none - all protected)

// Protected routes
documentRouter.use(protect);

documentRouter.get("/summary", getSummary);
documentRouter.get("/activity", getActivityTimelineController);
documentRouter.get("/notifications", getNotificationsController);
documentRouter.get("/search", searchDocumentsController);
documentRouter.get("/filter", filterDocumentsController);
documentRouter.get("/recent", getRecentDocumentsController);
documentRouter.get("/favorites", getFavoriteDocumentsController);
documentRouter.get("/", listDocuments);
documentRouter.post("/", upload.single("file"), uploadDocument);
documentRouter.get("/:id", getDocument);
documentRouter.patch("/:id", patchDocument);
documentRouter.delete("/:id", deleteDocument);
documentRouter.post("/:id/archive", archiveDocumentController);
documentRouter.post("/:id/restore", restoreDocumentController);
documentRouter.post("/:id/favorite", favoriteDocumentController);
documentRouter.delete("/:id/favorite", unfavoriteDocumentController);
documentRouter.post("/:id/verify", verifyDocument);
documentRouter.get("/:id/download", getDownloadUrl);
documentRouter.get("/:id/view", viewDocument);
