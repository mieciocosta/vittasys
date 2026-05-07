// Script para deletar movimentação por ID
// Uso: node delete-mov.js 22
const prisma = require('./src/config/database');

async function main() {
  const id = parseInt(process.argv[2]);
  if (!id) { console.error('Uso: node delete-mov.js <ID>'); process.exit(1); }

  // Buscar antes de deletar para confirmar
  const mov = await prisma.movimentacao.findUnique({
    where: { id },
    select: { id: true, tipo: true, status: true, nomeVacina: true, dataHora: true, quantidade: true, observacoes: true }
  });

  if (!mov) { console.error(`Movimentação #${id} não encontrada.`); process.exit(1); }

  console.log('\n📋 Movimentação encontrada:');
  console.log(`  ID:       #${mov.id}`);
  console.log(`  Tipo:     ${mov.tipo}`);
  console.log(`  Status:   ${mov.status}`);
  console.log(`  Vacina:   ${mov.nomeVacina || '-'}`);
  console.log(`  Data:     ${mov.dataHora}`);
  console.log(`  Qtd:      ${mov.quantidade}`);
  console.log(`  Obs:      ${mov.observacoes || '-'}`);

  await prisma.movimentacao.delete({ where: { id } });
  console.log(`\n✅ Movimentação #${id} deletada com sucesso.\n`);
}

main().catch(e => { console.error('Erro:', e.message); process.exit(1); }).finally(() => prisma.$disconnect());
