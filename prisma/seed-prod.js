/**
 * SEED DE PRODUÇÃO — Seguro para rodar em todo deploy.
 * 
 * Regras:
 * - NÃO deleta nada
 * - NÃO sobrescreve dados existentes
 * - Apenas garante que usuários essenciais existam (upsert)
 * - Apenas garante que planos template existam (skip se já há)
 * - Zero risco de perda de dados
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔒 VittaSys — Seed de Produção (seguro)...');

  // Garantir usuários essenciais (upsert = cria se não existe, não altera se já existe)
  const usuarios = [
    { nome: 'Nágila Santos', cargo: 'Gestora', email: 'nagila@vittalis.com', pin: '2305', perfil: 'master' },
    { nome: 'Miécio Costa', cargo: 'Gestor', email: 'miecio@vittalis.com', pin: '2305', perfil: 'master' },
    { nome: 'Dra. Camila Ferreira', cargo: 'Enfermeira - Ativos', email: 'camila@vittalis.com', pin: '1234', perfil: 'ativos' },
    { nome: 'Téc. Rafael Santos', cargo: 'Técnico - Ativos', email: 'rafael@vittalis.com', pin: '1234', perfil: 'ativos' },
    { nome: 'Dra. Juliana Mendes', cargo: 'Médica - Espontâneos', email: 'juliana@vittalis.com', pin: '1234', perfil: 'espontaneos' },
    { nome: 'Téc. Bruno Almeida', cargo: 'Técnico - Espontâneos', email: 'bruno@vittalis.com', pin: '1234', perfil: 'espontaneos' },
    { nome: 'Amanda Costa', cargo: 'Vendedora - Ativos', email: 'amanda@vittalis.com', pin: '1234', perfil: 'ativos' },
    { nome: 'Enf. Patrícia Lima', cargo: 'Enfermeira - Ativos', email: 'patricia@vittalis.com', pin: '1234', perfil: 'ativos' },
  ];

  let created = 0;
  for (const u of usuarios) {
    const existing = await prisma.usuario.findUnique({ where: { email: u.email } });
    if (!existing) {
      await prisma.usuario.create({ data: u });
      created++;
    }
  }
  if (created > 0) console.log(`  ✓ ${created} novo(s) usuário(s) criado(s)`);
  else console.log('  ✓ Usuários OK (nenhum novo)');

  // Garantir templates de planos (só cria se tabela está vazia)
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
    console.log(`  ✓ ${planos.length} planos template criados`);
  } else {
    console.log(`  ✓ Planos OK (${planosExist} existentes)`);
  }

  console.log('✅ Seed de produção concluído (zero risco)\n');
}

main()
  .catch(e => { console.error('⚠ Seed warning:', e.message); /* NÃO faz process.exit(1) — seed failure não deve impedir deploy */ })
  .finally(() => prisma.$disconnect());
