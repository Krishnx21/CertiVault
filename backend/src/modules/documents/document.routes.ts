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
  getSummary,
} from "./document.controller.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

export const documentRouter = Router();

// Public routes (none - all protected)

// Protected routes
documentRouter.use(protect);

documentRouter.get("/summary", getSummary);
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
