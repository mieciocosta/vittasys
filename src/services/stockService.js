const prisma = require('../config/database');
const stockRepo = require('../repositories/stockRepository');
const { required, positiveInt, ValidationError } = require('../middlewares/validate');

module.exports = {
  getStock: () => stockRepo.getStock(),
  getHistory: (filters) => stockRepo.getHistory(filters),
  countHistory: (filters) => stockRepo.countHistory(filters),

  // ═══ ENTRADA ═══
  entry: async (data) => {
    required(data, ['batchId', 'quantity']);
    const qty = positiveInt(data.quantity, 'quantity');
    const batchId = parseInt(data.batchId);

    return prisma.$transaction(async (tx) => {
      const batch = await tx.batch.findUnique({ where: { id: batchId } });
      if (!batch) throw new ValidationError('Lote não encontrado');

      await tx.batch.update({
        where: { id: batchId },
        data: { quantityAvailable: { increment: qty }, quantityTotal: { increment: qty } },
      });

      return tx.stockMovement.create({
        data: { batchId, type: 'entrada', quantity: qty, reason: data.reason || 'Entrada manual' },
        include: { batch: { include: { vaccine: true } } },
      });
    });
  },

  // ═══ SAÍDA ═══
  exit: async (data) => {
    required(data, ['batchId', 'quantity']);
    const qty = positiveInt(data.quantity, 'quantity');
    const batchId = parseInt(data.batchId);
    const patientId = data.patientId ? parseInt(data.patientId) : null;

    return prisma.$transaction(async (tx) => {
      const batch = await tx.batch.findUnique({ where: { id: batchId }, include: { vaccine: true } });
      if (!batch) throw new ValidationError('Lote não encontrado');
      if (batch.quantityAvailable < qty) {
        throw new ValidationError(`Estoque insuficiente: ${batch.quantityAvailable} disponíveis, ${qty} solicitadas`);
      }
      if (batch.expirationDate <= new Date()) {
        throw new ValidationError('Lote vencido — não é permitido retirada');
      }

      await tx.batch.update({
        where: { id: batchId },
        data: { quantityAvailable: { decrement: qty } },
      });

      // Update package doses if patient has one
      if (patientId) {
        const pkg = await tx.vaccinePackage.findFirst({
          where: { patientId, active: true, dosesUsed: { lt: tx.raw`total_doses` } },
          orderBy: { createdAt: 'desc' },
        }).catch(() => null);

        if (pkg) {
          await tx.vaccinePackage.update({
            where: { id: pkg.id },
            data: { dosesUsed: { increment: qty } },
          }).catch(() => {});
        }
      }

      return tx.stockMovement.create({
        data: {
          batchId, type: 'saida', quantity: qty,
          reason: data.reason || 'Saída/Aplicação',
          patientId,
        },
        include: { batch: { include: { vaccine: true } }, patient: true },
      });
    });
  },
};
