// src/middleware/paginate.js

/**
 * Parses ?page=1&limit=20 from query string.
 * Attaches { limit, offset, page } to req.pagination.
 */
function paginate(maxLimit = 100) {
  return (req, res, next) => {
    const page  = Math.max(1, parseInt(req.query.page,  10) || 1);
    const limit = Math.min(maxLimit, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;
    req.pagination = { page, limit, offset };
    next();
  };
}

/** Builds pagination metadata for response */
function paginationMeta(total, { page, limit }) {
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasNextPage: page * limit < total,
    hasPrevPage: page > 1,
  };
}

module.exports = { paginate, paginationMeta };