export const getDocumentsSchema = {
  parse(query = {}) {
    let limit = 20;
    if (query.limit !== undefined) {
      const parsed = parseInt(query.limit, 10);
      if (!isNaN(parsed) && parsed >= 1) {
        limit = parsed > 100 ? 100 : parsed;
      }
    }

    return {
      limit,
      cursor: query.cursor,
      page: query.page ? parseInt(query.page, 10) : undefined,
      search: query.search,
      status: query.status,
      category: query.category,
      isFavorite: query.isFavorite === undefined ? undefined : query.isFavorite === "true",
      isArchived: query.isArchived === undefined ? undefined : query.isArchived === "true",
      sortBy: query.sortBy,
      startDate: query.startDate,
      endDate: query.endDate,
      owner: query.owner,
    };
  },
};
