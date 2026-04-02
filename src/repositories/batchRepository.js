const prisma = require('../config/database');

module.exports = {
  findAll: (where = {}) => prisma.batch.findMany({ where, orderBy: { expirationDate: 'asc' }, include: { vaccine: { select: { id: true, name: true, manufacturer: true } } } }),
  findById: (id) => prisma.batch.findUnique({ where: { id }, include: { vaccine: true, movements: { orderBy: { createdAt: 'desc' }, take: 20 } } }),
  findByNumber: (batchNumber) => prisma.batch.findUnique({ where: { batchNumber } }),
  create: (data) => prisma.batch.create({ data, include: { vaccine: true } }),
  update: (id, data) => prisma.batch.update({ where: { id }, data }),
  hasMovements: async (id) => { const c = await prisma.stockMovement.count({ where: { batchId: id } }); return c > 0; },
  delete: (id) => prisma.batch.delete({ where: { id } }),
};
