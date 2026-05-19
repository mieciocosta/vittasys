const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 VittaSys — Inicialização do sistema...\n');

  // ═══ APENAS USUÁRIOS ═══
  const usuarios = [
   // { nome: 'Nágila Santos', cargo: 'Gestora', email: 'nagila@vittalis.com', pin: '2305', perfil: 'master' },
   // { nome: 'Miécio Costa', cargo: 'Gestor', email: 'miecio@vittalis.com', pin: '2305', perfil: 'master' },
    { nome: 'Dra. Camila Ferreira', cargo: 'Enfermeira - Ativos', email: 'camila@vittalis.com', pin: '1234', perfil: 'ativos' },
    { nome: 'Téc. Rafael Santos', cargo: 'Técnico - Ativos', email: 'rafael@vittalis.com', pin: '1234', perfil: 'ativos' },
    { nome: 'Dra. Juliana Mendes', cargo: 'Médica - Espontâneos', email: 'juliana@vittalis.com', pin: '1234', perfil: 'espontaneos' },
    { nome: 'Téc. Bruno Almeida', cargo: 'Técnico - Espontâneos', email: 'bruno@vittalis.com', pin: '1234', perfil: 'espontaneos' },
    { nome: 'Amanda Costa', cargo: 'Vendedora - Ativos', email: 'amanda@vittalis.com', pin: '1234', perfil: 'ativos' },
    { nome: 'Enf. Patrícia Lima', cargo: 'Enfermeira - Ativos', email: 'patricia@vittalis.com', pin: '1234', perfil: 'ativos' },
  ];

  for (const u of usuarios) {
    await prisma.usuario.upsert({
      where: { email: u.email },
      update: { nome: u.nome, cargo: u.cargo, pin: u.pin, perfil: u.perfil },
      create: u,
    });
  }
  console.log(`  ✓ ${usuarios.length} usuários criados`);

  // ═══ PLANOS TEMPLATE (estrutura base) ═══
  const planosExist = await prisma.plano.count();
  if (planosExist === 0) {
    const planos = [
      { nome: 'Plano 0 a 6 meses', idadeInicio: 0, idadeFim: 6, valorTabela: 2800 },
      { nome: 'Plano 2 a 6 meses', idadeInicio: 2, idadeFim: 6, valorTabela: 2200 },
      { nome: 'Plano 0 a 9 meses', idadeInicio: 0, idadeFim: 9, valorTabela: 3800 },
      { nome: 'Plano 2 a 9 meses', idadeInicio: 2, idadeFim: 9, valorTabela: 3200 },
      { nome: 'Plano 0 a 18 meses', idadeInicio: 0, idadeFim: 18, valorTabela: 5800 },
      { nome: 'Plano 2 a 18 meses', idadeInicio: 2, idadeFim: 18, valorTabela: 5200 },
    ];
    for (const p of planos) await prisma.plano.create({ data: p });
    console.log(`  ✓ ${planos.length} planos template`);
  }

  console.log('\n✅ Sistema inicializado!\n');
  console.log('  Sem dados de estoque/clientes/movimentações.');
  console.log('  Use a interface para cadastrar vacinas, importar NF-e e registrar clientes.\n');
}

main()
  .catch(e => { console.error('❌ Seed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
