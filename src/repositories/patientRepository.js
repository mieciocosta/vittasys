const prisma = require('../config/database');

module.exports = {
  findAll: (where = {}) => prisma.patient.findMany({ where: { active: true, ...where }, orderBy: { name: 'asc' }, include: { _count: { select: { packages: true, movements: true } } } }),
  findById: (id) => prisma.patient.findUnique({ where: { id }, include: { packages: true, movements: { orderBy: { createdAt: 'desc' }, take: 30, include: { batch: { include: { vaccine: true } } } } } }),
  findByCpf: (cpf) => prisma.patient.findUnique({ where: { cpf } }),
  create: (data) => prisma.patient.create({ data }),
  update: (id, data) => prisma.patient.update({ where: { id }, data }),
};
