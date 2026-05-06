const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error','warn'] : ['error'],
});
// Enable unaccent for accent-insensitive search on startup
prisma.$connect().then(()=>
  prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS unaccent`
  .then(()=>console.log('✓ unaccent OK'))
  .catch(e=>console.warn('unaccent unavailable:',e.message))
).catch(()=>{});

module.exports = prisma;
