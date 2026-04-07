const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });

async function resetDB() {
  const tables = ['retiradas_recentes','movimentacoes','pagamentos','plano_contratado_doses',
    'planos_contratados','unidades','lotes','vacinas','clientes','metas_financeiras'];
  for (const t of tables) {
    await prisma.$executeRawUnsafe(`DELETE FROM ${t}`);
  }
}

async function seedTestData() {
  await resetDB();
  // Create test user
  const user = await prisma.usuario.upsert({
    where: { email: 'test@vittalis.com' },
    update: {},
    create: { nome: 'Test User', cargo: 'Tester', email: 'test@vittalis.com', pin: '1234', perfil: 'master' },
  });
  // Create test vaccine
  const vacina = await prisma.vacina.create({
    data: { codigo: 'TEST-001', nome: 'Vacina Teste', fabricante: 'Lab Teste', valorCustoMedio: 100 },
  });
  // Create test lot
  const lote = await prisma.lote.create({
    data: { vacinaId: vacina.id, numeroLote: 'LOT-TEST-001', fabricante: 'Lab Teste',
      quantidadeTotal: 10, quantidadeDisponivel: 10, validade: new Date('2027-12-31') },
  });
  // Create test units
  for (let i = 1; i <= 10; i++) {
    await prisma.unidade.create({ data: { loteId: lote.id, codigoBarras: `TEST-CB-${String(i).padStart(3,'0')}` } });
  }
  // Create test client
  const cliente = await prisma.cliente.create({
    data: { nome: 'Paciente Teste', cpf: '12345678901', telefone: '99999999999',
      dataNascimento: new Date('2000-01-01'), tipoCliente: 'espontaneo', codigoCliente: 'TST-001' },
  });
  return { user, vacina, lote, cliente };
}

module.exports = { prisma, resetDB, seedTestData };
