module.exports = (err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);
  if (err.code === 'P2002') return res.status(409).json({ error: 'Registro duplicado' });
  if (err.code === 'P2025') return res.status(404).json({ error: 'Não encontrado' });
  res.status(err.status || 500).json({ error: err.message || 'Erro interno' });
};
