require('dotenv').config();
const app = require('./app');
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  const amb = process.env.AMBIENTE || process.env.NODE_ENV || 'development';
  const timeout = process.env.SESSION_TIMEOUT_MINUTES || 15;
  console.log(`
  ╔═══════════════════════════════════════════╗
  ║  💎 VittaSys v2.0 — Vittalis Saúde       ║
  ║  http://localhost:${PORT}                      ║
  ║  PostgreSQL + Prisma + Express            ║
  ║  Ambiente: ${amb.padEnd(28)}  ║
  ║  Sessão: ${(timeout + ' min').padEnd(30)}  ║
  ╚═══════════════════════════════════════════╝
  `);
});
