const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 VittaSys — Seed de dados iniciais...\n');

  // ═══ VACINAS ═══
  const vaccines = await Promise.all([
    prisma.vaccine.create({ data: { name: 'BCG', manufacturer: 'Ataulpho de Paiva', dosesTotal: 1, description: 'Tuberculose' } }),
    prisma.vaccine.create({ data: { name: 'Hepatite B', manufacturer: 'Butantan', dosesTotal: 3, description: 'Hepatite B recombinante' } }),
    prisma.vaccine.create({ data: { name: 'Pentavalente', manufacturer: 'Butantan', dosesTotal: 3, description: 'DTP+Hib+HB' } }),
    prisma.vaccine.create({ data: { name: 'Pneumocócica 13v', manufacturer: 'Pfizer', dosesTotal: 3, description: 'Pneumocócica conjugada' } }),
    prisma.vaccine.create({ data: { name: 'Rotavírus', manufacturer: 'MSD', dosesTotal: 2, description: 'Rotavírus pentavalente' } }),
    prisma.vaccine.create({ data: { name: 'Meningocócica B', manufacturer: 'GSK', dosesTotal: 2, description: 'Bexsero' } }),
    prisma.vaccine.create({ data: { name: 'Meningocócica ACWY', manufacturer: 'GSK', dosesTotal: 2, description: 'Nimenrix' } }),
    prisma.vaccine.create({ data: { name: 'Febre Amarela', manufacturer: 'Bio-Manguinhos', dosesTotal: 1, description: 'Vírus atenuado' } }),
    prisma.vaccine.create({ data: { name: 'Tríplice Viral', manufacturer: 'Bio-Manguinhos', dosesTotal: 2, description: 'Sarampo, Caxumba, Rubéola' } }),
    prisma.vaccine.create({ data: { name: 'Hepatite A', manufacturer: 'GSK', dosesTotal: 2, description: 'Vírus inativado' } }),
    prisma.vaccine.create({ data: { name: 'Influenza Quadrivalente', manufacturer: 'Butantan', dosesTotal: 1, description: 'Gripe sazonal' } }),
    prisma.vaccine.create({ data: { name: 'HPV Quadrivalente', manufacturer: 'MSD', dosesTotal: 2, description: 'HPV 6/11/16/18' } }),
  ]);
  console.log(`  ✓ ${vaccines.length} vacinas`);

  // ═══ LOTES ═══
  const d = (days) => { const dt = new Date(); dt.setDate(dt.getDate() + days); return dt; };
  const batches = [];
  for (const vac of vaccines) {
    for (let i = 1; i <= 2; i++) {
      const qty = 20 + Math.floor(Math.random() * 80);
      const daysToExpire = 60 + Math.floor(Math.random() * 300);
      batches.push(await prisma.batch.create({
        data: {
          vaccineId: vac.id,
          batchNumber: `${vac.name.replace(/\s/g, '').slice(0, 6).toUpperCase()}-2026${String(i).padStart(2, '0')}`,
          expirationDate: d(daysToExpire),
          quantityTotal: qty,
          quantityAvailable: qty - Math.floor(Math.random() * 10),
        },
      }));
    }
  }
  console.log(`  ✓ ${batches.length} lotes`);

  // ═══ PACIENTES ═══
  const patients = await Promise.all([
    prisma.patient.create({ data: { name: 'Miguel Oliveira Santos', cpf: '11122233301', birthDate: new Date('2025-01-15'), phone: '(98) 99111-0001' } }),
    prisma.patient.create({ data: { name: 'Helena Costa Silva', cpf: '11122233302', birthDate: new Date('2024-06-20'), phone: '(98) 99111-0002' } }),
    prisma.patient.create({ data: { name: 'Arthur Ferreira Lima', cpf: '11122233303', birthDate: new Date('2024-03-10'), phone: '(98) 99111-0003' } }),
    prisma.patient.create({ data: { name: 'Laura Mendes Rocha', cpf: '11122233304', birthDate: new Date('2023-09-05'), phone: '(98) 99111-0004' } }),
    prisma.patient.create({ data: { name: 'Maria da Silva', cpf: '98765432101', birthDate: new Date('1985-03-15'), phone: '(98) 98765-0001' } }),
    prisma.patient.create({ data: { name: 'João Pedro Oliveira', cpf: '98765432102', birthDate: new Date('1990-07-22'), phone: '(98) 98765-0002' } }),
  ]);
  console.log(`  ✓ ${patients.length} pacientes`);

  // ═══ PLANOS VACINAIS ═══
  const packages = await Promise.all([
    prisma.vaccinePackage.create({ data: { patientId: patients[0].id, packageName: 'Plano 0 a 18 meses', totalDoses: 24, dosesUsed: 3 } }),
    prisma.vaccinePackage.create({ data: { patientId: patients[1].id, packageName: 'Plano 0 a 9 meses', totalDoses: 16, dosesUsed: 5 } }),
    prisma.vaccinePackage.create({ data: { patientId: patients[2].id, packageName: 'Plano 2 a 6 meses', totalDoses: 10, dosesUsed: 2 } }),
    prisma.vaccinePackage.create({ data: { patientId: patients[3].id, packageName: 'Plano 0 a 18 meses', totalDoses: 24, dosesUsed: 8 } }),
  ]);
  console.log(`  ✓ ${packages.length} planos`);

  // ═══ MOVIMENTAÇÕES ═══
  let movCount = 0;
  for (const batch of batches.slice(0, 8)) {
    // Entradas
    await prisma.stockMovement.create({ data: { batchId: batch.id, type: 'entrada', quantity: batch.quantityTotal, reason: 'Entrada inicial — NF recebida' } });
    movCount++;
    // Saídas
    const patient = patients[Math.floor(Math.random() * patients.length)];
    const qtdSaida = 1 + Math.floor(Math.random() * 3);
    if (batch.quantityAvailable >= qtdSaida) {
      await prisma.stockMovement.create({ data: { batchId: batch.id, type: 'saida', quantity: qtdSaida, reason: 'Aplicação', patientId: patient.id } });
      movCount++;
    }
  }
  console.log(`  ✓ ${movCount} movimentações`);
  console.log('\n✅ Seed concluído!\n');
}

main()
  .catch(e => { console.error('❌ Seed error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
