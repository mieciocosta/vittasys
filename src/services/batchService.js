const repo = require('../repositories/batchRepository');
const { required, positiveInt, ValidationError } = require('../middlewares/validate');

module.exports = {
  list: () => repo.findAll(),
  getById: (id) => repo.findById(id),
  create: async (data) => {
    required(data, ['vaccineId', 'batchNumber', 'expirationDate', 'quantityTotal']);
    const qty = positiveInt(data.quantityTotal, 'quantityTotal');
    const exp = new Date(data.expirationDate);
    if (isNaN(exp.getTime())) throw new ValidationError('Data de validade inválida');
    if (exp <= new Date()) throw new ValidationError('Não é permitido cadastrar lote já vencido');
    const exists = await repo.findByNumber(data.batchNumber);
    if (exists) throw new ValidationError(`Lote ${data.batchNumber} já cadastrado`);
    return repo.create({
      vaccineId: parseInt(data.vaccineId),
      batchNumber: data.batchNumber,
      expirationDate: exp,
      quantityTotal: qty,
      quantityAvailable: qty,
    });
  },
  delete: async (id) => {
    const has = await repo.hasMovements(id);
    if (has) throw new ValidationError('Não é possível excluir lote com movimentações vinculadas');
    return repo.delete(id);
  },
};
