require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════════╗
  ║  💎 VittaSys API v1.0 — Vittalis Saúde   ║
  ║  http://localhost:${PORT}                      ║
  ║  Ambiente: ${(process.env.NODE_ENV || 'development').padEnd(30)}║
  ╚═══════════════════════════════════════════╝
  `);
});
