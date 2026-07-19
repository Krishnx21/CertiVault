/**
 * Search Controller - Handles search HTTP requests
 */

import { Request, Response, NextFunction } from "express";
import {
  globalSearch,
  searchByField,
  getSearchSuggestions,
  getRecentSearches,
  saveRecentSearch,
} from "./search.service.js";
import { ApiError } from "../../utils/ApiError.js";

/**
 * Global search
 */
export const globalSearchController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { q } = req.query;
    const { category, status, verificationStatus, isArchived, isFavorite, tags, includeShared } = req.query;

    if (!q || typeof q !== "string") {
      return next(new ApiError(400, "MISSING_QUERY", "Search query is required"));
    }

    const filters: any = {};
    if (category) filters.category = category;
    if (status) filters.status = status;
    if (verificationStatus) filters.verificationStatus = verificationStatus;
    if (isArchived !== undefined) filters.isArchived = isArchived === "true";
    if (isFavorite !== undefined) filters.isFavorite = isFavorite === "true";
    if (tags) {
      filters.tags = Array.isArray(tags) ? tags : [tags];
    }

    const result = await globalSearch({
      query: q,
      userId,
      filters,
      includeShared: includeShared === "true",
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
    });

    // Save recent search if user is authenticated
    if (userId) {
      await saveRecentSearch(userId, q);
    }

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Search by specific field
 */
export const searchByFieldController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { field, value } = req.params;
    const fieldStr = Array.isArray(field) ? field[0] : field;
    const valueStr = Array.isArray(value) ? value[0] : value;

    if (!fieldStr || !valueStr) {
      return next(new ApiError(400, "MISSING_PARAMS", "Field and value are required"));
    }

    const results = await searchByField(fieldStr, valueStr, userId);

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get search suggestions
 */
export const getSearchSuggestionsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { q } = req.query;

    if (!q || typeof q !== "string") {
      return next(new ApiError(400, "MISSING_QUERY", "Search query is required"));
    }

    const suggestions = await getSearchSuggestions(q, userId);

    res.json({
      success: true,
      data: suggestions,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get recent searches
 */
export const getRecentSearchesController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return next(new ApiError(401, "UNAUTHORIZED", "User not authenticated"));
    }

    const recentSearches = await getRecentSearches(userId);

    res.json({
      success: true,
      data: recentSearches,
    });
  } catch (error) {
    next(error);
  }
};
