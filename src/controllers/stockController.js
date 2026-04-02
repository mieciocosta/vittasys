const service = require('../services/stockService');

exports.getStock = async (req, res, next) => {
  try { res.json(await service.getStock()); } catch (e) { next(e); }
};

exports.getHistory = async (req, res, next) => {
  try {
    const [data, total] = await Promise.all([
      service.getHistory(req.query),
      service.countHistory(req.query),
    ]);
    res.json({ data, total, limit: parseInt(req.query.limit) || 100, offset: parseInt(req.query.offset) || 0 });
  } catch (e) { next(e); }
};

exports.entry = async (req, res, next) => {
  try { res.status(201).json(await service.entry(req.body)); } catch (e) { next(e); }
};

exports.exit = async (req, res, next) => {
  try { res.status(201).json(await service.exit(req.body)); } catch (e) { next(e); }
};
