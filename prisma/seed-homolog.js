// ═══ VittaSys — Seed de Homologação (dados completos) ═══
// Execute: node prisma/seed-homolog.js
// Preenche TODA a base com dados realistas de São Luís

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');

// ═══ ENDEREÇOS REAIS DE SÃO LUÍS ═══
const BAIRROS_REGIOES = {
  'Centro / Praia': {cor:'#2BBCB3',dia:1,bairros:['Renascença','Cohama','Calhau','Ponta D\'Areia','São Francisco','Jaracaty','Jardim Renascença','Olho D\'Água','Ponta do Farol']},
  'Norte / Oeste': {cor:'#1B4965',dia:2,bairros:['Anjo da Guarda','Vila Embratel','Liberdade','Fátima','Lira','Centro Histórico','Praia Grande','Madre Deus','João Paulo','Filipinho']},
  'Sul': {cor:'#F97316',dia:3,bairros:['Maiobão','Turu','Aurora','Cohatrac','Vinhais','Bequimão','Ipase','São Cristóvão','Maioba','Pirâmide']},
  'Leste': {cor:'#7C3AED',dia:4,bairros:['Cidade Operária','Anil','Forquilha','Santa Cruz','São Raimundo','Vila Luizão','Coroadinho','Divinéia','Sacavém']},
};

const RUAS = [
  'Rua das Mangabeiras','Rua São Pantaleão','Av. dos Holandeses','Av. Litorânea','Rua do Passeio',
  'Rua dos Afogados','Av. Colares Moreira','Rua da Estrela','Rua do Giz','Av. Daniel de La Touche',
  'Rua Grande','Rua de Nazaré','Av. Jerônimo de Albuquerque','Rua do Sol','Rua Oswaldo Cruz',
  'Av. Castelo Branco','Rua do Ribeirão','Av. São Luís Rei de França','Rua do Areal','Rua Humberto de Campos',
  'Rua dos Guarás','Rua das Cajazeiras','Av. Guajajaras','Rua do Outeiro','Av. dos Africanos',
  'Rua Nina Rodrigues','Rua Cândido Ribeiro','Av. Kennedy','Rua Isaac Martins','Rua Silva Jardim',
  'Rua das Paparaúbas','Rua do Apicum','Av. Marechal Castelo Branco','Rua Barão de Itapary',
  'Rua dos Remédios','Rua 28 de Julho','Rua do Egito','Av. Beira Mar','Rua João Damasceno',
  'Rua do Alecrim','Rua Santa Rita','Rua Jacinto Maia','Rua Afonso Pena','Av. Carlos Cunha',
];

const CONDOMINIOS = [
  'Condomínio Vila dos Pássaros','Residencial Mar e Sol','Condomínio Vida Nova','Residencial Tropical',
  'Ed. Solar do Atlântico','Condomínio Jardim Europa','Residencial Parque Real','Ed. Torre de Prata',
  'Condomínio Reserva dos Lagos','Residencial Mirante do Parque','Ed. Quarto Centenário','Condomínio Tulipas',
  'Residencial Portal do Sol','Ed. São Marcos','Condomínio Villa Romana','Residencial Costa Norte',
];

function randomPhone() {
  const n = () => Math.floor(Math.random() * 10);
  return `(98) 9${n()}${n()}${n()}${n()}-${n()}${n()}${n()}${n()}`;
}

function randomAddr(bairro) {
  const rua = RUAS[Math.floor(Math.random() * RUAS.length)];
  const num = Math.floor(Math.random() * 500) + 1;
  const tipo = Math.random();
  if (tipo < 0.3) {
    const cond = CONDOMINIOS[Math.floor(Math.random() * CONDOMINIOS.length)];
    const bloco = Math.floor(Math.random() * 10) + 1;
    const apt = Math.floor(Math.random() * 800) + 100;
    return `${rua}, Nº ${num}, ${cond}, Bloco ${bloco}, Apt ${apt}, ${bairro}`;
  }
  const ref = ['próx. ao mercado','em frente à escola','ao lado da farmácia','próx. à praça','após o posto de gasolina','ao lado da igreja'][Math.floor(Math.random()*6)];
  return `${rua}, Nº ${num}, ${bairro}. Ref: ${ref}`;
}

function randomCEP() {
  return `65${Math.floor(Math.random()*100).toString().padStart(3,'0')}-${Math.floor(Math.random()*1000).toString().padStart(3,'0')}`;
}

// All bairros flat
const ALL_BAIRROS = Object.values(BAIRROS_REGIOES).flatMap(r => r.bairros);
function randomBairro() { return ALL_BAIRROS[Math.floor(Math.random() * ALL_BAIRROS.length)]; }

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

async function run() {
  console.log('═══════════════════════════════════════════');
  console.log('  VittaSys — Seed de Homologação');
  console.log('═══════════════════════════════════════════\n');

  // ═══ 1. USUÁRIOS ═══
  console.log('1. Criando usuários...');
  const usuarios = [
    { nome: 'Nágila Santos', cargo: 'Gestora', email: 'nagila@vittalis.com', pin: '2305', perfil: 'master' },
    { nome: 'Miécio Costa', cargo: 'Gestor', email: 'miecio@vittalis.com', pin: '2305', perfil: 'master' },
    { nome: 'Dra. Camila Ferreira', cargo: 'Enfermeira', email: 'camila@vittalis.com', pin: '1234', perfil: 'ativos' },
    { nome: 'Téc. Rafael Santos', cargo: 'Técnico', email: 'rafael@vittalis.com', pin: '1234', perfil: 'ativos' },
    { nome: 'Dra. Juliana Mendes', cargo: 'Médica', email: 'juliana@vittalis.com', pin: '1234', perfil: 'espontaneos' },
    { nome: 'Téc. Bruno Almeida', cargo: 'Técnico', email: 'bruno@vittalis.com', pin: '1234', perfil: 'espontaneos' },
  ];
  for (const u of usuarios) {
    await prisma.usuario.upsert({ where: { email: u.email }, update: {}, create: u });
  }
  console.log(`  ✓ ${usuarios.length} usuários`);

  // ═══ 2. VACINAS ═══
  console.log('2. Criando vacinas...');
  const vacMap = {};
  for (const v of VACINAS) {
    let vac = await prisma.vacina.findUnique({ where: { codigo: v.codigo } });
    if (!vac) vac = await prisma.vacina.create({ data: { codigo: v.codigo, nome: v.nome, fabricante: v.fabricante, categoria: v.categoria } });
    vacMap[v.codigo] = vac.id;
  }
  console.log(`  ✓ ${Object.keys(vacMap).length} vacinas`);

  // ═══ 3. REGIÕES ═══
  console.log('3. Criando regiões...');
  const regMap = {};
  const bairroToReg = {};
  for (const [nome, cfg] of Object.entries(BAIRROS_REGIOES)) {
    let reg = await prisma.regiao.findFirst({ where: { nome } });
    if (!reg) reg = await prisma.regiao.create({ data: { nome, cor: cfg.cor, diaSemana: cfg.dia, bairros: cfg.bairros } });
    regMap[nome] = reg.id;
    cfg.bairros.forEach(b => { bairroToReg[b.toLowerCase()] = reg.id; });
  }
  console.log(`  ✓ ${Object.keys(regMap).length} regiões`);

  // ═══ 4. LOTES + UNIDADES ═══
  console.log('4. Criando estoque...');
  const loteDate = new Date('2027-10-08');
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
    { vac: 'VZ', lote: 'LOTE-VAC-VARICELA-20260409-012', qtd: 20, fab: 'GSK' },
    { vac: 'HEP-A', lote: 'LOTE-VAC-HEPA-20260409-003', qtd: 20, fab: 'GSK' },
    { vac: 'HEP-B', lote: 'LOTE-VAC-HEPB-20260409-004', qtd: 20, fab: 'Butantan' },
  ];
  for (const ld of lotesData) {
    let lote = await prisma.lote.findUnique({ where: { numeroLote: ld.lote } });
    if (!lote) {
      lote = await prisma.lote.create({ data: {
        vacinaId: vacMap[ld.vac], numeroLote: ld.lote, fabricante: ld.fab,
        quantidadeTotal: ld.qtd, quantidadeDisponivel: ld.qtd,
        validade: loteDate, localArmazenamento: 'Câmara Fria Principal',
        valorUnitarioCusto: 100
      }});
      // Create units
      const barcode = '7891' + Math.floor(Math.random() * 99999999).toString().padStart(8, '0');
      for (let i = 0; i < ld.qtd; i++) {
        await prisma.unidade.create({ data: { loteId: lote.id, codigoBarras: barcode } });
      }
    }
  }
  console.log(`  ✓ ${lotesData.length} lotes com ${lotesData.reduce((s,l)=>s+l.qtd,0)} unidades`);

  // ═══ 5. CLIENTES ═══
  console.log('5. Criando clientes...');
  let clientData;
  try {
    const code = fs.readFileSync(__dirname + '/import-clientes-reais.js', 'utf8');
    const match = code.match(/const CLIENTES_DATA = (\[[\s\S]*?\]);/);
    clientData = JSON.parse(match[1]);
  } catch (e) {
    console.error('  ❌ Não encontrou import-clientes-reais.js, usando dados básicos');
    clientData = [];
  }

  let created = 0, planos = 0, doses = 0, errors = 0;
  for (const c of clientData) {
   try {
    const bairro = randomBairro();
    const endereco = randomAddr(bairro);
    const telefone = randomPhone();
    const regiaoId = bairroToReg[bairro.toLowerCase()] || null;

    // Check if exists
    let cli = await prisma.cliente.findFirst({ where: { nome: c.nome } });
    if (cli) {
      // Update with address/phone
      await prisma.cliente.update({ where: { id: cli.id }, data: {
        telefone, endereco, bairro, cep: randomCEP(), regiaoId,
        responsavelTelefone: c.mae ? randomPhone() : null,
      }});
    } else {
      // Create
      const last = await prisma.cliente.findFirst({
        where: { codigoCliente: { startsWith: 'VIT-' } },
        orderBy: { id: 'desc' }
      });
      const n = last ? parseInt(last.codigoCliente.replace('VIT-', '')) + 1 : 1;
      const codigo = 'VIT-' + String(n).padStart(3, '0');

      cli = await prisma.cliente.create({ data: {
        nome: c.nome,
        codigoCliente: codigo,
        dataNascimento: c.dn ? (()=>{const d=new Date(c.dn);return d.getFullYear()>1950&&d.getFullYear()<2030?d:null})() : null,
        tipoPaciente: 'crianca',
        tipoCliente: 'ativo',
        responsavelNome: c.mae || null,
        responsavelParentesco: c.mae ? 'mae' : null,
        telefone,
        responsavelTelefone: c.mae ? randomPhone() : null,
        pacienteNome: c.nome,
        pacienteNascimento: c.dn ? (()=>{const d=new Date(c.dn);return d.getFullYear()>1950&&d.getFullYear()<2030?d:null})() : null,
        status: 'ativo',
        endereco,
        bairro,
        cep: randomCEP(),
        regiaoId,
      }});
      created++;
    }

    // Create plan if has doses
    if (c.doses && c.doses.length > 0) {
      const existPlan = await prisma.planoContratado.findFirst({
        where: { clienteId: cli.id, nomePlano: c.plano }
      });
      if (!existPlan) {
        const valor = PLANO_VALORES[c.plano] || 3000;
        const statusContrato = c.status === 'finalizado' ? 'finalizado' : 'ativo';
        const plano = await prisma.planoContratado.create({ data: {
          clienteId: cli.id, nomePlano: c.plano, valorBruto: valor, valorFinal: valor,
          percentualDesconto: 0, margemLucro: 100, statusContrato,
          idadeInicio: c.plano.includes('0 a 6') ? 0 : c.plano.includes('6 a 12') ? 6 : 0,
          idadeFim: c.plano.includes('0 a 6') ? 6 : c.plano.includes('6 a 12') ? 12 : 18,
        }});
        planos++;

        let mesBase = 2;
        for (const d of c.doses) {
          const vacinaId = vacMap[d.codigo];
          if (!vacinaId) continue;
          const doseStatus = statusContrato === 'finalizado' ? 'aplicada' : d.status;
          await prisma.planoContratadoDose.create({ data: {
            planoContratadoId: plano.id, vacinaId, doseNumero: d.dose,
            mesPrevisto: mesBase,
            competencia: c.dn ? (()=>{const d=new Date(c.dn);if(d.getFullYear()<1950||d.getFullYear()>2030)return null;return new Date(d.setMonth(d.getMonth()+mesBase)).toISOString().slice(0,7)})() : null,
            status: doseStatus,
            dataAplicacao: doseStatus === 'aplicada' ? (d.data ? (()=>{const dt=new Date(d.data);return dt.getFullYear()>1950&&dt.getFullYear()<2030?dt:new Date()})() : new Date()) : null,
          }});
          doses++;
          mesBase += 2;
        }
      }
    }
   } catch(e) { console.log(`  ⚠ Erro: ${c.nome}: ${e.message.slice(0,60)}`); errors++; }
  }

  // ═══ 6. FIX: Finalizado plans → all doses applied ═══
  console.log('6. Corrigindo planos finalizados...');
  const fixResult = await prisma.$executeRaw`
    UPDATE plano_contratado_doses 
    SET status = 'aplicada', data_aplicacao = COALESCE(data_aplicacao, NOW())
    WHERE plano_contratado_id IN (
      SELECT id FROM planos_contratados WHERE status_contrato = 'finalizado'
    ) AND status = 'pendente'`;
  console.log(`  ✓ ${fixResult} doses corrigidas`);

  // ═══ RESULTADO ═══
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
  console.log(`  Planos:       ${stats[6]} (${planos} novos)`);
  console.log(`  Doses:        ${stats[7]} (${doses} novas)`);
  if(errors)console.log(`  ⚠ Erros:      ${errors} (ignorados)`);
  console.log('═══════════════════════════════════════════\n');

  await prisma.$disconnect();
}

run().catch(e => { console.error('❌ Erro:', e.message); process.exit(1); });
