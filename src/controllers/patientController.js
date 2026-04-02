const service = require('../services/patientService');

exports.list = async (req, res, next) => {
  try { res.json(await service.list()); } catch (e) { next(e); }
};

exports.getById = async (req, res, next) => {
  try {
    const p = await service.getById(parseInt(req.params.id));
    if (!p) return res.status(404).json({ error: 'Paciente não encontrado' });
    res.json(p);
  } catch (e) { next(e); }
};

exports.create = async (req, res, next) => {
  try { res.status(201).json(await service.create(req.body)); } catch (e) { next(e); }
};
