// ═══ VittaSys — Seed de Homologação (refatorado) ═══
// Execute: node prisma/seed-homolog.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');

// ═══ ENDEREÇOS REAIS DE SÃO LUÍS ═══
const BAIRROS_REGIOES = {
  'Centro / Praia': {
    cor: '#2BBCB3',
    dia: 1,
    bairros: [
      'Renascença',
      'Cohama',
      'Calhau',
      "Ponta D'Areia",
      'São Francisco',
      'Jaracaty',
      'Jardim Renascença',
      "Olho D'Água",
      'Ponta do Farol',
    ],
  },
  'Norte / Oeste': {
    cor: '#1B4965',
    dia: 2,
    bairros: [
      'Anjo da Guarda',
      'Vila Embratel',
      'Liberdade',
      'Fátima',
      'Lira',
      'Centro Histórico',
      'Praia Grande',
      'Madre Deus',
      'João Paulo',
      'Filipinho',
    ],
  },
  Sul: {
    cor: '#F97316',
    dia: 3,
    bairros: [
      'Maiobão',
      'Turu',
      'Aurora',
      'Cohatrac',
      'Vinhais',
      'Bequimão',
      'Ipase',
      'São Cristóvão',
      'Maioba',
      'Pirâmide',
    ],
  },
  Leste: {
    cor: '#7C3AED',
    dia: 4,
    bairros: [
      'Cidade Operária',
      'Anil',
      'Forquilha',
      'Santa Cruz',
      'São Raimundo',
      'Vila Luizão',
      'Coroadinho',
      'Divinéia',
      'Sacavém',
    ],
  },
};

const RUAS = [
  'Rua das Mangabeiras',
  'Rua São Pantaleão',
  'Av. dos Holandeses',
  'Av. Litorânea',
  'Rua do Passeio',
  'Rua dos Afogados',
  'Av. Colares Moreira',
  'Rua da Estrela',
  'Rua do Giz',
  'Av. Daniel de La Touche',
  'Rua Grande',
  'Rua de Nazaré',
  'Av. Jerônimo de Albuquerque',
  'Rua do Sol',
  'Rua Oswaldo Cruz',
  'Av. Castelo Branco',
  'Rua do Ribeirão',
  'Av. São Luís Rei de França',
  'Rua do Areal',
  'Rua Humberto de Campos',
  'Rua dos Guarás',
  'Rua das Cajazeiras',
  'Av. Guajajaras',
  'Rua do Outeiro',
  'Av. dos Africanos',
  'Rua Nina Rodrigues',
  'Rua Cândido Ribeiro',
  'Av. Kennedy',
  'Rua Isaac Martins',
  'Rua Silva Jardim',
  'Rua das Paparaúbas',
  'Rua do Apicum',
  'Av. Marechal Castelo Branco',
  'Rua Barão de Itapary',
  'Rua dos Remédios',
  'Rua 28 de Julho',
  'Rua do Egito',
  'Av. Beira Mar',
  'Rua João Damasceno',
  'Rua do Alecrim',
  'Rua Santa Rita',
  'Rua Jacinto Maia',
  'Rua Afonso Pena',
  'Av. Carlos Cunha',
];

const CONDOMINIOS = [
  'Condomínio Vila dos Pássaros',
  'Residencial Mar e Sol',
  'Condomínio Vida Nova',
  'Residencial Tropical',
  'Ed. Solar do Atlântico',
  'Condomínio Jardim Europa',
  'Residencial Parque Real',
  'Ed. Torre de Prata',
  'Condomínio Reserva dos Lagos',
  'Residencial Mirante do Parque',
  'Ed. Quarto Centenário',
  'Condomínio Tulipas',
  'Residencial Portal do Sol',
  'Ed. São Marcos',
  'Condomínio Villa Romana',
  'Residencial Costa Norte',
];

const VACINAS = [
  { codigo: 'HEP-B', nome: 'Hepatite B', fabricante: 'GSK', categoria: 'Calendário' },
  { codigo: 'HEXA', nome: 'Hexaacelular (DTPa-VIP-Hib-HB)', fabricante: 'GSK', categoria: 'Premium' },
  { codigo: 'PENTA', nome: 'Pentaacelular (DTPa-VIP-Hib)', fabricante: 'Sanofi', categoria: 'Calendário' },
  { codigo: 'ROTA', nome: 'Rotavírus Pentavalente', fabricante: 'MSD', categoria: 'Calendário' },
  { codigo: 'PCV20', nome: 'Pneumocócica 20-valente', fabricante: 'Pfizer', categoria: 'Premium' },
  { codigo: 'MEN-B', nome: 'Meningocócica B (Bexsero)', fabricante: 'GSK', categoria: 'Premium' },
  { codigo: 'MEN-ACWY', nome: 'Meningocócica ACWY', fabricante: 'Pfizer', categoria: 'Premium' },
  { codigo: 'FLU', nome: 'Influenza Quadrivalente', fabricante: 'Sanofi', categoria: 'Sazonal' },
  { codigo: 'FA', nome: 'Febre Amarela', fabricante: 'Fiocruz', categoria: 'Calendário' },
  { codigo: 'SCR', nome: 'Tríplice Viral (SCR)', fabricante: 'GSK', categoria: 'Calendário' },
  { codigo: 'VZ', nome: 'Varicela', fabricante: 'GSK', categoria: 'Calendário' },
  { codigo: 'HEP-A', nome: 'Hepatite A', fabricante: 'GSK', categoria: 'Calendário' },
];

const PLANO_VALORES = {
  'Plano Vacinal 0 a 6 meses': 4200,
  'Plano Vacinal 6 a 12 meses': 3500,
  'Plano Vacinal 12 a 24 meses': 2800,
  'Plano 18 meses': 2500,
  'Plano Nascimento': 1500,
  'Plano Vacinal': 3000,
};

const ALL_BAIRROS = Object.values(BAIRROS_REGIOES).flatMap((r) => r.bairros);

function randomInt(max) {
  return Math.floor(Math.random() * max);
}

function randomPhone() {
  const n = () => Math.floor(Math.random() * 10);
  return `(98) 9${n()}${n()}${n()}${n()}-${n()}${n()}${n()}${n()}`;
}

function randomBairro() {
  return ALL_BAIRROS[randomInt(ALL_BAIRROS.length)];
}

function randomCEP() {
  return `65${randomInt(100).toString().padStart(3, '0')}-${randomInt(1000).toString().padStart(3, '0')}`;
}

function randomAddr(bairro) {
  const rua = RUAS[randomInt(RUAS.length)];
  const num = randomInt(500) + 1;
  const tipo = Math.random();

  if (tipo < 0.3) {
    const cond = CONDOMINIOS[randomInt(CONDOMINIOS.length)];
    const bloco = randomInt(10) + 1;
    const apt = randomInt(800) + 100;
    return `${rua}, Nº ${num}, ${cond}, Bloco ${bloco}, Apt ${apt}, ${bairro}`;
  }

  const refs = [
    'próx. ao mercado',
    'em frente à escola',
    'ao lado da farmácia',
    'próx. à praça',
    'após o posto de gasolina',
    'ao lado da igreja',
  ];
  return `${rua}, Nº ${num}, ${bairro}. Ref: ${refs[randomInt(refs.length)]}`;
}

function isValidDateObject(d) {
  return d instanceof Date && !Number.isNaN(d.getTime());
}

function parseSafeDate(value, fieldName = 'data', context = '') {
  if (!value) return null;
  if (value instanceof Date) return isValidDateObject(value) ? value : null;

  const raw = String(value).trim();
  if (!raw) return null;

  let parsed = null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    parsed = new Date(`${raw}T00:00:00.000Z`);
  } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
    const [dd, mm, yyyy] = raw.split('/').map(Number);
    parsed = new Date(Date.UTC(yyyy, mm - 1, dd));
  } else if (/^\d{2}-\d{2}-\d{4}$/.test(raw)) {
    const [dd, mm, yyyy] = raw.split('-').map(Number);
    parsed = new Date(Date.UTC(yyyy, mm - 1, dd));
  } else {
    parsed = new Date(raw);
  }

  if (!isValidDateObject(parsed)) {
    console.warn(`  ⚠️ Data inválida ignorada em ${fieldName}${context ? ` (${context})` : ''}: ${raw}`);
    return null;
  }

  const year = parsed.getUTCFullYear();
  if (year < 1900 || year > 2100) {
    console.warn(`  ⚠️ Data fora do intervalo ignorada em ${fieldName}${context ? ` (${context})` : ''}: ${raw} -> ${parsed.toISOString()}`);
    return null;
  }

  return parsed;
}

function addMonthsUTC(dateValue, months) {
  const base = parseSafeDate(dateValue);
  if (!base) return null;

  const result = new Date(Date.UTC(
    base.getUTCFullYear(),
    base.getUTCMonth() + months,
    base.getUTCDate()
  ));

  return isValidDateObject(result) ? result : null;
}

function toCompetencia(dateValue) {
  const d = parseSafeDate(dateValue);
  return d ? d.toISOString().slice(0, 7) : null;
}

function extractClientesDataFromFile() {
  const filePath = path.join(__dirname, 'import-clientes-reais.js');

  if (!fs.existsSync(filePath)) {
    console.warn('  ⚠️ import-clientes-reais.js não encontrado. Seed seguirá sem clientes.');
    return [];
  }

  const code = fs.readFileSync(filePath, 'utf8');
  const match = code.match(/const\s+CLIENTES_DATA\s*=\s*(\[[\s\S]*?\]);/);

  if (!match) {
    console.warn('  ⚠️ CLIENTES_DATA não encontrado em import-clientes-reais.js.');
    return [];
  }

  try {
    return JSON.parse(match[1]);
  } catch (error) {
    console.warn(`  ⚠️ Falha ao fazer parse do CLIENTES_DATA: ${error.message}`);
    return [];
  }
}

async function getNextCodigoCliente() {
  const last = await prisma.cliente.findFirst({
    where: { codigoCliente: { startsWith: 'VIT-' } },
    orderBy: { id: 'desc' },
    select: { codigoCliente: true },
  });

  const nextNumber = last?.codigoCliente
    ? Number(last.codigoCliente.replace('VIT-', '')) + 1
    : 1;

  return `VIT-${String(nextNumber).padStart(3, '0')}`;
}

function getPlanoFaixa(nomePlano = '') {
  if (nomePlano.includes('0 a 6')) return { idadeInicio: 0, idadeFim: 6 };
  if (nomePlano.includes('6 a 12')) return { idadeInicio: 6, idadeFim: 12 };
  if (nomePlano.includes('12 a 24')) return { idadeInicio: 12, idadeFim: 24 };
  if (nomePlano.includes('18 meses')) return { idadeInicio: 0, idadeFim: 18 };
  return { idadeInicio: 0, idadeFim: 18 };
}

async function run() {
  console.log('═══════════════════════════════════════════');
  console.log('  VittaSys — Seed de Homologação');
  console.log('═══════════════════════════════════════════\n');

  // 1. USUÁRIOS
  console.log('1. Criando usuários...');
  const usuarios = [
    { nome: 'Nágila Santos', cargo: 'Gestora', email: 'nagila@vittalis.com', pin: '2305', perfil: 'master' },
    { nome: 'Miécio Costa', cargo: 'Gestor', email: 'miecio@vittalis.com', pin: '2305', perfil: 'master' },
    { nome: 'Dra. Camila Ferreira', cargo: 'Enfermeira', email: 'camila@vittalis.com', pin: '1234', perfil: 'ativos' },
    { nome: 'Téc. Rafael Santos', cargo: 'Técnico', email: 'rafael@vittalis.com', pin: '1234', perfil: 'ativos' },
    { nome: 'Dra. Juliana Mendes', cargo: 'Médica', email: 'juliana@vittalis.com', pin: '1234', perfil: 'espontaneos' },
    { nome: 'Téc. Bruno Almeida', cargo: 'Técnico', email: 'bruno@vittalis.com', pin: '1234', perfil: 'espontaneos' },
  ];

  for (const usuario of usuarios) {
    await prisma.usuario.upsert({
      where: { email: usuario.email },
      update: {
        nome: usuario.nome,
        cargo: usuario.cargo,
        pin: usuario.pin,
        perfil: usuario.perfil,
      },
      create: usuario,
    });
  }
  console.log(`  ✓ ${usuarios.length} usuários`);

  // 2. VACINAS
  console.log('2. Criando vacinas...');
  const vacMap = {};

  for (const vacina of VACINAS) {
    const saved = await prisma.vacina.upsert({
      where: { codigo: vacina.codigo },
      update: {
        nome: vacina.nome,
        fabricante: vacina.fabricante,
        categoria: vacina.categoria,
      },
      create: {
        codigo: vacina.codigo,
        nome: vacina.nome,
        fabricante: vacina.fabricante,
        categoria: vacina.categoria,
      },
    });
    vacMap[vacina.codigo] = saved.id;
  }
  console.log(`  ✓ ${Object.keys(vacMap).length} vacinas`);

  // 3. REGIÕES
  console.log('3. Criando regiões...');
  const regMap = {};
  const bairroToReg = {};

  for (const [nome, cfg] of Object.entries(BAIRROS_REGIOES)) {
    const regiao = await prisma.regiao.upsert({
      where: { id: (await prisma.regiao.findFirst({ where: { nome }, select: { id: true } }))?.id || -1 },
      update: {
        nome,
        cor: cfg.cor,
        diaSemana: cfg.dia,
        bairros: cfg.bairros,
      },
      create: {
        nome,
        cor: cfg.cor,
        diaSemana: cfg.dia,
        bairros: cfg.bairros,
      },
    });

    regMap[nome] = regiao.id;
    cfg.bairros.forEach((bairro) => {
      bairroToReg[bairro.toLowerCase()] = regiao.id;
    });
  }
  console.log(`  ✓ ${Object.keys(regMap).length} regiões`);

  // 4. LOTES + UNIDADES
  console.log('4. Criando estoque...');
  const loteValidade = new Date('2027-10-08T00:00:00.000Z');
  const lotesData = [
    { vac: 'HEXA', lote: 'LOTE-VAC-HEXA-20260409-005', qtd: 20, fab: 'GSK' },
    { vac: 'PENTA', lote: 'LOTE-VAC-PENTA-20260409-008', qtd: 20, fab: 'Sanofi' },
    { vac: 'ROTA', lote: 'LOTE-VAC-ROTA-20260409-010', qtd: 20, fab: 'GSK' },
    { vac: 'PCV20', lote: 'LOTE-VAC-PNEUMO20-20260409-009', qtd: 20, fab: 'Pfizer' },
    { vac: 'MEN-B', lote: 'LOTE-VAC-MENB-20260409-007', qtd: 20, fab: 'GSK' },
    { vac: 'MEN-ACWY', lote: 'LOTE-VAC-ACWY-20260409-001', qtd: 20, fab: 'Pfizer' },
    { vac: 'FLU', lote: 'LOTE-VAC-FLU-20260409-011', qtd: 20, fab: 'Sanofi' },
    { vac: 'FA', lote: 'LOTE-VAC-FEBRE-20260409-002', qtd: 20, fab: 'Fiocruz' },
    { vac: 'SCR', lote: 'LOTE-VAC-SCR-20260409-012', qtd: 20, fab: 'GSK' },
    { vac: 'VZ', lote: 'LOTE-VAC-VARICELA-20260409-013', qtd: 20, fab: 'GSK' },
    { vac: 'HEP-A', lote: 'LOTE-VAC-HEPA-20260409-003', qtd: 20, fab: 'GSK' },
    { vac: 'HEP-B', lote: 'LOTE-VAC-HEPB-20260409-004', qtd: 20, fab: 'Butantan' },
  ];

  for (const item of lotesData) {
    let lote = await prisma.lote.findUnique({
      where: { numeroLote: item.lote },
      select: { id: true },
    });

    if (!lote) {
      lote = await prisma.lote.create({
        data: {
          vacinaId: vacMap[item.vac],
          numeroLote: item.lote,
          fabricante: item.fab,
          quantidadeTotal: item.qtd,
          quantidadeDisponivel: item.qtd,
          validade: loteValidade,
          localArmazenamento: 'Câmara Fria Principal',
          valorUnitarioCusto: 100,
        },
        select: { id: true },
      });

      for (let i = 0; i < item.qtd; i++) {
        const codigoBarras = `7891${Date.now()}${item.lote.slice(-3)}${String(i + 1).padStart(4, '0')}`;
        await prisma.unidade.create({
          data: {
            loteId: lote.id,
            codigoBarras,
          },
        });
      }
    }
  }
  console.log(`  ✓ ${lotesData.length} lotes com ${lotesData.reduce((s, l) => s + l.qtd, 0)} unidades`);

  // 5. CLIENTES
  console.log('5. Criando clientes...');
  const clientData = extractClientesDataFromFile();
  let created = 0;
  let planosCriados = 0;
  let dosesCriadas = 0;

  for (const c of clientData) {
    const bairro = randomBairro();
    const endereco = randomAddr(bairro);
    const telefone = randomPhone();
    const regiaoId = bairroToReg[bairro.toLowerCase()] || null;

    const dataNascimento = parseSafeDate(c.dn, 'cliente.dn', c.nome);
    const pacienteNascimento = parseSafeDate(c.dn, 'cliente.pacienteNascimento', c.nome);

    let cliente = await prisma.cliente.findFirst({
      where: { nome: c.nome },
      select: { id: true, nome: true },
    });

    if (cliente) {
      await prisma.cliente.update({
        where: { id: cliente.id },
        data: {
          telefone,
          endereco,
          bairro,
          cep: randomCEP(),
          regiaoId,
          responsavelTelefone: c.mae ? randomPhone() : null,
          dataNascimento,
          pacienteNascimento,
        },
      });
    } else {
      const codigoCliente = await getNextCodigoCliente();

      cliente = await prisma.cliente.create({
        data: {
          nome: c.nome,
          codigoCliente,
          dataNascimento,
          tipoPaciente: 'crianca',
          tipoCliente: 'ativo',
          responsavelNome: c.mae || null,
          responsavelParentesco: c.mae ? 'mae' : null,
          telefone,
          responsavelTelefone: c.mae ? randomPhone() : null,
          pacienteNome: c.nome,
          pacienteNascimento,
          status: 'ativo',
          endereco,
          bairro,
          cep: randomCEP(),
          regiaoId,
        },
        select: { id: true, nome: true },
      });
      created++;
    }

    if (!Array.isArray(c.doses) || c.doses.length === 0) {
      continue;
    }

    const existPlan = await prisma.planoContratado.findFirst({
      where: {
        clienteId: cliente.id,
        nomePlano: c.plano,
      },
      select: { id: true },
    });

    if (existPlan) continue;

    const valor = PLANO_VALORES[c.plano] || 3000;
    const statusContrato = c.status === 'finalizado' ? 'finalizado' : 'ativo';
    const faixa = getPlanoFaixa(c.plano || '');

    const plano = await prisma.planoContratado.create({
      data: {
        clienteId: cliente.id,
        nomePlano: c.plano || 'Plano Vacinal',
        valorBruto: valor,
        valorFinal: valor,
        percentualDesconto: 0,
        margemLucro: 100,
        statusContrato,
        idadeInicio: faixa.idadeInicio,
        idadeFim: faixa.idadeFim,
      },
      select: { id: true },
    });
    planosCriados++;

    let mesBase = 2;

    for (const dose of c.doses) {
      const vacinaId = vacMap[dose.codigo];
      if (!vacinaId) continue;

      const doseStatus = statusContrato === 'finalizado' ? 'aplicada' : (dose.status || 'pendente');
      const dataAplicacao = doseStatus === 'aplicada'
        ? parseSafeDate(dose.data, 'dose.dataAplicacao', `${c.nome} / ${dose.codigo}`) || new Date()
        : null;

      const competenciaBase = addMonthsUTC(c.dn, mesBase);

      await prisma.planoContratadoDose.create({
        data: {
          planoContratadoId: plano.id,
          vacinaId,
          doseNumero: Number(dose.dose) || 1,
          mesPrevisto: mesBase,
          competencia: toCompetencia(competenciaBase),
          status: doseStatus,
          dataAplicacao,
        },
      });

      dosesCriadas++;
      mesBase += 2;
    }
  }

  // 6. CORRIGIR PLANOS FINALIZADOS
  console.log('6. Corrigindo planos finalizados...');
  const fixResult = await prisma.$executeRaw`
    UPDATE plano_contratado_doses
    SET status = 'aplicada',
        data_aplicacao = COALESCE(data_aplicacao, NOW())
    WHERE plano_contratado_id IN (
      SELECT id
      FROM planos_contratados
      WHERE status_contrato = 'finalizado'
    )
      AND status = 'pendente'
  `;
  console.log(`  ✓ ${fixResult} doses corrigidas`);

  // RESULTADO FINAL
  const stats = await Promise.all([
    prisma.usuario.count(),
    prisma.vacina.count(),
    prisma.regiao.count(),
    prisma.lote.count(),
    prisma.unidade.count(),
    prisma.cliente.count(),
    prisma.planoContratado.count(),
    prisma.planoContratadoDose.count(),
  ]);

  console.log('\n═══════════════════════════════════════════');
  console.log('  RESULTADO FINAL');
  console.log('═══════════════════════════════════════════');
  console.log(`  Usuários:     ${stats[0]}`);
  console.log(`  Vacinas:      ${stats[1]}`);
  console.log(`  Regiões:      ${stats[2]}`);
  console.log(`  Lotes:        ${stats[3]}`);
  console.log(`  Unidades:     ${stats[4]}`);
  console.log(`  Clientes:     ${stats[5]} (${created} novos)`);
  console.log(`  Planos:       ${stats[6]} (${planosCriados} novos)`);
  console.log(`  Doses:        ${stats[7]} (${dosesCriadas} novas)`);
  console.log('═══════════════════════════════════════════\n');

  await prisma.$disconnect();
}

run().catch(async (e) => {
  console.error('❌ Erro:', e);
  await prisma.$disconnect();
  process.exit(1);
});