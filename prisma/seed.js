const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function cb(){return'7891'+String(Math.floor(Math.random()*9999999999)).padStart(10,'0')}
function d(dias){const dt=new Date();dt.setDate(dt.getDate()+dias);return dt}

async function main(){
  console.log('🌱 VittaSys — Seed PostgreSQL...\n');

  // Usuarios
  const usuarios=[
    {nome:'Nágila Santos',cargo:'Gestora',email:'nagila@vittalis.com',pin:'2305',perfil:'master'},
    {nome:'Miécio Costa',cargo:'Gestor',email:'miecio@vittalis.com',pin:'2305',perfil:'master'},
    {nome:'Dra. Camila Ferreira',cargo:'Enfermeira - Ativos',email:'camila@vittalis.com',pin:'1234',perfil:'ativos'},
    {nome:'Téc. Rafael Santos',cargo:'Técnico - Ativos',email:'rafael@vittalis.com',pin:'1234',perfil:'ativos'},
    {nome:'Dra. Juliana Mendes',cargo:'Médica - Espontâneos',email:'juliana@vittalis.com',pin:'1234',perfil:'espontaneos'},
    {nome:'Téc. Bruno Almeida',cargo:'Técnico - Espontâneos',email:'bruno@vittalis.com',pin:'1234',perfil:'espontaneos'},
    {nome:'Amanda Costa',cargo:'Vendedora - Ativos',email:'amanda@vittalis.com',pin:'1234',perfil:'ativos'},
  ];
  for(const u of usuarios){await prisma.usuario.upsert({where:{email:u.email},update:u,create:u})}
  console.log(`  ✓ ${usuarios.length} usuários`);

  // Vacinas
  const vacsData=[
    {codigo:'BCG',nome:'BCG',fabricante:'Ataulpho de Paiva',dosesEsquema:1,valorCustoMedio:35,valorVendaSugerido:80},
    {codigo:'HEP-B',nome:'Hepatite B',fabricante:'Butantan',dosesEsquema:3,valorCustoMedio:25,valorVendaSugerido:65},
    {codigo:'PENTA',nome:'Pentavalente',fabricante:'Butantan',dosesEsquema:3,valorCustoMedio:45,valorVendaSugerido:120},
    {codigo:'VIP',nome:'Poliomielite Inativada',fabricante:'Sanofi',dosesEsquema:3,valorCustoMedio:55,valorVendaSugerido:130},
    {codigo:'PNEUMO-13',nome:'Pneumocócica 13v',fabricante:'Pfizer',dosesEsquema:3,valorCustoMedio:180,valorVendaSugerido:350},
    {codigo:'ROTAVIRUS',nome:'Rotavírus',fabricante:'MSD',dosesEsquema:2,valorCustoMedio:208,valorVendaSugerido:380},
    {codigo:'MENINGO-B',nome:'Meningocócica B',fabricante:'GSK',dosesEsquema:2,valorCustoMedio:550,valorVendaSugerido:850},
    {codigo:'MENINGO-ACWY',nome:'Meningocócica ACWY',fabricante:'GSK',dosesEsquema:2,valorCustoMedio:246,valorVendaSugerido:450},
    {codigo:'FEBRE-AM',nome:'Febre Amarela',fabricante:'Bio-Manguinhos',dosesEsquema:1,valorCustoMedio:30,valorVendaSugerido:75},
    {codigo:'TRIPLICE',nome:'Tríplice Viral',fabricante:'Bio-Manguinhos',dosesEsquema:2,valorCustoMedio:46,valorVendaSugerido:120},
    {codigo:'HEPATITE-A',nome:'Hepatite A',fabricante:'GSK',dosesEsquema:2,valorCustoMedio:95,valorVendaSugerido:220},
    {codigo:'INFLUENZA',nome:'Influenza Quadrivalente',fabricante:'Butantan',dosesEsquema:1,valorCustoMedio:60,valorVendaSugerido:140},
  ];
  const vacs=[];
  for(const v of vacsData){vacs.push(await prisma.vacina.upsert({where:{codigo:v.codigo},update:v,create:v}))}
  console.log(`  ✓ ${vacs.length} vacinas`);

  // Lotes + Unidades
  let loteCount=0,unCount=0;
  for(const vac of vacs){
    for(let i=1;i<=2;i++){
      const qty=20+Math.floor(Math.random()*30);const dv=60+Math.floor(Math.random()*300);
      const num=`${vac.codigo}-2026${String(i).padStart(2,'0')}`;
      const existing=await prisma.lote.findUnique({where:{numeroLote:num}});
      if(!existing){
        const lote=await prisma.lote.create({data:{vacinaId:vac.id,numeroLote:num,fabricante:vac.fabricante,quantidadeTotal:qty,quantidadeDisponivel:qty,validade:d(dv),valorUnitarioCusto:vac.valorCustoMedio}});
        loteCount++;
        for(let j=0;j<Math.min(qty,30);j++){await prisma.unidade.create({data:{loteId:lote.id,codigoBarras:cb()}});unCount++}
      }
    }
  }
  console.log(`  ✓ ${loteCount} lotes, ${unCount} unidades`);

  // Clientes
  const clisData=[
    {codigoCliente:'VIT-001',nome:'Miguel Oliveira Santos',dataNascimento:new Date('2025-01-15'),sexo:'M',cpf:'111.222.333-01',telefone:'(98) 99111-0001',tipoPaciente:'bebe',tipoCliente:'ativo',responsavelNome:'Ana Oliveira',responsavelParentesco:'Mãe'},
    {codigoCliente:'VIT-002',nome:'Helena Costa Silva',dataNascimento:new Date('2024-06-20'),sexo:'F',cpf:'111.222.333-02',telefone:'(98) 99111-0002',tipoPaciente:'bebe',tipoCliente:'ativo',responsavelNome:'Mariana Costa',responsavelParentesco:'Mãe'},
    {codigoCliente:'VIT-003',nome:'Arthur Ferreira Lima',dataNascimento:new Date('2024-03-10'),sexo:'M',cpf:'111.222.333-03',telefone:'(98) 99111-0003',tipoPaciente:'bebe',tipoCliente:'ativo',responsavelNome:'Juliana Ferreira',responsavelParentesco:'Mãe'},
    {codigoCliente:'VIT-004',nome:'Laura Mendes Rocha',dataNascimento:new Date('2023-09-05'),sexo:'F',cpf:'111.222.333-04',telefone:'(98) 99111-0004',tipoPaciente:'crianca',tipoCliente:'ativo',responsavelNome:'Roberto Mendes',responsavelParentesco:'Pai'},
    {codigoCliente:'ESP-001',nome:'Maria da Silva',dataNascimento:new Date('1985-03-15'),sexo:'F',cpf:'987.654.321-01',telefone:'(98) 98765-0001',tipoPaciente:'adulto',tipoCliente:'espontaneo'},
    {codigoCliente:'ESP-002',nome:'João Pedro Oliveira',dataNascimento:new Date('1990-07-22'),sexo:'M',cpf:'987.654.321-02',telefone:'(98) 98765-0002',tipoPaciente:'adulto',tipoCliente:'espontaneo'},
  ];
  const clis=[];
  for(const c of clisData){
    const existing=await prisma.cliente.findUnique({where:{codigoCliente:c.codigoCliente}});
    if(!existing)clis.push(await prisma.cliente.create({data:c}));else clis.push(existing)
  }
  console.log(`  ✓ ${clis.length} clientes`);

  // Planos templates
  const planosData=[
    {nome:'Plano 0 a 6 meses',idadeInicio:0,idadeFim:6,valorTabela:2800},
    {nome:'Plano 2 a 6 meses',idadeInicio:2,idadeFim:6,valorTabela:2200},
    {nome:'Plano 0 a 9 meses',idadeInicio:0,idadeFim:9,valorTabela:3800},
    {nome:'Plano 0 a 18 meses',idadeInicio:0,idadeFim:18,valorTabela:5800},
  ];
  const existing=await prisma.plano.count();
  if(existing===0){for(const p of planosData)await prisma.plano.create({data:p});console.log(`  ✓ ${planosData.length} planos template`)}

  // Metas
  const metasExist=await prisma.metaFinanceira.count();
  if(metasExist===0){for(let m=1;m<=12;m++){const meta=25000+Math.floor(Math.random()*15000);const real=m<=3?Math.floor(meta*(0.5+Math.random()*0.7)):0;
    await prisma.metaFinanceira.create({data:{setor:'vacinas',competencia:`2026-${String(m).padStart(2,'0')}`,valorMeta:meta,valorRealizado:real,percentualAtingido:meta>0?real/meta*100:0,valorFaltante:Math.max(0,meta-real)}})}
    console.log('  ✓ 12 metas mensais')}

  console.log('\n✅ Seed concluído!\n');
}

main().catch(e=>{console.error('❌ Seed:',e);process.exit(1)}).finally(()=>prisma.$disconnect());
