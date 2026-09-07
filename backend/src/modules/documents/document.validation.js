export const getDocumentsSchema = {
  parse(input = {}) {
    let limit = 20;
    if (input.limit !== undefined) {
      const parsed = parseInt(input.limit, 10);
      if (!isNaN(parsed) && parsed >= 1) {
        limit = parsed > 100 ? 100 : parsed;
      }
    }
    return {
      ...input,
      limit,
      cursor: input.cursor,
      page: input.page ? parseInt(input.page, 10) : undefined,
    };
  },
};
