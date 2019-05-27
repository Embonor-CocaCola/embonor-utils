const { logger } = require('embonor-utils');
const { Op } = require('sequelize');

function omit(originalObject, keys) {
  return Object.entries(originalObject)
    .filter(entry => !keys.includes(entry[0]))
    .reduce((object, entry) => ({ ...object, [entry[0]]: entry[1] }), {});
}

module.exports = async (asyncFindMethod, query, settings) => {
  const {
    limit = 100, previous = false, limitId, asc = false, columnToOrder = 'id', settingsFromQuery = false, options = {},
  } = settings;
  const pagination = {
    order: [
      previous !== asc ? [columnToOrder, 'ASC'] : [columnToOrder, 'DESC'],
    ],
    limit,
  };
  pagination.where = settingsFromQuery ? omit(query, ['limitId', 'asc', 'previous', 'limit']) : query;
  const safeLimitId = Number(limitId);

  if (!Number.isNaN(safeLimitId)) {
    pagination.where[columnToOrder] = previous !== asc ? { [Op.gt]: safeLimitId } : { [Op.lt]: safeLimitId };
  }

  logger.debug(`pagination query =>: ${JSON.stringify({ ...options, ...pagination })}`);

  const results = await asyncFindMethod({ ...options, ...pagination });
  const limitItem = (results && results.length > 0) ? results[results.length - 1] : 0;
  return ({ results: previous ? results.reverse() : results, limitId: limitItem ? limitItem[columnToOrder] : null });
};
