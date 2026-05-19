const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 VittaSys — Seed iniciado...');
  console.log('✅ Sistema pronto.');
}

main()
  .catch(e => { console.error('⚠️  Seed aviso:', e.message); })
  .finally(() => prisma.$disconnect());
