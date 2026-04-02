const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

prisma.$connect()
  .then(() => console.log('✅ PostgreSQL conectado'))
  .catch(e => { console.error('❌ Erro PostgreSQL:', e.message); process.exit(1); });

process.on('beforeExit', async () => { await prisma.$disconnect(); });

module.exports = prisma;
