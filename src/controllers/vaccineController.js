const service = require('../services/vaccineService');

exports.list = async (req, res, next) => {
  try { res.json(await service.list()); } catch (e) { next(e); }
};

exports.getById = async (req, res, next) => {
  try {
    const v = await service.getById(parseInt(req.params.id));
    if (!v) return res.status(404).json({ error: 'Vacina não encontrada' });
    res.json(v);
  } catch (e) { next(e); }
};

exports.create = async (req, res, next) => {
  try { res.status(201).json(await service.create(req.body)); } catch (e) { next(e); }
};
