const prisma = require('../config/database');

module.exports = {
  findAll: (where = {}) => prisma.vaccine.findMany({ where: { active: true, ...where }, orderBy: { name: 'asc' }, include: { _count: { select: { batches: true } } } }),
  findById: (id) => prisma.vaccine.findUnique({ where: { id }, include: { batches: { orderBy: { expirationDate: 'asc' } } } }),
  create: (data) => prisma.vaccine.create({ data }),
  update: (id, data) => prisma.vaccine.update({ where: { id }, data }),
};
