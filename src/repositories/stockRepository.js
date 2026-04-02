const prisma = require('../config/database');

module.exports = {
  getStock: () => prisma.batch.findMany({
    where: { quantityAvailable: { gt: 0 } },
    orderBy: { expirationDate: 'asc' },
    include: { vaccine: { select: { id: true, name: true, manufacturer: true } } },
  }),

  getHistory: (filters = {}) => {
    const where = {};
    if (filters.type) where.type = filters.type;
    if (filters.batchId) where.batchId = parseInt(filters.batchId);
    if (filters.patientId) where.patientId = parseInt(filters.patientId);
    if (filters.from || filters.to) {
      where.createdAt = {};
      if (filters.from) where.createdAt.gte = new Date(filters.from);
      if (filters.to) where.createdAt.lte = new Date(filters.to + 'T23:59:59Z');
    }
    return prisma.stockMovement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(filters.limit) || 100,
      skip: parseInt(filters.offset) || 0,
      include: {
        batch: { include: { vaccine: { select: { name: true, manufacturer: true } } } },
        patient: { select: { id: true, name: true, cpf: true } },
      },
    });
  },

  countHistory: (filters = {}) => {
    const where = {};
    if (filters.type) where.type = filters.type;
    if (filters.batchId) where.batchId = parseInt(filters.batchId);
    if (filters.patientId) where.patientId = parseInt(filters.patientId);
    return prisma.stockMovement.count({ where });
  },

  createMovement: (data) => prisma.stockMovement.create({
    data,
    include: { batch: { include: { vaccine: true } }, patient: true },
  }),
};
