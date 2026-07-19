/**
 * Search Routes - API routes for search functionality
 */

import { Router } from "express";
import { protect } from "../../middleware/auth.js";
import {
  globalSearchController,
  searchByFieldController,
  getSearchSuggestionsController,
  getRecentSearchesController,
} from "./search.controller.js";

const router = Router();

/**
 * Global search
 */
router.get("/search", protect, globalSearchController);

/**
 * Get search suggestions
 */
router.get("/search/suggestions", protect, getSearchSuggestionsController);

/**
 * Get recent searches
 */
router.get("/search/recent", protect, getRecentSearchesController);

/**
 * Search by specific field
 */
router.get("/search/:field/:value", protect, searchByFieldController);

export default router;
