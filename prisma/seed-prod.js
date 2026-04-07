/**
 * SEED DE PRODUÇÃO — Seguro para rodar em todo deploy.
 * - NÃO deleta nada
 * - Apenas garante que dados essenciais existam (upsert/findFirst)
 * - Zero risco de perda de dados
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔒 VittaSys — Seed de Produção (seguro)...');

  // ═══ 1. USUÁRIOS ═══
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
  let userCreated = 0;
  for (const u of usuarios) {
    const ex = await prisma.usuario.findUnique({ where: { email: u.email } });
    if (!ex) { await prisma.usuario.create({ data: u }); userCreated++; }
  }
  console.log(`  ✓ Usuários: ${userCreated} novo(s)`);

  // ═══ 2. VACINAS DO CALENDÁRIO (upsert by codigo) ═══
  const vacinas = [
    { codigo: 'HEP-B', nome: 'Hepatite B', fabricante: 'GSK', categoria: 'Calendário' },
    { codigo: 'HEXA', nome: 'Hexaacelular (DTPa-VIP-Hib-HB)', fabricante: 'GSK', categoria: 'Premium' },
    { codigo: 'PENTA', nome: 'Pentaacelular (DTPa-VIP-Hib)', fabricante: 'Sanofi', categoria: 'Calendário' },
    { codigo: 'ROTA', nome: 'Rotavírus Pentavalente', fabricante: 'MSD', categoria: 'Calendário' },
    { codigo: 'PCV20', nome: 'Pneumocócica 20-valente', fabricante: 'Pfizer', categoria: 'Premium' },
    { codigo: 'MEN-B', nome: 'Meningocócica B (Bexsero)', fabricante: 'GSK', categoria: 'Premium' },
    { codigo: 'MEN-ACWY', nome: 'Meningocócica ACWY', fabricante: 'GSK', categoria: 'Premium' },
    { codigo: 'FLU', nome: 'Influenza Quadrivalente', fabricante: 'Sanofi', categoria: 'Sazonal' },
    { codigo: 'FA', nome: 'Febre Amarela', fabricante: 'Bio-Manguinhos', categoria: 'Calendário' },
    { codigo: 'SCR', nome: 'Tríplice Viral (SCR)', fabricante: 'GSK', categoria: 'Calendário' },
    { codigo: 'VZ', nome: 'Varicela', fabricante: 'GSK', categoria: 'Calendário' },
    { codigo: 'HEP-A', nome: 'Hepatite A', fabricante: 'GSK', categoria: 'Calendário' },
  ];
  const vacinaMap = {};
  for (const v of vacinas) {
    let vac = await prisma.vacina.findUnique({ where: { codigo: v.codigo } });
    if (!vac) vac = await prisma.vacina.create({ data: v });
    vacinaMap[v.codigo] = vac.id;
  }
  console.log(`  ✓ Vacinas do calendário: ${Object.keys(vacinaMap).length} verificadas`);

  // ═══ 3. PLANOS VACINAIS COM VACINAS ASSOCIADAS ═══
  const planosDef = [
    {
      nome: 'Plano Vacinal Completo 0 a 18 meses',
      idadeInicio: 0, idadeFim: 18, valorTabela: 13630, validadeMeses: 18,
      descricao: 'Plano completo com todas as vacinas premium de 0 a 18 meses. Valor à vista: R$ 9.200 | Crédito: R$ 9.450',
      vacinas: [
        { cod: 'HEP-B', doses: 1, ini: 0, fim: 0 },
        { cod: 'HEXA', doses: 2, ini: 2, fim: 6 },
        { cod: 'PENTA', doses: 2, ini: 4, fim: 16 },
        { cod: 'ROTA', doses: 3, ini: 2, fim: 6 },
        { cod: 'PCV20', doses: 4, ini: 2, fim: 13 },
        { cod: 'MEN-B', doses: 3, ini: 3, fim: 13 },
        { cod: 'MEN-ACWY', doses: 3, ini: 3, fim: 13 },
        { cod: 'FLU', doses: 3, ini: 6, fim: 18 },
        { cod: 'FA', doses: 1, ini: 9, fim: 9 },
        { cod: 'SCR', doses: 2, ini: 12, fim: 15 },
        { cod: 'VZ', doses: 2, ini: 12, fim: 15 },
        { cod: 'HEP-A', doses: 2, ini: 12, fim: 18 },
      ]
    },
    {
      nome: 'Plano Vacinal 0 a 9 meses',
      idadeInicio: 0, idadeFim: 9, valorTabela: 8760, validadeMeses: 9,
      descricao: 'Plano premium de 0 a 9 meses. Valor à vista: R$ 6.200 | Crédito: R$ 6.500',
      vacinas: [
        { cod: 'HEP-B', doses: 1, ini: 0, fim: 0 },
        { cod: 'HEXA', doses: 2, ini: 2, fim: 6 },
        { cod: 'PENTA', doses: 1, ini: 4, fim: 4 },
        { cod: 'ROTA', doses: 3, ini: 2, fim: 6 },
        { cod: 'PCV20', doses: 3, ini: 2, fim: 6 },
        { cod: 'MEN-B', doses: 2, ini: 3, fim: 5 },
        { cod: 'MEN-ACWY', doses: 2, ini: 3, fim: 5 },
        { cod: 'FLU', doses: 2, ini: 6, fim: 7 },
        { cod: 'FA', doses: 1, ini: 9, fim: 9 },
      ]
    },
    {
      nome: 'Plano Vacinal 2 a 9 meses',
      idadeInicio: 2, idadeFim: 9, valorTabela: 7200, validadeMeses: 7,
      descricao: 'Plano de 2 a 9 meses sem a dose de nascimento',
      vacinas: [
        { cod: 'HEXA', doses: 2, ini: 2, fim: 6 },
        { cod: 'PENTA', doses: 1, ini: 4, fim: 4 },
        { cod: 'ROTA', doses: 3, ini: 2, fim: 6 },
        { cod: 'PCV20', doses: 3, ini: 2, fim: 6 },
        { cod: 'MEN-B', doses: 2, ini: 3, fim: 5 },
        { cod: 'MEN-ACWY', doses: 2, ini: 3, fim: 5 },
        { cod: 'FLU', doses: 2, ini: 6, fim: 7 },
        { cod: 'FA', doses: 1, ini: 9, fim: 9 },
      ]
    },
    {
      nome: 'Plano Vacinal 0 a 6 meses',
      idadeInicio: 0, idadeFim: 6, valorTabela: 5800, validadeMeses: 6,
      descricao: 'Plano básico de 0 a 6 meses',
      vacinas: [
        { cod: 'HEP-B', doses: 1, ini: 0, fim: 0 },
        { cod: 'HEXA', doses: 2, ini: 2, fim: 6 },
        { cod: 'PENTA', doses: 1, ini: 4, fim: 4 },
        { cod: 'ROTA', doses: 3, ini: 2, fim: 6 },
        { cod: 'PCV20', doses: 3, ini: 2, fim: 6 },
        { cod: 'MEN-B', doses: 2, ini: 3, fim: 5 },
        { cod: 'MEN-ACWY', doses: 2, ini: 3, fim: 5 },
        { cod: 'FLU', doses: 1, ini: 6, fim: 6 },
      ]
    },
    {
      nome: 'Plano Vacinal 2 a 6 meses',
      idadeInicio: 2, idadeFim: 6, valorTabela: 5200, validadeMeses: 4,
      descricao: 'Plano de 2 a 6 meses sem dose de nascimento',
      vacinas: [
        { cod: 'HEXA', doses: 2, ini: 2, fim: 6 },
        { cod: 'PENTA', doses: 1, ini: 4, fim: 4 },
        { cod: 'ROTA', doses: 3, ini: 2, fim: 6 },
        { cod: 'PCV20', doses: 3, ini: 2, fim: 6 },
        { cod: 'MEN-B', doses: 2, ini: 3, fim: 5 },
        { cod: 'MEN-ACWY', doses: 2, ini: 3, fim: 5 },
        { cod: 'FLU', doses: 1, ini: 6, fim: 6 },
      ]
    },
    {
      nome: 'Plano Vacinal 2 a 18 meses',
      idadeInicio: 2, idadeFim: 18, valorTabela: 12800, validadeMeses: 16,
      descricao: 'Plano completo de 2 a 18 meses sem dose de nascimento',
      vacinas: [
        { cod: 'HEXA', doses: 2, ini: 2, fim: 6 },
        { cod: 'PENTA', doses: 2, ini: 4, fim: 16 },
        { cod: 'ROTA', doses: 3, ini: 2, fim: 6 },
        { cod: 'PCV20', doses: 4, ini: 2, fim: 13 },
        { cod: 'MEN-B', doses: 3, ini: 3, fim: 13 },
        { cod: 'MEN-ACWY', doses: 3, ini: 3, fim: 13 },
        { cod: 'FLU', doses: 3, ini: 6, fim: 18 },
        { cod: 'FA', doses: 1, ini: 9, fim: 9 },
        { cod: 'SCR', doses: 2, ini: 12, fim: 15 },
        { cod: 'VZ', doses: 2, ini: 12, fim: 15 },
        { cod: 'HEP-A', doses: 2, ini: 12, fim: 18 },
      ]
    },
  ];

  // Delete old planos (without contracts) and recreate
  const existingPlanos = await prisma.plano.count();
  if (existingPlanos === 0) {
    for (const pd of planosDef) {
      const plano = await prisma.plano.create({
        data: { nome: pd.nome, descricao: pd.descricao, idadeInicio: pd.idadeInicio, idadeFim: pd.idadeFim, valorTabela: pd.valorTabela, validadeMeses: pd.validadeMeses }
      });
      for (const v of pd.vacinas) {
        if (vacinaMap[v.cod]) {
          await prisma.planoVacina.create({ data: { planoId: plano.id, vacinaId: vacinaMap[v.cod], doses: v.doses, mesPrevInicio: v.ini, mesPrevFim: v.fim } });
        }
      }
    }
    console.log(`  ✓ ${planosDef.length} planos vacinais com vacinas associadas criados`);
  } else {
    // Check if PlanoVacina records exist for existing planos
    const pvCount = await prisma.planoVacina.count();
    if (pvCount === 0) {
      // Add vaccines to existing planos
      const existingP = await prisma.plano.findMany();
      for (const ep of existingP) {
        const match = planosDef.find(pd => pd.nome === ep.nome || (pd.idadeInicio === ep.idadeInicio && pd.idadeFim === ep.idadeFim));
        if (match) {
          for (const v of match.vacinas) {
            if (vacinaMap[v.cod]) {
              try { await prisma.planoVacina.create({ data: { planoId: ep.id, vacinaId: vacinaMap[v.cod], doses: v.doses, mesPrevInicio: v.ini, mesPrevFim: v.fim } }); } catch(e) {}
            }
          }
        }
      }
      console.log(`  ✓ Vacinas associadas a ${existingP.length} planos existentes`);
    } else {
      console.log(`  ✓ Planos OK (${existingPlanos} planos, ${pvCount} vacinas associadas)`);
    }
  }

  console.log('✅ Seed de produção concluído\n');
}

main()
  .catch(e => { console.error('⚠ Seed warning:', e.message); })
  .finally(() => prisma.$disconnect());
