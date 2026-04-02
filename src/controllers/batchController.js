const service = require('../services/batchService');

exports.list = async (req, res, next) => {
  try { res.json(await service.list()); } catch (e) { next(e); }
};

exports.getById = async (req, res, next) => {
  try {
    const b = await service.getById(parseInt(req.params.id));
    if (!b) return res.status(404).json({ error: 'Lote não encontrado' });
    res.json(b);
  } catch (e) { next(e); }
};

exports.create = async (req, res, next) => {
  try { res.status(201).json(await service.create(req.body)); } catch (e) { next(e); }
};

exports.delete = async (req, res, next) => {
  try {
    await service.delete(parseInt(req.params.id));
    res.json({ success: true, message: 'Lote excluído' });
  } catch (e) { next(e); }
};
