// ═══ VittaSys — Importação completa de clientes ativos ═══
// Execute: node prisma/import-clientes-reais.js
// Requer: DATABASE_URL configurado

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const PLANO_VALORES = {
  'Plano Vacinal 0 a 6 meses': 4200,
  'Plano Vacinal 6 a 12 meses': 3500,
  'Plano Vacinal 12 a 24 meses': 2800,
  'Plano 18 meses': 2500,
  'Plano Nascimento': 1500,
  'Plano Vacinal': 3000,
};

async function run() {
  console.log('═══ Importação de clientes ativos ═══');
  
  // Lookup vaccines by codigo
  const vacinas = await prisma.vacina.findMany();
  const vacMap = {};
  vacinas.forEach(v => { vacMap[v.codigo] = v.id; });
  console.log('Vacinas no sistema:', Object.keys(vacMap).join(', '));

  const CLIENTES_DATA = [
  {
    "nome": "MARIA ELOAH AGUIAR DINIZ LEAL",
    "mae": "DELANE AGUIAR DINIZ",
    "pai": "HERPES LEAL LIMA NETO",
    "dn": "2023-01-22",
    "tel": "",
    "status": "finalizado",
    "plano": "Plano Vacinal 0 a 6 meses",
    "doses": [
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-2",
        "codigo": "PCV20",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-ACWY-2",
        "codigo": "MEN-ACWY",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-3",
        "codigo": "PCV20",
        "dose": 3,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "THOMAS SILVA BATISTA",
    "mae": "",
    "pai": "RAPHAEL RAFSANDJANI BATISTA",
    "dn": "2022-02-07",
    "tel": "",
    "status": "finalizado",
    "plano": "Plano Vacinal 6 a 12 meses",
    "doses": [
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-2",
        "codigo": "PCV20",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-ACWY-2",
        "codigo": "MEN-ACWY",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-3",
        "codigo": "PCV20",
        "dose": 3,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FA-1",
        "codigo": "FA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "SCR-1",
        "codigo": "SCR",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "VZ-1",
        "codigo": "VZ",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "HEP-A-1",
        "codigo": "HEP-A",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "HEP-B-1",
        "codigo": "HEP-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "BENÍCIO SANTANA FURTADO ​",
    "mae": "LEISSA SANTOS SANTANA FURTADO ​ ​",
    "pai": "",
    "dn": "2023-03-04",
    "tel": "",
    "status": "finalizado",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-3",
        "codigo": "PCV20",
        "dose": 3,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-3",
        "codigo": "FLU",
        "dose": 3,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FA-1",
        "codigo": "FA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "SCR-1",
        "codigo": "SCR",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEP-A-1",
        "codigo": "HEP-A",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "VZ-1",
        "codigo": "VZ",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-2",
        "codigo": "PCV20",
        "dose": 2,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "EVA PIMENTA DE FIGUEIREDO ​",
    "mae": "ANNA FLÁVIA MOREIRA PIMENTA DE FIGUEIREDO ​",
    "pai": "VICTOR NOGUEIRA DE FIGUEIREDO",
    "dn": "2025-02-19",
    "tel": "",
    "status": "ativo",
    "plano": "Plano 18 meses",
    "doses": [
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-3",
        "codigo": "PCV20",
        "dose": 3,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-3",
        "codigo": "FLU",
        "dose": 3,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FA-1",
        "codigo": "FA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "SCR-1",
        "codigo": "SCR",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEP-A-1",
        "codigo": "HEP-A",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "VZ-1",
        "codigo": "VZ",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "JOSE MIGUEL MENESES",
    "mae": "",
    "pai": "",
    "dn": "2023-03-16",
    "tel": "98 991900770",
    "status": "ativo",
    "plano": "Plano 18 meses",
    "doses": [
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-2",
        "codigo": "PCV20",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-ACWY-2",
        "codigo": "MEN-ACWY",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-3",
        "codigo": "PCV20",
        "dose": 3,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FA-1",
        "codigo": "FA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEP-A-1",
        "codigo": "HEP-A",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "VZ-1",
        "codigo": "VZ",
        "dose": 1,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "ISIS RIBEIRO CAVALCANTI",
    "mae": "BRUNA BECKMANN VITAL RIBEIRO",
    "pai": "EDUARDO DE ALBUQUERQUE CAVALCANTI FILHO",
    "dn": "2023-03-25",
    "tel": "",
    "status": "ativo",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "VZ-2",
        "codigo": "VZ",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEP-A-1",
        "codigo": "HEP-A",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-2",
        "codigo": "PCV20",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-ACWY-2",
        "codigo": "MEN-ACWY",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-3",
        "codigo": "PCV20",
        "dose": 3,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "SCR-1",
        "codigo": "SCR",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "HEITOR",
    "mae": "ISABELLA",
    "pai": "",
    "dn": "2017-03-19",
    "tel": "",
    "status": "finalizado",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "FA-1",
        "codigo": "FA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEP-A-1",
        "codigo": "HEP-A",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "aplicada",
        "data": null
      }
    ]
  },
  {
    "nome": "CATARINA GONÇALVES BARBOSA BARROS",
    "mae": "",
    "pai": "SAULO",
    "dn": "2023-01-27",
    "tel": "",
    "status": "ativo",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-2",
        "codigo": "PCV20",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-ACWY-2",
        "codigo": "MEN-ACWY",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-3",
        "codigo": "PCV20",
        "dose": 3,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "SCR-1",
        "codigo": "SCR",
        "dose": 1,
        "status": "aplicada",
        "data": null
      }
    ]
  },
  {
    "nome": "MARIA HELENA DE SOUZA GOMES",
    "mae": "DANIELLE CUNHA DE SOUZA ROCHA",
    "pai": "",
    "dn": "2022-01-15",
    "tel": "",
    "status": "finalizado",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "FA-1",
        "codigo": "FA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-2",
        "codigo": "PCV20",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-ACWY-2",
        "codigo": "MEN-ACWY",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-3",
        "codigo": "PCV20",
        "dose": 3,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "SCR-1",
        "codigo": "SCR",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "TIMOTEO MONTEIRO CASTRO",
    "mae": "RENATA DE ARAUJO MONTEIRO CASTRO",
    "pai": "NIELSEN OLIVEIRA CASTRO",
    "dn": "2022-05-27",
    "tel": "",
    "status": "finalizado",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "SCR-1",
        "codigo": "SCR",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "VZ-1",
        "codigo": "VZ",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEP-A-1",
        "codigo": "HEP-A",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEP-B-1",
        "codigo": "HEP-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-2",
        "codigo": "PCV20",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-ACWY-2",
        "codigo": "MEN-ACWY",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-3",
        "codigo": "PCV20",
        "dose": 3,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "aplicada",
        "data": null
      }
    ]
  },
  {
    "nome": "IAN VINICIUS AMARAL PINTO",
    "mae": "",
    "pai": "VICTOR LEANDRO COELHO PINTO",
    "dn": null,
    "tel": "",
    "status": "finalizado",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "HEP-A-1",
        "codigo": "HEP-A",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "VZ-1",
        "codigo": "VZ",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "SCR-1",
        "codigo": "SCR",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "SCR-2",
        "codigo": "SCR",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "VZ-2",
        "codigo": "VZ",
        "dose": 2,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "THIAGO PINHEIRO GUIMARÃES",
    "mae": "LUCIANA MARIA PINHEIRO GUIMARAES",
    "pai": "AECIO FELIPE GOMES GUIMARAES",
    "dn": "2022-06-17",
    "tel": "",
    "status": "finalizado",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "HEP-A-2",
        "codigo": "HEP-A",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-ACWY-2",
        "codigo": "MEN-ACWY",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-3",
        "codigo": "PCV20",
        "dose": 3,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "pendente",
        "data": null
      },
      {
        "key": "SCR-1",
        "codigo": "SCR",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FA-1",
        "codigo": "FA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "HEP-A-1",
        "codigo": "HEP-A",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "aplicada",
        "data": null
      }
    ]
  },
  {
    "nome": "MARIANA CAMPOS LACERDA",
    "mae": "ELISA JAIANE SILVA CAMPOS LACERDA",
    "pai": "NOELSON SILVA LACERDA",
    "dn": "2022-11-04",
    "tel": "",
    "status": "finalizado",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "VZ-2",
        "codigo": "VZ",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "SCR-1",
        "codigo": "SCR",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "HEP-A-2",
        "codigo": "HEP-A",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "aplicada",
        "data": null
      }
    ]
  },
  {
    "nome": "ISIS MARIA DE ALMEIDA MATOS",
    "mae": "ADRIANNE MORAES DE ALMEIDA MATOS",
    "pai": "",
    "dn": "2023-05-05",
    "tel": "98 982252164",
    "status": "finalizado",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "PCV20-2",
        "codigo": "PCV20",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-ACWY-2",
        "codigo": "MEN-ACWY",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-3",
        "codigo": "PCV20",
        "dose": 3,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "SCR-1",
        "codigo": "SCR",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FA-1",
        "codigo": "FA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "aplicada",
        "data": null
      }
    ]
  },
  {
    "nome": "HADASSA VALENTINA LEITE SOEIRO",
    "mae": "MARIANA LEITE COSTA SOEIRO",
    "pai": "NICKSON DOUGLAS ARAUJO SOEIRO",
    "dn": "2022-10-20",
    "tel": "",
    "status": "finalizado",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FA-1",
        "codigo": "FA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEP-A-1",
        "codigo": "HEP-A",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "VZ-1",
        "codigo": "VZ",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "SCR-1",
        "codigo": "SCR",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PENTA-2",
        "codigo": "PENTA",
        "dose": 2,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "VINICIUS SOUSA PEREIRA",
    "mae": "KEYLLIANE FRANCES COSTA SOUSA PEREIRA",
    "pai": "JEFFERSON MELLO PEREIRA",
    "dn": "2022-10-20",
    "tel": "",
    "status": "finalizado",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-ACWY-2",
        "codigo": "MEN-ACWY",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-2",
        "codigo": "PCV20",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      }
    ]
  },
  {
    "nome": "MIGUEL LAMAR SANDES",
    "mae": "Nº 98 991208761",
    "pai": "FELIX FERREIRA SANDES JUNIOR",
    "dn": "2021-10-25",
    "tel": "98 991208761",
    "status": "ativo",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "MEN-ACWY-2",
        "codigo": "MEN-ACWY",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-3",
        "codigo": "PCV20",
        "dose": 3,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "SCR-1",
        "codigo": "SCR",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FA-1",
        "codigo": "FA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "HEP-A-1",
        "codigo": "HEP-A",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "VZ-1",
        "codigo": "VZ",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "VZ-2",
        "codigo": "VZ",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PENTA-2",
        "codigo": "PENTA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEP-A-2",
        "codigo": "HEP-A",
        "dose": 2,
        "status": "aplicada",
        "data": null
      }
    ]
  },
  {
    "nome": "MARIA FLOR PEREIRA FERREIRA",
    "mae": "",
    "pai": "CLEITON JOSE FERREIRA DE MELO",
    "dn": "2022-09-13",
    "tel": "",
    "status": "finalizado",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-2",
        "codigo": "PCV20",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-ACWY-2",
        "codigo": "MEN-ACWY",
        "dose": 2,
        "status": "aplicada",
        "data": "2023-06-22"
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-3",
        "codigo": "PCV20",
        "dose": 3,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "HEP-B-1",
        "codigo": "HEP-B",
        "dose": 1,
        "status": "aplicada",
        "data": null
      }
    ]
  },
  {
    "nome": "RODRIGO DO NASCIMENTO MORAES GOMES ARANHA",
    "mae": "SAMYRA DO NASCIMENTO MORAES GOMES ARANHA",
    "pai": "EDER DA SANTA CRUZ GONÇALVES ARANHA",
    "dn": "2022-11-30",
    "tel": "",
    "status": "ativo",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-2",
        "codigo": "PCV20",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-ACWY-2",
        "codigo": "MEN-ACWY",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-3",
        "codigo": "PCV20",
        "dose": 3,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "SCR-1",
        "codigo": "SCR",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FA-1",
        "codigo": "FA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEP-A-1",
        "codigo": "HEP-A",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "VZ-1",
        "codigo": "VZ",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "SCR-2",
        "codigo": "SCR",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "VZ-2",
        "codigo": "VZ",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEP-A-2",
        "codigo": "HEP-A",
        "dose": 2,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "JOAQUIM BERTRAND CASTRO",
    "mae": "RAYSSA BERTRAND",
    "pai": "",
    "dn": "2023-05-03",
    "tel": "(98)98514-9000",
    "status": "finalizado",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-2",
        "codigo": "PCV20",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-ACWY-2",
        "codigo": "MEN-ACWY",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-3",
        "codigo": "PCV20",
        "dose": 3,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FA-1",
        "codigo": "FA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "HEP-A-1",
        "codigo": "HEP-A",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "SCR-1",
        "codigo": "SCR",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "VZ-1",
        "codigo": "VZ",
        "dose": 1,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "SAMUEL LEVI COSTA SANTANA",
    "mae": "",
    "pai": "RONILSON IBIPIANO COSTA",
    "dn": "2023-04-04",
    "tel": "(98)98279-0552",
    "status": "ativo",
    "plano": "Plano 18 meses",
    "doses": [
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "aplicada",
        "data": null
      }
    ]
  },
  {
    "nome": "MARIA",
    "mae": "",
    "pai": "",
    "dn": "2023-05-18",
    "tel": "",
    "status": "ativo",
    "plano": "Plano Nascimento",
    "doses": [
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-2",
        "codigo": "PCV20",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-ACWY-2",
        "codigo": "MEN-ACWY",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-3",
        "codigo": "PCV20",
        "dose": 3,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "SCR-1",
        "codigo": "SCR",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FA-1",
        "codigo": "FA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "HEP-A-1",
        "codigo": "HEP-A",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "HEP-B-1",
        "codigo": "HEP-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "MARIA",
    "mae": "LETICIA DOS SANTOS GOMES",
    "pai": "",
    "dn": "2023-05-18",
    "tel": "",
    "status": "finalizado",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "PCV20-2",
        "codigo": "PCV20",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-ACWY-2",
        "codigo": "MEN-ACWY",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-3",
        "codigo": "PCV20",
        "dose": 3,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "pendente",
        "data": null
      },
      {
        "key": "SCR-1",
        "codigo": "SCR",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FA-1",
        "codigo": "FA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEP-A-1",
        "codigo": "HEP-A",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "VZ-1",
        "codigo": "VZ",
        "dose": 1,
        "status": "aplicada",
        "data": null
      }
    ]
  },
  {
    "nome": "BEATRIZ MENESES",
    "mae": "LETICIA DOS SANTOS GOMES",
    "pai": "",
    "dn": "2021-03-16",
    "tel": "",
    "status": "finalizado",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "HEP-A-2",
        "codigo": "HEP-A",
        "dose": 2,
        "status": "aplicada",
        "data": null
      }
    ]
  },
  {
    "nome": "JOÃO GUILHERME DIDIMO GOMES",
    "mae": "",
    "pai": "FABRICIO MATIAS GOMES",
    "dn": "2023-04-03",
    "tel": "98 985205171",
    "status": "finalizado",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-2",
        "codigo": "PCV20",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-ACWY-2",
        "codigo": "MEN-ACWY",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-3",
        "codigo": "PCV20",
        "dose": 3,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "SCR-1",
        "codigo": "SCR",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FA-1",
        "codigo": "FA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "HEP-A-1",
        "codigo": "HEP-A",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "VZ-1",
        "codigo": "VZ",
        "dose": 1,
        "status": "aplicada",
        "data": null
      }
    ]
  },
  {
    "nome": "JOÃO LUCAS MACHADO",
    "mae": "FERNANDA MACHADO",
    "pai": "",
    "dn": "2022-08-27",
    "tel": "",
    "status": "finalizado",
    "plano": "Plano Vacinal 12 a 24 meses",
    "doses": [
      {
        "key": "SCR-1",
        "codigo": "SCR",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "HEP-A-1",
        "codigo": "HEP-A",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "VZ-1",
        "codigo": "VZ",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "aplicada",
        "data": "2023-10-03"
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "SCR-2",
        "codigo": "SCR",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "VZ-2",
        "codigo": "VZ",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "HEP-A-2",
        "codigo": "HEP-A",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "aplicada",
        "data": null
      }
    ]
  },
  {
    "nome": "MATEUS FERNANDES",
    "mae": "DANIANE FRANCO",
    "pai": "",
    "dn": "2023-08-28",
    "tel": "(98)988753184",
    "status": "ativo",
    "plano": "Plano 18 meses",
    "doses": [
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-2",
        "codigo": "PCV20",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-ACWY-2",
        "codigo": "MEN-ACWY",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-3",
        "codigo": "PCV20",
        "dose": 3,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "SCR-1",
        "codigo": "SCR",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FA-1",
        "codigo": "FA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "HEP-A-1",
        "codigo": "HEP-A",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "HEP-B-1",
        "codigo": "HEP-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "BERNARDO PEREIRA FEITOSA",
    "mae": "VEYDA DA SILVA PEREIRA",
    "pai": "ANTONIO TITO ABREU FEITOSA",
    "dn": "2023-06-20",
    "tel": "98 991319039",
    "status": "ativo",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "HEP-B-1",
        "codigo": "HEP-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-2",
        "codigo": "PCV20",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-ACWY-2",
        "codigo": "MEN-ACWY",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-3",
        "codigo": "PCV20",
        "dose": 3,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "pendente",
        "data": null
      },
      {
        "key": "SCR-1",
        "codigo": "SCR",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FA-1",
        "codigo": "FA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "HEP-A-1",
        "codigo": "HEP-A",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "VZ-1",
        "codigo": "VZ",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "HEP-A-2",
        "codigo": "HEP-A",
        "dose": 2,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "LEVI FEITOSA CARDOSO FURTADO",
    "mae": "PAULA LETICIA FEITOSA CARDOSO FURTADO",
    "pai": "",
    "dn": "2018-09-28",
    "tel": "",
    "status": "ativo",
    "plano": "Plano 18 meses",
    "doses": [
      {
        "key": "FA-1",
        "codigo": "FA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "VZ-1",
        "codigo": "VZ",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "SCR-1",
        "codigo": "SCR",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "HELENA SALUSTRIANO DE ALENCAR TEIXEIRA",
    "mae": "MICHELLE KALLINE SALUSTRIANO DE ALENCAR",
    "pai": "",
    "dn": "2023-07-25",
    "tel": "98 985256829",
    "status": "finalizado",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-2",
        "codigo": "PCV20",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-3",
        "codigo": "PCV20",
        "dose": 3,
        "status": "aplicada",
        "data": null
      }
    ]
  },
  {
    "nome": "LAURA ALMEIDA SCHALCHER CAMPOS",
    "mae": "DANIELLA LIMA MELO ALMEIDA",
    "pai": "EDWARDO SCHALCHER CAMPOS",
    "dn": "2023-04-17",
    "tel": "",
    "status": "finalizado",
    "plano": "Plano 18 meses",
    "doses": [
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-3",
        "codigo": "PCV20",
        "dose": 3,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "SCR-1",
        "codigo": "SCR",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FA-1",
        "codigo": "FA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "HEP-A-1",
        "codigo": "HEP-A",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "VZ-1",
        "codigo": "VZ",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "HEP-A-2",
        "codigo": "HEP-A",
        "dose": 2,
        "status": "aplicada",
        "data": null
      }
    ]
  },
  {
    "nome": "IVY RIBEIRO TAJRA",
    "mae": "BRUNA MENESES",
    "pai": "",
    "dn": "2019-05-05",
    "tel": "(98)98250 8015",
    "status": "finalizado",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "FA-1",
        "codigo": "FA",
        "dose": 1,
        "status": "aplicada",
        "data": "2023-05-22"
      },
      {
        "key": "SCR-1",
        "codigo": "SCR",
        "dose": 1,
        "status": "aplicada",
        "data": "2023-06-27"
      },
      {
        "key": "VZ-1",
        "codigo": "VZ",
        "dose": 1,
        "status": "aplicada",
        "data": "2023-06-27"
      }
    ]
  },
  {
    "nome": "HEITOR VILLA LOBO LIMA",
    "mae": "CAROLINE LOBO LIMA. ​ ​",
    "pai": "FABIO FRAZÃO LIMA",
    "dn": "2023-06-21",
    "tel": "",
    "status": "ativo",
    "plano": "Plano 18 meses",
    "doses": [
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEP-A-2",
        "codigo": "HEP-A",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "LUIZA CASTRO GALDEZ",
    "mae": "LIVIA CASTRO SANTOS GALDEZ",
    "pai": "ALEXANDRE PORTO PEREIRA GALDEZ",
    "dn": "2024-04-06",
    "tel": "(98) 99200-3018",
    "status": "ativo",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-3",
        "codigo": "FLU",
        "dose": 3,
        "status": "pendente",
        "data": null
      },
      {
        "key": "SCR-1",
        "codigo": "SCR",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FA-1",
        "codigo": "FA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEP-A-3",
        "codigo": "HEP-A",
        "dose": 3,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEP-A-1",
        "codigo": "HEP-A",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      }
    ]
  },
  {
    "nome": "BENTO CARVALHO SILVA",
    "mae": "MARIA LUISA CONTATO: (98) 98310-0190",
    "pai": "THIAGO HENRIQUE DOS SANTOS SILVA",
    "dn": "2024-02-26",
    "tel": "",
    "status": "finalizado",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-ACWY-2",
        "codigo": "MEN-ACWY",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FA-1",
        "codigo": "FA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "SCR-1",
        "codigo": "SCR",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "HEP-A-1",
        "codigo": "HEP-A",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "VZ-1",
        "codigo": "VZ",
        "dose": 1,
        "status": "aplicada",
        "data": null
      }
    ]
  },
  {
    "nome": "DAVI MIGUEL ALMEIDA RIBEIRO",
    "mae": "MICHLLE CLICIA ALMEIDA ABREU RIBEIRO N (98) 988615958 ENDEREÇO: RUA 06, QUADRA E,",
    "pai": "",
    "dn": "2024-01-16",
    "tel": "",
    "status": "ativo",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-2",
        "codigo": "PCV20",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-ACWY-2",
        "codigo": "MEN-ACWY",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "SCR-1",
        "codigo": "SCR",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FA-1",
        "codigo": "FA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "HEP-A-2",
        "codigo": "HEP-A",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "VZ-2",
        "codigo": "VZ",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEP-B-1",
        "codigo": "HEP-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "MARIA FERNANDA OLIVEIRA FRANCO",
    "mae": "ANA BEATRIZ FRANCO",
    "pai": "",
    "dn": "2024-01-25",
    "tel": "",
    "status": "ativo",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "SCR-1",
        "codigo": "SCR",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEP-A-1",
        "codigo": "HEP-A",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "VZ-1",
        "codigo": "VZ",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "SCR-2",
        "codigo": "SCR",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEP-A-2",
        "codigo": "HEP-A",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "MARIA",
    "mae": "MARIANA PIRES DE",
    "pai": "DIÓGENES LEITE SOUSA",
    "dn": "2024-01-28",
    "tel": "",
    "status": "finalizado",
    "plano": "Plano 18 meses",
    "doses": []
  },
  {
    "nome": "LIZ SOFIA RODRIGUES ALMEIDA",
    "mae": "ANA CRISTINA GOMES RODRIGUES",
    "pai": "PEDRO HENRIQUE DOS SANTOS ALMEIDA",
    "dn": "2024-02-11",
    "tel": "",
    "status": "ativo",
    "plano": "Plano Vacinal",
    "doses": []
  },
  {
    "nome": "PEDRO ALDI VELOSO DAMASCENO",
    "mae": "THAYSA VELOSO MENDONÇA DAMASCENO​",
    "pai": "SPURGEON",
    "dn": "2023-09-18",
    "tel": "",
    "status": "ativo",
    "plano": "Plano 18 meses",
    "doses": [
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-2",
        "codigo": "PCV20",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-ACWY-2",
        "codigo": "MEN-ACWY",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "SCR-1",
        "codigo": "SCR",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-3",
        "codigo": "PCV20",
        "dose": 3,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FA-1",
        "codigo": "FA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "HEP-A-1",
        "codigo": "HEP-A",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "VZ-1",
        "codigo": "VZ",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "SCR-2",
        "codigo": "SCR",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "VZ-2",
        "codigo": "VZ",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEP-A-2",
        "codigo": "HEP-A",
        "dose": 2,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "BERNARDO NASCIMENTO GUIMARÃES",
    "mae": "CAROL SOUSA DE NASCIMENTO",
    "pai": "ÁDAMO WILLIAM GOMES GUIMARÃES",
    "dn": "2024-01-26",
    "tel": "",
    "status": "finalizado",
    "plano": "Plano Nascimento",
    "doses": [
      {
        "key": "HEP-B-1",
        "codigo": "HEP-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-2",
        "codigo": "PCV20",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-ACWY-2",
        "codigo": "MEN-ACWY",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-3",
        "codigo": "PCV20",
        "dose": 3,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "SCR-1",
        "codigo": "SCR",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FA-1",
        "codigo": "FA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "HEP-A-1",
        "codigo": "HEP-A",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "VZ-1",
        "codigo": "VZ",
        "dose": 1,
        "status": "aplicada",
        "data": null
      }
    ]
  },
  {
    "nome": "ALICE AGUIAR",
    "mae": "SABRINA INÂE",
    "pai": "",
    "dn": "2023-02-20",
    "tel": "",
    "status": "ativo",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "HEP-B-1",
        "codigo": "HEP-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-2",
        "codigo": "PCV20",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-ACWY-2",
        "codigo": "MEN-ACWY",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-3",
        "codigo": "PCV20",
        "dose": 3,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "SCR-1",
        "codigo": "SCR",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FA-1",
        "codigo": "FA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEP-A-1",
        "codigo": "HEP-A",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "VZ-1",
        "codigo": "VZ",
        "dose": 1,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "BENICIO GAMA MENDES AMORIM",
    "mae": "MONALISA ALINE TAVARES",
    "pai": "",
    "dn": "2024-02-19",
    "tel": "",
    "status": "finalizado",
    "plano": "Plano 18 meses",
    "doses": [
      {
        "key": "HEP-A-1",
        "codigo": "HEP-A",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEP-B-1",
        "codigo": "HEP-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-2",
        "codigo": "PCV20",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-ACWY-2",
        "codigo": "MEN-ACWY",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-3",
        "codigo": "PCV20",
        "dose": 3,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "SCR-1",
        "codigo": "SCR",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "aplicada",
        "data": null
      }
    ]
  },
  {
    "nome": "JOSE MATEUS BORGEA JORGE",
    "mae": "MONIQUE RABÊLO BORGEA JORGE​",
    "pai": "ANDRE LUIS RAMOS JORGE",
    "dn": "2024-01-28",
    "tel": "",
    "status": "finalizado",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-2",
        "codigo": "PCV20",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-ACWY-2",
        "codigo": "MEN-ACWY",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "SCR-1",
        "codigo": "SCR",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FA-1",
        "codigo": "FA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "HEP-A-1",
        "codigo": "HEP-A",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "VZ-1",
        "codigo": "VZ",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "SCR-2",
        "codigo": "SCR",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "VZ-2",
        "codigo": "VZ",
        "dose": 2,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "GAEL FALCÃO RODRIGUES SODRÉ",
    "mae": "THAYANNA DA SILVA FALCÃO SODRÉ​",
    "pai": "",
    "dn": null,
    "tel": "",
    "status": "finalizado",
    "plano": "Plano 18 meses",
    "doses": [
      {
        "key": "HEP-A-2",
        "codigo": "HEP-A",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEP-B-1",
        "codigo": "HEP-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-2",
        "codigo": "PCV20",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "SCR-1",
        "codigo": "SCR",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FLU-3",
        "codigo": "FLU",
        "dose": 3,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FA-1",
        "codigo": "FA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      }
    ]
  },
  {
    "nome": "JADE LOUISE OLIVEIRA LOUZEIRO",
    "mae": "JESSICA DOS SANTOS LOUZEIRO",
    "pai": "",
    "dn": null,
    "tel": "",
    "status": "ativo",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "HEP-A-1",
        "codigo": "HEP-A",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "VZ-1",
        "codigo": "VZ",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "HEP-B-1",
        "codigo": "HEP-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-2",
        "codigo": "PCV20",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FLU-3",
        "codigo": "FLU",
        "dose": 3,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FA-1",
        "codigo": "FA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      }
    ]
  },
  {
    "nome": "MARIA EDUARDA OLIVEIRA DE ABREU",
    "mae": "JÉSSICA OLIVEIRA DE ABREU",
    "pai": "ANDRE MENDONÇA DE ABREU",
    "dn": "2024-04-14",
    "tel": "",
    "status": "ativo",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "SCR-1",
        "codigo": "SCR",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "VZ-1",
        "codigo": "VZ",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "HEP-B-1",
        "codigo": "HEP-B",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-ACWY-2",
        "codigo": "MEN-ACWY",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FLU-3",
        "codigo": "FLU",
        "dose": 3,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FA-1",
        "codigo": "FA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      }
    ]
  },
  {
    "nome": "ISABELA COELHO PORTAL",
    "mae": "NATÁLIA CIRQUEIRA COELHO PORTAL",
    "pai": "HEYTOR OLIVEIRA PORTAL",
    "dn": null,
    "tel": "",
    "status": "ativo",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "HEP-B-1",
        "codigo": "HEP-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-2",
        "codigo": "PCV20",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FA-1",
        "codigo": "FA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "SCR-1",
        "codigo": "SCR",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEP-A-1",
        "codigo": "HEP-A",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "VZ-1",
        "codigo": "VZ",
        "dose": 1,
        "status": "aplicada",
        "data": null
      }
    ]
  },
  {
    "nome": "ANNELISE BARBOSA RAMOS",
    "mae": "JESSY DAYANA CAMELO BARBOSA",
    "pai": "BERCKSON SANTOS RAMOS",
    "dn": "2023-12-28",
    "tel": "",
    "status": "finalizado",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "HEP-B-1",
        "codigo": "HEP-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-2",
        "codigo": "PCV20",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-ACWY-2",
        "codigo": "MEN-ACWY",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-3",
        "codigo": "PCV20",
        "dose": 3,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "SCR-1",
        "codigo": "SCR",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "HELENA GAIOTO BRAGA",
    "mae": "RENATA GAIOTO",
    "pai": "",
    "dn": "2024-03-15",
    "tel": "",
    "status": "ativo",
    "plano": "Plano 18 meses",
    "doses": [
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "SCR-1",
        "codigo": "SCR",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "VZ-1",
        "codigo": "VZ",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEP-A-2",
        "codigo": "HEP-A",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "CARLOS EDUARDO",
    "mae": "",
    "pai": "",
    "dn": "2024-05-01",
    "tel": "(98) 98409-6665",
    "status": "ativo",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "HEP-A-1",
        "codigo": "HEP-A",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "VZ-1",
        "codigo": "VZ",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "SCR-1",
        "codigo": "SCR",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEP-A-2",
        "codigo": "HEP-A",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-2",
        "codigo": "PCV20",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "aplicada",
        "data": null
      }
    ]
  },
  {
    "nome": "ESTER MARINHO SEREJO",
    "mae": "",
    "pai": "STEPHANO PEREIRA SEREJO",
    "dn": "2024-04-24",
    "tel": "",
    "status": "finalizado",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "HEP-A-1",
        "codigo": "HEP-A",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "SCR-1",
        "codigo": "SCR",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "VZ-2",
        "codigo": "VZ",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FA-1",
        "codigo": "FA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-ACWY-2",
        "codigo": "MEN-ACWY",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "aplicada",
        "data": null
      }
    ]
  },
  {
    "nome": "THEODORO COSTA MUNIZ",
    "mae": "",
    "pai": "",
    "dn": "2024-04-08",
    "tel": "",
    "status": "finalizado",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FA-1",
        "codigo": "FA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "HEP-A-1",
        "codigo": "HEP-A",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "SCR-1",
        "codigo": "SCR",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "VZ-1",
        "codigo": "VZ",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-2",
        "codigo": "PCV20",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-ACWY-2",
        "codigo": "MEN-ACWY",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-3",
        "codigo": "PCV20",
        "dose": 3,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "aplicada",
        "data": null
      }
    ]
  },
  {
    "nome": "BRENDON YSTONE SOUSA CARVALHO",
    "mae": "",
    "pai": "BRYAN YSTONE TAVARES CARVALHO",
    "dn": "2024-04-10",
    "tel": "",
    "status": "finalizado",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-2",
        "codigo": "PCV20",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-ACWY-2",
        "codigo": "MEN-ACWY",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-3",
        "codigo": "PCV20",
        "dose": 3,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "aplicada",
        "data": null
      }
    ]
  },
  {
    "nome": "MANUELA LUNA BEZERRA SILVA",
    "mae": "LUANA NATÁLIA",
    "pai": "",
    "dn": "2024-02-15",
    "tel": "",
    "status": "ativo",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FA-1",
        "codigo": "FA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "HEP-A-1",
        "codigo": "HEP-A",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "SCR-1",
        "codigo": "SCR",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "VZ-1",
        "codigo": "VZ",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-2",
        "codigo": "PCV20",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-3",
        "codigo": "PCV20",
        "dose": 3,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "aplicada",
        "data": null
      }
    ]
  },
  {
    "nome": "AYLA SOPHIA DUARTE SOEIRO",
    "mae": "JAKCIANE MAYARA DUARTE DE SOUSA CONTATO (98) 98135-7505",
    "pai": "FERNANDO MURILO OLIVEIRA SOEIRO",
    "dn": "2024-04-23",
    "tel": "",
    "status": "ativo",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "HEP-A-2",
        "codigo": "HEP-A",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEP-A-1",
        "codigo": "HEP-A",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "SCR-1",
        "codigo": "SCR",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "VZ-1",
        "codigo": "VZ",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FA-1",
        "codigo": "FA",
        "dose": 1,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "RODRIGO MAXIMO ALBUQUERQUE BARBOSA",
    "mae": "SAMIRA ALBUQUERQUE",
    "pai": "",
    "dn": "2024-05-02",
    "tel": "",
    "status": "ativo",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "SCR-2",
        "codigo": "SCR",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "VZ-2",
        "codigo": "VZ",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEP-A-2",
        "codigo": "HEP-A",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-2",
        "codigo": "PCV20",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-ACWY-2",
        "codigo": "MEN-ACWY",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-3",
        "codigo": "PCV20",
        "dose": 3,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "REBECCA LOUISE BALDEZ ASEVEDO",
    "mae": "ROSENILDE VANIZA SENA BALDEZ AEVEDO",
    "pai": "RODRIGO EDSON DE ARAUJO ASEVEDO",
    "dn": "2024-03-29",
    "tel": "",
    "status": "finalizado",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "SCR-1",
        "codigo": "SCR",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FA-1",
        "codigo": "FA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEP-A-1",
        "codigo": "HEP-A",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "VZ-1",
        "codigo": "VZ",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-2",
        "codigo": "PCV20",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-3",
        "codigo": "PCV20",
        "dose": 3,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "aplicada",
        "data": null
      }
    ]
  },
  {
    "nome": "BETINA MESQUITA VIANA",
    "mae": "THISCIANE MESQUITA VIANA",
    "pai": "CARLOS AIRTON CASTRO RAND PARK, TORRE SAN MARTIM APTO 607, CALHAU",
    "dn": "2024-05-14",
    "tel": "",
    "status": "ativo",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "PCV20-3",
        "codigo": "PCV20",
        "dose": 3,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "SCR-1",
        "codigo": "SCR",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FA-1",
        "codigo": "FA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEP-A-1",
        "codigo": "HEP-A",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "VZ-1",
        "codigo": "VZ",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-2",
        "codigo": "PCV20",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-ACWY-2",
        "codigo": "MEN-ACWY",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      }
    ]
  },
  {
    "nome": "JOÃO GABRIEL",
    "mae": "THAYNAN SOUSA CARVALHO",
    "pai": "JONATAS CASTELO BRANCO",
    "dn": "2024-07-03",
    "tel": "",
    "status": "ativo",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "SCR-1",
        "codigo": "SCR",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FA-1",
        "codigo": "FA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEP-A-1",
        "codigo": "HEP-A",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "VZ-1",
        "codigo": "VZ",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-2",
        "codigo": "PCV20",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-3",
        "codigo": "PCV20",
        "dose": 3,
        "status": "aplicada",
        "data": null
      }
    ]
  },
  {
    "nome": "JOSE MIGUEL SILVA CUTRIM",
    "mae": "MAISA DA SILVA COSTA",
    "pai": "GABRIEL",
    "dn": "2023-04-06",
    "tel": "",
    "status": "finalizado",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "SCR-1",
        "codigo": "SCR",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FA-1",
        "codigo": "FA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "HEP-A-1",
        "codigo": "HEP-A",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "VZ-1",
        "codigo": "VZ",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "ANTONELLA TINOCO NAGEL VASCONCELOS",
    "mae": "ANA CAROLINE SILVA TINOCO",
    "pai": "GUILHERME NAGEL VASCONCELOS",
    "dn": null,
    "tel": "",
    "status": "ativo",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-2",
        "codigo": "PCV20",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-ACWY-2",
        "codigo": "MEN-ACWY",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "HEP-B-1",
        "codigo": "HEP-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "RAVI LORENO CAMPOS DE SOUSA",
    "mae": "ALINE SANTOS CAMPOS",
    "pai": "",
    "dn": "2024-04-23",
    "tel": "",
    "status": "ativo",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "HEP-B-1",
        "codigo": "HEP-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "aplicada",
        "data": "2025-04-14"
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "aplicada",
        "data": "2025-04-14"
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "aplicada",
        "data": "2025-04-14"
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "MELISSA SOUZA COUTINHO",
    "mae": "RAYSSA COUTINHO",
    "pai": "IGOR COUTINHO",
    "dn": "2024-05-29",
    "tel": "",
    "status": "ativo",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "HEP-B-1",
        "codigo": "HEP-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-2",
        "codigo": "PCV20",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-ACWY-2",
        "codigo": "MEN-ACWY",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-3",
        "codigo": "PCV20",
        "dose": 3,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "SCR-1",
        "codigo": "SCR",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FA-1",
        "codigo": "FA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      }
    ]
  },
  {
    "nome": "MARIA LAURA CARVALHO DIAS",
    "mae": "LUANA CARVALHO",
    "pai": "",
    "dn": "2024-06-07",
    "tel": "",
    "status": "finalizado",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "HEP-B-1",
        "codigo": "HEP-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "SCR-1",
        "codigo": "SCR",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FA-1",
        "codigo": "FA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "HEP-A-1",
        "codigo": "HEP-A",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "VZ-1",
        "codigo": "VZ",
        "dose": 1,
        "status": "aplicada",
        "data": null
      }
    ]
  },
  {
    "nome": "SAMUEL OCRAM MAGALHAES DA SILVA",
    "mae": "",
    "pai": "",
    "dn": "2024-06-20",
    "tel": "",
    "status": "finalizado",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "HEP-B-1",
        "codigo": "HEP-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-2",
        "codigo": "PCV20",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-3",
        "codigo": "PCV20",
        "dose": 3,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FA-1",
        "codigo": "FA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "SCR-1",
        "codigo": "SCR",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEP-A-1",
        "codigo": "HEP-A",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "VZ-1",
        "codigo": "VZ",
        "dose": 1,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "MIGUEL OTONI OLIVEIRA LOPES",
    "mae": "EMANUELE DA SILVA OLIVEIRA LOPES",
    "pai": "",
    "dn": "2024-08-25",
    "tel": "",
    "status": "ativo",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "HEP-B-1",
        "codigo": "HEP-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-2",
        "codigo": "PCV20",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-ACWY-2",
        "codigo": "MEN-ACWY",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-3",
        "codigo": "PCV20",
        "dose": 3,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FA-1",
        "codigo": "FA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "SCR-1",
        "codigo": "SCR",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEP-A-1",
        "codigo": "HEP-A",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "VZ-1",
        "codigo": "VZ",
        "dose": 1,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "BENICIO VIEIRA WEBA",
    "mae": "MARIANA VIEIRA DA SILVA",
    "pai": "",
    "dn": "2024-12-09",
    "tel": "",
    "status": "finalizado",
    "plano": "Plano Vacinal 0 a 6 meses",
    "doses": [
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-2",
        "codigo": "PCV20",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-3",
        "codigo": "PCV20",
        "dose": 3,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "VINICIUS CRUZ SANTOS",
    "mae": "MARCELA DA SILVA CRUZ",
    "pai": "",
    "dn": "2024-06-16",
    "tel": "",
    "status": "finalizado",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FA-1",
        "codigo": "FA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "SCR-1",
        "codigo": "SCR",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "HEP-A-1",
        "codigo": "HEP-A",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "VZ-1",
        "codigo": "VZ",
        "dose": 1,
        "status": "aplicada",
        "data": null
      }
    ]
  },
  {
    "nome": "DANTE AIRES PAVÃO",
    "mae": "DEBORA PENHA AIRES PAVÃO",
    "pai": "JOÃO PAVÃO NETO",
    "dn": "2024-08-28",
    "tel": "",
    "status": "finalizado",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "HEP-B-1",
        "codigo": "HEP-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FA-1",
        "codigo": "FA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      }
    ]
  },
  {
    "nome": "MATEUS RIBEIRO BARROS",
    "mae": "MARYANA RIBEIRO BARROS",
    "pai": "",
    "dn": "2024-07-02",
    "tel": "",
    "status": "ativo",
    "plano": "Plano 18 meses",
    "doses": []
  },
  {
    "nome": "LAURA MAMEDE COSTA",
    "mae": "LIDIA GOUDINHO",
    "pai": "GUILHERME STANLEY SOUSA COSTA",
    "dn": "2024-07-20",
    "tel": "98 99901-0070",
    "status": "ativo",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "HEP-B-1",
        "codigo": "HEP-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-ACWY-2",
        "codigo": "MEN-ACWY",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FA-1",
        "codigo": "FA",
        "dose": 1,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "NOAH ENRICO LOPES ARAUJO",
    "mae": "GLEICE CRISTINA",
    "pai": "",
    "dn": "2024-08-02",
    "tel": "",
    "status": "ativo",
    "plano": "Plano 18 meses",
    "doses": [
      {
        "key": "HEP-A-2",
        "codigo": "HEP-A",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-2",
        "codigo": "PCV20",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-ACWY-2",
        "codigo": "MEN-ACWY",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-3",
        "codigo": "PCV20",
        "dose": 3,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FA-1",
        "codigo": "FA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEP-A-1",
        "codigo": "HEP-A",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "VZ-1",
        "codigo": "VZ",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "SCR-1",
        "codigo": "SCR",
        "dose": 1,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "LUIS FELIPE DE BRITO CUNHA",
    "mae": "ANA KARYNNE MARQUES BRITO",
    "pai": "",
    "dn": "2024-09-10",
    "tel": "",
    "status": "ativo",
    "plano": "Plano 18 meses",
    "doses": [
      {
        "key": "HEP-B-1",
        "codigo": "HEP-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FA-2",
        "codigo": "FA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEP-A-1",
        "codigo": "HEP-A",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "VZ-1",
        "codigo": "VZ",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "SCR-1",
        "codigo": "SCR",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "ARTHUR MATIAS PIRES",
    "mae": "",
    "pai": "MARCOS PIRES",
    "dn": "2024-09-18",
    "tel": "",
    "status": "ativo",
    "plano": "Plano 18 meses",
    "doses": [
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-ACWY-2",
        "codigo": "MEN-ACWY",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FA-1",
        "codigo": "FA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEP-A-1",
        "codigo": "HEP-A",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "VZ-1",
        "codigo": "VZ",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "SCR-1",
        "codigo": "SCR",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEP-A-2",
        "codigo": "HEP-A",
        "dose": 2,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "VICENTE PACHECO LIMA NOLETO",
    "mae": "CLARA PACHECO",
    "pai": "",
    "dn": "2024-08-13",
    "tel": "",
    "status": "finalizado",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FA-1",
        "codigo": "FA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      }
    ]
  },
  {
    "nome": "YAN FELIPE MASSETTI",
    "mae": "LUIZA AMÉLIA MAFRA BARROS MASSETTI",
    "pai": "FELIPE",
    "dn": "2024-10-17",
    "tel": "",
    "status": "ativo",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "HEP-B-1",
        "codigo": "HEP-B",
        "dose": 1,
        "status": "aplicada",
        "data": "2024-10-21"
      },
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-2",
        "codigo": "PCV20",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-3",
        "codigo": "PCV20",
        "dose": 3,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FA-1",
        "codigo": "FA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "HEP-A-1",
        "codigo": "HEP-A",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "VZ-1",
        "codigo": "VZ",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "SCR-1",
        "codigo": "SCR",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "SCR-2",
        "codigo": "SCR",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "VZ-2",
        "codigo": "VZ",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "HEP-A-2",
        "codigo": "HEP-A",
        "dose": 2,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "ANA LIZ RIBEIRO",
    "mae": "AMANDA LIA TORRES SOUSA",
    "pai": "",
    "dn": "2024-07-24",
    "tel": "",
    "status": "ativo",
    "plano": "Plano 18 meses",
    "doses": [
      {
        "key": "HEP-B-1",
        "codigo": "HEP-B",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-ACWY-2",
        "codigo": "MEN-ACWY",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FA-1",
        "codigo": "FA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "SCR-1",
        "codigo": "SCR",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "HEP-A-1",
        "codigo": "HEP-A",
        "dose": 1,
        "status": "aplicada",
        "data": null
      }
    ]
  },
  {
    "nome": "BENICIO EMANUEL ARAUJO",
    "mae": "LUANA ARAUJO",
    "pai": "",
    "dn": "2024-08-27",
    "tel": "",
    "status": "ativo",
    "plano": "Plano 18 meses",
    "doses": [
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-ACWY-2",
        "codigo": "MEN-ACWY",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-3",
        "codigo": "PCV20",
        "dose": 3,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FA-1",
        "codigo": "FA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEP-A-1",
        "codigo": "HEP-A",
        "dose": 1,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "ARTHUR CAVALCANTE ELOI MEDEIROS BANDEIRA",
    "mae": "",
    "pai": "",
    "dn": "2024-10-15",
    "tel": "(98)99111-9700",
    "status": "ativo",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FA-1",
        "codigo": "FA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "SCR-1",
        "codigo": "SCR",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "HEP-A-1",
        "codigo": "HEP-A",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "VZ-1",
        "codigo": "VZ",
        "dose": 1,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "MAYA LIZ SANTOS SILVA",
    "mae": "",
    "pai": "",
    "dn": "2024-06-17",
    "tel": "(98) 98458-2479",
    "status": "ativo",
    "plano": "Plano 18 meses",
    "doses": [
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-2",
        "codigo": "PCV20",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-ACWY-2",
        "codigo": "MEN-ACWY",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-3",
        "codigo": "PCV20",
        "dose": 3,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FA-1",
        "codigo": "FA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "SCR-1",
        "codigo": "SCR",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "HEP-A-1",
        "codigo": "HEP-A",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "VZ-1",
        "codigo": "VZ",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "CAIRO FILHO",
    "mae": "BRENDA DO SOCORRO DE OLIVEIRA SANTOS",
    "pai": "",
    "dn": "2024-11-06",
    "tel": "",
    "status": "finalizado",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FA-1",
        "codigo": "FA",
        "dose": 1,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "MARIA LIZ LUSTOSA DIAS RIBEIRO",
    "mae": "NAYRA DIAS",
    "pai": "",
    "dn": "2024-09-11",
    "tel": "(98) 98827-9929",
    "status": "ativo",
    "plano": "Plano 18 meses",
    "doses": [
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      }
    ]
  },
  {
    "nome": "DAVI CORTEZ COSTA",
    "mae": "",
    "pai": "",
    "dn": "2024-07-07",
    "tel": "(98) 99451-5626",
    "status": "ativo",
    "plano": "Plano 18 meses",
    "doses": [
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "aplicada",
        "data": "2024-09-11"
      },
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "aplicada",
        "data": "2024-09-11"
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FA-2",
        "codigo": "FA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "SCR-2",
        "codigo": "SCR",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEP-A-1",
        "codigo": "HEP-A",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "VZ-1",
        "codigo": "VZ",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "SCR-1",
        "codigo": "SCR",
        "dose": 1,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "MELISSA MORAES SALES OLIVEIRA",
    "mae": "BIANCA CARVALHO MORAES",
    "pai": "LUCAS SALES",
    "dn": "2024-06-11",
    "tel": "",
    "status": "ativo",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "MEN-ACWY-2",
        "codigo": "MEN-ACWY",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FA-1",
        "codigo": "FA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEP-A-1",
        "codigo": "HEP-A",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "VZ-2",
        "codigo": "VZ",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "SCR-1",
        "codigo": "SCR",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEP-A-2",
        "codigo": "HEP-A",
        "dose": 2,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "MARIA CLARA AMARAL",
    "mae": "AMANDA CRISTINA GAMA",
    "pai": "ELTON SOUSA AMARAL",
    "dn": "2024-09-23",
    "tel": "",
    "status": "ativo",
    "plano": "Plano Vacinal 0 a 6 meses",
    "doses": [
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "VICTOR FURTADO SARAIVA",
    "mae": "LILIANNE MARIA FURTADO SARAIVA",
    "pai": "",
    "dn": "2024-09-07",
    "tel": "",
    "status": "ativo",
    "plano": "Plano 18 meses",
    "doses": [
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-ACWY-2",
        "codigo": "MEN-ACWY",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FA-1",
        "codigo": "FA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEP-A-1",
        "codigo": "HEP-A",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "VZ-1",
        "codigo": "VZ",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "SCR-1",
        "codigo": "SCR",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "SCR-2",
        "codigo": "SCR",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "VZ-2",
        "codigo": "VZ",
        "dose": 2,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "JHONATAS LEMO DN10/07/24",
    "mae": "CAMILA GAMOS SILVA COSTA",
    "pai": "",
    "dn": "2024-07-10",
    "tel": "",
    "status": "ativo",
    "plano": "Plano 18 meses",
    "doses": [
      {
        "key": "HEP-A-2",
        "codigo": "HEP-A",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-ACWY-2",
        "codigo": "MEN-ACWY",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FA-1",
        "codigo": "FA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEP-A-1",
        "codigo": "HEP-A",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "VZ-1",
        "codigo": "VZ",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "SCR-1",
        "codigo": "SCR",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "MIGUEL JOSÉ PARENTE MOTA",
    "mae": "RENATA MAA MENDES PARENTE MOTA",
    "pai": "VINICIUS BARRALOTA",
    "dn": "2024-11-28",
    "tel": "",
    "status": "ativo",
    "plano": "Plano 18 meses",
    "doses": [
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "MARIA LUISA CASTRO CATANHEDE",
    "mae": "BEATRIZ OLIVEIRA DE CASTRO",
    "pai": "RAUL PFAAFF FERREIRA CATANHEDE",
    "dn": "2024-09-28",
    "tel": "",
    "status": "ativo",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FA-1",
        "codigo": "FA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEP-A-2",
        "codigo": "HEP-A",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEP-A-1",
        "codigo": "HEP-A",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "VZ-1",
        "codigo": "VZ",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "SCR-1",
        "codigo": "SCR",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "MARIA VITÓRIA ARAÚJO DA SILVA",
    "mae": "LAIS DE OLIVEIRA ARAÚJO DA SILVA",
    "pai": "SAULO",
    "dn": "2024-12-21",
    "tel": "",
    "status": "finalizado",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "HEP-B-1",
        "codigo": "HEP-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-2",
        "codigo": "PCV20",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-ACWY-2",
        "codigo": "MEN-ACWY",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "CATARINA BEZERRA QUEIROZ",
    "mae": "",
    "pai": "PEDRO QUEIROZ MARTINS",
    "dn": "2024-12-27",
    "tel": "",
    "status": "ativo",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "HEP-B-1",
        "codigo": "HEP-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "SAMUEL LUCAS DE VASCONCELOS SALES",
    "mae": "EVELINE CHISTINE SÁ DE VASCONCELOS SALES",
    "pai": "ALISSON JOSE DE SALES OLIVEIRA",
    "dn": "2024-09-29",
    "tel": "",
    "status": "finalizado",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-2",
        "codigo": "PCV20",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-ACWY-2",
        "codigo": "MEN-ACWY",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-3",
        "codigo": "PCV20",
        "dose": 3,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FA-1",
        "codigo": "FA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "aplicada",
        "data": "2024-12-06"
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "BENICIO TITO MOREIRA CUNHA",
    "mae": "MONIQUE FERREIRA CUNHA",
    "pai": "DIEGO",
    "dn": "2024-10-10",
    "tel": "",
    "status": "finalizado",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FA-1",
        "codigo": "FA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "KALEL GAMA DE OLIVEIRA",
    "mae": "",
    "pai": "",
    "dn": "2024-09-13",
    "tel": "",
    "status": "ativo",
    "plano": "Plano Vacinal 0 a 6 meses",
    "doses": [
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "PEDRO LEMUEL TEXEIRA DE SANTANA",
    "mae": "CLARINE TEIXEIRA DE SANTANA",
    "pai": "",
    "dn": "2024-10-11",
    "tel": "",
    "status": "ativo",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-ACWY-2",
        "codigo": "MEN-ACWY",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "ARTUR PAZ ARAÚJO",
    "mae": "INGRID LUISE PAZ ARAÚJO",
    "pai": "ARTUR ARAÚJO DA SILVA NETO",
    "dn": "2025-03-10",
    "tel": "",
    "status": "ativo",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-2",
        "codigo": "PCV20",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-3",
        "codigo": "PCV20",
        "dose": 3,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "OLIVIA BESSA BRANDÃO",
    "mae": "CAMILA BESSA BRANDÃO",
    "pai": "VITOR HUGO DE AGUIAR BRANDÃO",
    "dn": null,
    "tel": "",
    "status": "finalizado",
    "plano": "Plano 18 meses",
    "doses": [
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-2",
        "codigo": "PCV20",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-ACWY-2",
        "codigo": "MEN-ACWY",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-3",
        "codigo": "PCV20",
        "dose": 3,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "GABRIEL ANDRADE FERREIRA FILHO",
    "mae": "CAMILA CASTRO SOARES ANDRADE FERREIRA",
    "pai": "",
    "dn": "2025-02-02",
    "tel": "",
    "status": "ativo",
    "plano": "Plano 18 meses",
    "doses": [
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-2",
        "codigo": "PCV20",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-ACWY-2",
        "codigo": "MEN-ACWY",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-3",
        "codigo": "PCV20",
        "dose": 3,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FA-1",
        "codigo": "FA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "HEP-B-1",
        "codigo": "HEP-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEP-A-1",
        "codigo": "HEP-A",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "SCR-1",
        "codigo": "SCR",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "VZ-1",
        "codigo": "VZ",
        "dose": 1,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "ESTEVÃO ROCHA MARTINS",
    "mae": "MARILIA ROCHA MARTINS",
    "pai": "EMANUEL FLORENCIO PASSO MARTINS",
    "dn": "2024-11-05",
    "tel": "",
    "status": "ativo",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-ACWY-2",
        "codigo": "MEN-ACWY",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FA-1",
        "codigo": "FA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      }
    ]
  },
  {
    "nome": "GUILHEME CASTRO",
    "mae": "",
    "pai": "",
    "dn": "2021-01-08",
    "tel": "",
    "status": "ativo",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FA-1",
        "codigo": "FA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "HEP-A-1",
        "codigo": "HEP-A",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "SCR-1",
        "codigo": "SCR",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "VZ-1",
        "codigo": "VZ",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEP-A-2",
        "codigo": "HEP-A",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FA-2",
        "codigo": "FA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "LUNA AGUIAR RIBEIRO",
    "mae": "BRUNA AIRES",
    "pai": "",
    "dn": "2024-11-14",
    "tel": "",
    "status": "ativo",
    "plano": "Plano 18 meses",
    "doses": [
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-ACWY-2",
        "codigo": "MEN-ACWY",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "HELENA CHAVES ALMEIDA",
    "mae": "KELYANGELA DANYELLA CHAVES",
    "pai": "",
    "dn": "2024-12-07",
    "tel": "",
    "status": "ativo",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FA-1",
        "codigo": "FA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEP-A-1",
        "codigo": "HEP-A",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "SCR-1",
        "codigo": "SCR",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "VZ-1",
        "codigo": "VZ",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEP-A-2",
        "codigo": "HEP-A",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "MARIA ALICE PINHEIRO DOS SANTOS",
    "mae": "NATALIA PINHEIRO DA SILVA DOS SANTOS",
    "pai": "ANDRE LUIS DOS SANTOS",
    "dn": "2023-09-04",
    "tel": "",
    "status": "finalizado",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "HEP-A-2",
        "codigo": "HEP-A",
        "dose": 2,
        "status": "aplicada",
        "data": null
      }
    ]
  },
  {
    "nome": "HEITOR XAVIER DE ALMEIDA ANDRADE",
    "mae": "JOYCE COSTA XAVIER",
    "pai": "DANIEL HENRIQUE DE ALMEIDA AMANCIO ANDRADE",
    "dn": "2024-12-10",
    "tel": "",
    "status": "ativo",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "LAURA MARIA DA SILVA RODRIGUES DE CARVALHO",
    "mae": "FABRICIA MARIA DA SILVA RODRIGUES DE CARVALHO",
    "pai": "",
    "dn": "2025-02-01",
    "tel": "",
    "status": "ativo",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-2",
        "codigo": "PCV20",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-3",
        "codigo": "PCV20",
        "dose": 3,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FA-1",
        "codigo": "FA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEP-B-1",
        "codigo": "HEP-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "MATIAS SEREJO SERRA",
    "mae": "DELVYLENE SEREJO DE OLIVEIRA",
    "pai": "",
    "dn": "2024-11-23",
    "tel": "",
    "status": "ativo",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FA-1",
        "codigo": "FA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "MADALENA MARQUES BARBOSA",
    "mae": "LARISSA RIBEIRO DE LIMA MARQUES BARBOSA",
    "pai": "",
    "dn": "2024-12-14",
    "tel": "",
    "status": "ativo",
    "plano": "Plano 18 meses",
    "doses": [
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-2",
        "codigo": "PCV20",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-ACWY-2",
        "codigo": "MEN-ACWY",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "HEITOR ALMEIDA E SILVA",
    "mae": "",
    "pai": "RODRIGO COSTA E SILVA",
    "dn": "2025-01-17",
    "tel": "",
    "status": "ativo",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-3",
        "codigo": "PCV20",
        "dose": 3,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FA-1",
        "codigo": "FA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEP-A-1",
        "codigo": "HEP-A",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "SCR-1",
        "codigo": "SCR",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "VZ-1",
        "codigo": "VZ",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-ACWY-2",
        "codigo": "MEN-ACWY",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "EMANUEL GARCEZ MARTINS",
    "mae": "NEUZIANE ABREU GARCEZ",
    "pai": "",
    "dn": "2024-10-26",
    "tel": "",
    "status": "ativo",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-2",
        "codigo": "PCV20",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-ACWY-2",
        "codigo": "MEN-ACWY",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "LARA ALLEN HELUY",
    "mae": "RENATA CHRISTINA DA SILVA ALLEN",
    "pai": "AISLAN CAMARA CURI HELUY",
    "dn": "2024-12-16",
    "tel": "",
    "status": "ativo",
    "plano": "Plano 18 meses",
    "doses": [
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-2",
        "codigo": "PCV20",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-3",
        "codigo": "PCV20",
        "dose": 3,
        "status": "aplicada",
        "data": null
      }
    ]
  },
  {
    "nome": "MANFRINI FREITAS DA CUNHA FIGUEIREDO FILHO",
    "mae": "GILIANNY ARAÚJO DE MIRANDA",
    "pai": "",
    "dn": "2024-12-28",
    "tel": "",
    "status": "ativo",
    "plano": "Plano 18 meses",
    "doses": [
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "aplicada",
        "data": "2025-03-01"
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-2",
        "codigo": "PCV20",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-3",
        "codigo": "PCV20",
        "dose": 3,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FA-1",
        "codigo": "FA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEP-A-1",
        "codigo": "HEP-A",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "SCR-1",
        "codigo": "SCR",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "VZ-1",
        "codigo": "VZ",
        "dose": 1,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "KRISTOPHER TEIXEIRA DE MORAES",
    "mae": "CLEYANE DE MARIA TEIXEIRA ABREU",
    "pai": "KRISTHYAN MORAES PEREIRA",
    "dn": "2025-01-04",
    "tel": "",
    "status": "finalizado",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "SCR-1",
        "codigo": "SCR",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "VZ-1",
        "codigo": "VZ",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEP-A-2",
        "codigo": "HEP-A",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-2",
        "codigo": "PCV20",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-ACWY-2",
        "codigo": "MEN-ACWY",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-3",
        "codigo": "PCV20",
        "dose": 3,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "LIZ FIGUEIRA SANTOS",
    "mae": "ELAINE FIGUEIRA RIBEIRO",
    "pai": "",
    "dn": "2025-02-22",
    "tel": "",
    "status": "ativo",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "HEP-B-1",
        "codigo": "HEP-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "AURORA ABREU BERREDO",
    "mae": "CRISTINA ABREUS BERREDO",
    "pai": "AQUILES DE JESUS SUATHE BERREDO",
    "dn": "2025-01-24",
    "tel": "",
    "status": "ativo",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-2",
        "codigo": "PCV20",
        "dose": 2,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "HELOISE MAIA MOREIRA CANGUSSU",
    "mae": "MARCYLENE PAURA CANGUSSU",
    "pai": "MABIO REYVISON PEREIRA MOREIRA",
    "dn": "2024-12-27",
    "tel": "",
    "status": "finalizado",
    "plano": "Plano Vacinal 0 a 6 meses",
    "doses": [
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "DANIEL DIAS DUTRA",
    "mae": "PHYAMA DIAS DUTRA",
    "pai": "s PEREIRA DUTRA",
    "dn": "2024-12-30",
    "tel": "",
    "status": "finalizado",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "LAIS FONSECA WETTERS",
    "mae": "MARYLIN FONSECA",
    "pai": "",
    "dn": "2024-12-14",
    "tel": "",
    "status": "finalizado",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-2",
        "codigo": "PCV20",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-3",
        "codigo": "PCV20",
        "dose": 3,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "KEMUEL DA SILVA GOMES",
    "mae": "JESSICA MANOELLA RIBEIRO DA SILVA GOMES",
    "pai": "THIAGO ANDRÉ DA SILVA GOMES",
    "dn": "2025-01-08",
    "tel": "",
    "status": "ativo",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "aplicada",
        "data": "2025-03-12"
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-2",
        "codigo": "PCV20",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "LEMUEL MESSI NUNES GARCES",
    "mae": "MESSIA CRISTINA NUNES GARCES OLIVEIRA",
    "pai": "ADONIS GARCES OLIVEIRA",
    "dn": "2025-02-01",
    "tel": "",
    "status": "ativo",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-3",
        "codigo": "PCV20",
        "dose": 3,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FA-1",
        "codigo": "FA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "VITOR MARTINS BRAUNA",
    "mae": "ERYKA MARIA MARTINS",
    "pai": "",
    "dn": "2025-03-10",
    "tel": "",
    "status": "ativo",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-2",
        "codigo": "PCV20",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-3",
        "codigo": "PCV20",
        "dose": 3,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FA-1",
        "codigo": "FA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "MARCOS PAULO DE SOUSA PEREIRA",
    "mae": "MILCA NAYARA BARROSO PIRES",
    "pai": "",
    "dn": "2025-02-13",
    "tel": "",
    "status": "ativo",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-2",
        "codigo": "PCV20",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-3",
        "codigo": "PCV20",
        "dose": 3,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FA-1",
        "codigo": "FA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEP-A-1",
        "codigo": "HEP-A",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "SCR-1",
        "codigo": "SCR",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "VZ-1",
        "codigo": "VZ",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEP-A-2",
        "codigo": "HEP-A",
        "dose": 2,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "FRANCISCO GABRIEL FURLAN ABRANTE FURLAN",
    "mae": "JENNYFER BRENHA FURLAN",
    "pai": "",
    "dn": "2025-01-15",
    "tel": "",
    "status": "ativo",
    "plano": "Plano 18 meses",
    "doses": [
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-2",
        "codigo": "PCV20",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-ACWY-2",
        "codigo": "MEN-ACWY",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-3",
        "codigo": "PCV20",
        "dose": 3,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FA-1",
        "codigo": "FA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEP-A-1",
        "codigo": "HEP-A",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "SCR-1",
        "codigo": "SCR",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "VZ-1",
        "codigo": "VZ",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEP-A-2",
        "codigo": "HEP-A",
        "dose": 2,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "GIULIANO FONTOURA AMORIM",
    "mae": "ANNE NATHALY ARAUJO FONTOURA AMORIM",
    "pai": "GABRIEL ARAUJO AMORIM",
    "dn": "2025-03-07",
    "tel": "",
    "status": "ativo",
    "plano": "Plano 18 meses",
    "doses": [
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-2",
        "codigo": "PCV20",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-ACWY-2",
        "codigo": "MEN-ACWY",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-3",
        "codigo": "PCV20",
        "dose": 3,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FA-1",
        "codigo": "FA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEP-A-1",
        "codigo": "HEP-A",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "SCR-1",
        "codigo": "SCR",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "VZ-1",
        "codigo": "VZ",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEP-A-2",
        "codigo": "HEP-A",
        "dose": 2,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "LAIS FONSECA WETTERS",
    "mae": "MARYLIN FONSECA LEAL DE FARIAS WETTERS CONTATO: 9899146-2607 CONCLUIDO",
    "pai": "",
    "dn": "2024-12-14",
    "tel": "",
    "status": "finalizado",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "ENRICO CAIXETA LIMA",
    "mae": "ALESKA GABRIELLE SANTOS LIMA CAIXETA",
    "pai": "JOSE ANTONIO CAIXETA GOMES",
    "dn": "2024-03-07",
    "tel": "",
    "status": "finalizado",
    "plano": "Plano Vacinal 12 a 24 meses",
    "doses": [
      {
        "key": "HEP-A-1",
        "codigo": "HEP-A",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "SCR-1",
        "codigo": "SCR",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "VZ-1",
        "codigo": "VZ",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEP-A-2",
        "codigo": "HEP-A",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "MARIA OLIVIA SOUZA OLIVEIRA",
    "mae": "CAROLINA BOGEA SOUZA DE OLIVEIRA CONTATO:",
    "pai": "",
    "dn": "2024-12-20",
    "tel": "",
    "status": "ativo",
    "plano": "Plano 18 meses",
    "doses": [
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-2",
        "codigo": "PCV20",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-ACWY-2",
        "codigo": "MEN-ACWY",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-3",
        "codigo": "PCV20",
        "dose": 3,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FA-1",
        "codigo": "FA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEP-A-1",
        "codigo": "HEP-A",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "SCR-1",
        "codigo": "SCR",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "VZ-1",
        "codigo": "VZ",
        "dose": 1,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "HELENA MENEZES NOBRE MONTEIRO",
    "mae": "DANIELLA BERNADO DE MENEZES",
    "pai": "AMARILDO NOBRE MONTEIRO",
    "dn": "2025-03-27",
    "tel": "",
    "status": "ativo",
    "plano": "Plano 18 meses",
    "doses": [
      {
        "key": "HEP-B-1",
        "codigo": "HEP-B",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-2",
        "codigo": "PCV20",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-ACWY-2",
        "codigo": "MEN-ACWY",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-3",
        "codigo": "PCV20",
        "dose": 3,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FA-1",
        "codigo": "FA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEP-A-1",
        "codigo": "HEP-A",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "SCR-1",
        "codigo": "SCR",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "VZ-1",
        "codigo": "VZ",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEP-A-2",
        "codigo": "HEP-A",
        "dose": 2,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "ENRICO LIRA CARVALHO BARROS",
    "mae": "MELISSA LIRA DOS SANTOS BARROS",
    "pai": "",
    "dn": "2025-01-10",
    "tel": "",
    "status": "ativo",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "DANIEL LEITE BRAGA MARTINS",
    "mae": "BRENDA RODRIGUES COELHO LEITE",
    "pai": "",
    "dn": "2025-02-07",
    "tel": "",
    "status": "finalizado",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-ACWY-2",
        "codigo": "MEN-ACWY",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "RAFAEL MORAES COSTA",
    "mae": "MARIA AQUINO MORAES",
    "pai": "ALYSSON MENDES COSTA",
    "dn": "2025-02-07",
    "tel": "",
    "status": "ativo",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-2",
        "codigo": "PCV20",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-ACWY-2",
        "codigo": "MEN-ACWY",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-3",
        "codigo": "PCV20",
        "dose": 3,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FA-1",
        "codigo": "FA",
        "dose": 1,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "ANA CECÍLIA DINIZ MAIA",
    "mae": "ANA CAROLINE FERREIRA DINIZ MAIA TEL 98 98170-9255",
    "pai": "MARCIO VINICIUS SOUSA MAIA",
    "dn": "2025-01-30",
    "tel": "",
    "status": "ativo",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-2",
        "codigo": "PCV20",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-ACWY-2",
        "codigo": "MEN-ACWY",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-3",
        "codigo": "PCV20",
        "dose": 3,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "MARCELO PORFIRIO CUTRIM SILVA",
    "mae": "",
    "pai": "LEONARDO PORFIRIO ASSIS SANTOS",
    "dn": null,
    "tel": "",
    "status": "ativo",
    "plano": "Plano 18 meses",
    "doses": [
      {
        "key": "HEP-A-2",
        "codigo": "HEP-A",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-2",
        "codigo": "PCV20",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-ACWY-2",
        "codigo": "MEN-ACWY",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-3",
        "codigo": "PCV20",
        "dose": 3,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FA-1",
        "codigo": "FA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEP-A-1",
        "codigo": "HEP-A",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "SCR-1",
        "codigo": "SCR",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "VZ-1",
        "codigo": "VZ",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "LUCAS HENRIQUE ROCHA BEZERRA",
    "mae": "DANIELLE ROCHA DA SILVA",
    "pai": "ALEX BRUNO BRAGA ,",
    "dn": "2025-03-03",
    "tel": "",
    "status": "ativo",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-2",
        "codigo": "PCV20",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-ACWY-2",
        "codigo": "MEN-ACWY",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-3",
        "codigo": "PCV20",
        "dose": 3,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FA-1",
        "codigo": "FA",
        "dose": 1,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "JOSE MACIEL CARVALHO",
    "mae": "",
    "pai": "RUAN PEREIRA CARVALHO",
    "dn": null,
    "tel": "",
    "status": "ativo",
    "plano": "Plano 18 meses",
    "doses": [
      {
        "key": "HEP-B-1",
        "codigo": "HEP-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-2",
        "codigo": "PCV20",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-ACWY-2",
        "codigo": "MEN-ACWY",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-3",
        "codigo": "PCV20",
        "dose": 3,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FA-1",
        "codigo": "FA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEP-A-1",
        "codigo": "HEP-A",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "SCR-1",
        "codigo": "SCR",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "VZ-1",
        "codigo": "VZ",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEP-A-2",
        "codigo": "HEP-A",
        "dose": 2,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "MARIA SOFIA ALENCAR FALCÃO DE CARVALHO",
    "mae": "",
    "pai": "JOÃO PEDRO FALCÃO DE CARVALHO",
    "dn": null,
    "tel": "",
    "status": "ativo",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-2",
        "codigo": "PCV20",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-ACWY-2",
        "codigo": "MEN-ACWY",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-3",
        "codigo": "PCV20",
        "dose": 3,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "PIETRA TIMBÓ CASSAS",
    "mae": "RENATA MORENO TIMBÓ CASSAS DUPLICADO",
    "pai": "PABLO TOMÁS CASSAS",
    "dn": "2025-02-07",
    "tel": "",
    "status": "ativo",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FA-1",
        "codigo": "FA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEP-A-1",
        "codigo": "HEP-A",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "SCR-1",
        "codigo": "SCR",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "VZ-1",
        "codigo": "VZ",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "SCR-2",
        "codigo": "SCR",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "VZ-2",
        "codigo": "VZ",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEP-A-2",
        "codigo": "HEP-A",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-2",
        "codigo": "PCV20",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "RAFAEL MORAES COSTA",
    "mae": "RAISA MARIA AQUINO MORAES",
    "pai": "ALYSSON MENDES COSTA",
    "dn": "2025-02-07",
    "tel": "",
    "status": "ativo",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-2",
        "codigo": "PCV20",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-ACWY-2",
        "codigo": "MEN-ACWY",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-3",
        "codigo": "PCV20",
        "dose": 3,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "LARA DE OLIVEIRA SOUSA",
    "mae": "MONIK CAROLINE DE OLIVEIRA SOUSA",
    "pai": "JORDAN WILKENS BATISTA SANTOS DE SOUSA",
    "dn": null,
    "tel": "",
    "status": "ativo",
    "plano": "Plano 18 meses",
    "doses": [
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-2",
        "codigo": "PCV20",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-ACWY-2",
        "codigo": "MEN-ACWY",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-3",
        "codigo": "PCV20",
        "dose": 3,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FA-1",
        "codigo": "FA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEP-A-1",
        "codigo": "HEP-A",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "SCR-1",
        "codigo": "SCR",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "VZ-1",
        "codigo": "VZ",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEP-A-2",
        "codigo": "HEP-A",
        "dose": 2,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "CATARINA BARROS MOTA",
    "mae": "MARIANA BARROS MOTA DUPLICADA",
    "pai": "MATEUS BARBALHO MOTA",
    "dn": "2025-04-12",
    "tel": "",
    "status": "ativo",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEP-B-1",
        "codigo": "HEP-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-2",
        "codigo": "PCV20",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-ACWY-2",
        "codigo": "MEN-ACWY",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-3",
        "codigo": "PCV20",
        "dose": 3,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FA-1",
        "codigo": "FA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "CECILIA LOUISE FERREIRA COSTA",
    "mae": "FIAMA RAFAELA FERREIRA COSTA",
    "pai": "TIAGO HENRIQUE COSTA PEREIRA",
    "dn": "2025-04-10",
    "tel": "",
    "status": "ativo",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "BENJAMIN DIZ DE SÁ",
    "mae": "PAULA JAMILE ARAUJO DINIZ DE SÁ",
    "pai": "RODOLFO FERREIRA DE SÁ",
    "dn": "2025-02-28",
    "tel": "",
    "status": "ativo",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-2",
        "codigo": "PCV20",
        "dose": 2,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "ANA CECILIA DINIZ MAIA",
    "mae": "ANA CAROLINE FERREIRA DINIZ MAIA TEL 98 98170-9255",
    "pai": "MARCIO VINICIUS SOUSA MAIA",
    "dn": "2025-01-30",
    "tel": "",
    "status": "ativo",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-2",
        "codigo": "PCV20",
        "dose": 2,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "HENRIQUE DEMES FRANÇA",
    "mae": "LARA PARAGUASSU DEMES FRANÇA",
    "pai": "DIOGO FERREIRA FRANÇA",
    "dn": null,
    "tel": "",
    "status": "ativo",
    "plano": "Plano 18 meses",
    "doses": [
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-2",
        "codigo": "PCV20",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-ACWY-2",
        "codigo": "MEN-ACWY",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "MARCELO PORFIRIO ASSIS SANTOS",
    "mae": "SAPHYRA DE SOUSA CUTRIM",
    "pai": "LEONARDO PORFIRIO ASSIS SANTOS",
    "dn": null,
    "tel": "",
    "status": "ativo",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "PCV20-3",
        "codigo": "PCV20",
        "dose": 3,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FA-1",
        "codigo": "FA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEP-A-1",
        "codigo": "HEP-A",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "SCR-1",
        "codigo": "SCR",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "VZ-1",
        "codigo": "VZ",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEP-A-2",
        "codigo": "HEP-A",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-2",
        "codigo": "PCV20",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-ACWY-2",
        "codigo": "MEN-ACWY",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "LUCAS HENRIQUE ROCHA BEZERRA",
    "mae": "DANIELLE ROCHA DA SILVA",
    "pai": "ALEX BRUNO BRAGA",
    "dn": "2025-03-03",
    "tel": "",
    "status": "ativo",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FA-1",
        "codigo": "FA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEP-A-1",
        "codigo": "HEP-A",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "SCR-1",
        "codigo": "SCR",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "VZ-1",
        "codigo": "VZ",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEP-A-2",
        "codigo": "HEP-A",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-2",
        "codigo": "PCV20",
        "dose": 2,
        "status": "aplicada",
        "data": null
      }
    ]
  },
  {
    "nome": "ARTHUR FERREIRA GOULART DE MELO",
    "mae": "JÉSSICA FERREIRA GOULART DE MELO",
    "pai": "",
    "dn": null,
    "tel": "",
    "status": "ativo",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-ACWY-2",
        "codigo": "MEN-ACWY",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-3",
        "codigo": "PCV20",
        "dose": 3,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FA-1",
        "codigo": "FA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-2",
        "codigo": "PCV20",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "PEROLA OLIMPIO CAVALCANTE ALCODAÇA",
    "mae": "WALMARTA OLIMPIO",
    "pai": "MAXWELL CAVALCANTE ALCODAÇA",
    "dn": "2024-03-23",
    "tel": "",
    "status": "ativo",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FA-1",
        "codigo": "FA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-3",
        "codigo": "PCV20",
        "dose": 3,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-ACWY-2",
        "codigo": "MEN-ACWY",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "CECILIA PEREIRA BRITO",
    "mae": "KEYLA BRITO",
    "pai": "",
    "dn": "2025-03-29",
    "tel": "",
    "status": "ativo",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FA-1",
        "codigo": "FA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "HEP-A-1",
        "codigo": "HEP-A",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "SCR-1",
        "codigo": "SCR",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "VZ-1",
        "codigo": "VZ",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "SCR-2",
        "codigo": "SCR",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "VZ-2",
        "codigo": "VZ",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEP-A-2",
        "codigo": "HEP-A",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-2",
        "codigo": "PCV20",
        "dose": 2,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "ALANA SODRÉ ALMEIDA LIMA VIEIRA",
    "mae": "TIRZA SODRÉ ALMEIDA LIMA",
    "pai": "ARYSSELMO LIMA VIEIRA",
    "dn": null,
    "tel": "",
    "status": "ativo",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "VZ-1",
        "codigo": "VZ",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEP-A-1",
        "codigo": "HEP-A",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEP-B-1",
        "codigo": "HEP-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-2",
        "codigo": "PCV20",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-ACWY-2",
        "codigo": "MEN-ACWY",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-3",
        "codigo": "PCV20",
        "dose": 3,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "MANUELA SILVEIRA KZAM PEREIRA",
    "mae": "ALINNE OLIVEIRA SILVEIRA KZAM",
    "pai": "DIÊGO ANDERSON KZAM PEREIRA",
    "dn": "2024-05-18",
    "tel": "",
    "status": "ativo",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FA-1",
        "codigo": "FA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-2",
        "codigo": "PCV20",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-ACWY-2",
        "codigo": "MEN-ACWY",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-3",
        "codigo": "PCV20",
        "dose": 3,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "ÁGATA CASTRO FERREIRA",
    "mae": "CAMILA CASTRO DE ABREU",
    "pai": "LÚCIO FERNANDO PENHA FERREIRA",
    "dn": "2025-03-01",
    "tel": "",
    "status": "ativo",
    "plano": "Plano 18 meses",
    "doses": [
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-2",
        "codigo": "PCV20",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-ACWY-2",
        "codigo": "MEN-ACWY",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-3",
        "codigo": "PCV20",
        "dose": 3,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FA-1",
        "codigo": "FA",
        "dose": 1,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "MANUELA PEREIRA BARROS",
    "mae": "ISABELA RAISSA PEREIRA BARROS",
    "pai": "RENE DE JESUS SILVA BARROS FILHO",
    "dn": "2025-05-08",
    "tel": "",
    "status": "ativo",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "HEP-A-1",
        "codigo": "HEP-A",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "SCR-1",
        "codigo": "SCR",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "VZ-1",
        "codigo": "VZ",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEP-A-2",
        "codigo": "HEP-A",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-2",
        "codigo": "PCV20",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "ARTHUR NINA PADILHA TRINDADE",
    "mae": "THAIS SANTOS NINA PADINHA TRINDADE",
    "pai": "DIEGO PADINHA TRINDADE",
    "dn": "2025-05-19",
    "tel": "",
    "status": "ativo",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-2",
        "codigo": "PCV20",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-ACWY-2",
        "codigo": "MEN-ACWY",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-3",
        "codigo": "PCV20",
        "dose": 3,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FA-1",
        "codigo": "FA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEP-A-1",
        "codigo": "HEP-A",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "SCR-1",
        "codigo": "SCR",
        "dose": 1,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "MARIANA CHAVES PAULINO ​",
    "mae": "JÉSSICA PAULINO CHAVES ​",
    "pai": "JONAS PAULINO SILVA JÚNIOR",
    "dn": "2025-06-16",
    "tel": "",
    "status": "ativo",
    "plano": "Plano 18 meses",
    "doses": [
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-2",
        "codigo": "PCV20",
        "dose": 2,
        "status": "aplicada",
        "data": null
      }
    ]
  },
  {
    "nome": "MARIA RITA RODRIGUES BATISTA DA SILVA",
    "mae": "ELAINE",
    "pai": "",
    "dn": "2024-07-27",
    "tel": "",
    "status": "ativo",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-3",
        "codigo": "PCV20",
        "dose": 3,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-3",
        "codigo": "FLU",
        "dose": 3,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FA-1",
        "codigo": "FA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "SCR-1",
        "codigo": "SCR",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEP-A-1",
        "codigo": "HEP-A",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "VZ-1",
        "codigo": "VZ",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEP-A-2",
        "codigo": "HEP-A",
        "dose": 2,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "JOÃO LUCAS CUTRIM FERREIRA",
    "mae": "RAIANE FERNANDES CUTRIM",
    "pai": "IVALDO FERREIRA JUNIOR",
    "dn": "2025-05-16",
    "tel": "",
    "status": "ativo",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-3",
        "codigo": "PCV20",
        "dose": 3,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FA-1",
        "codigo": "FA",
        "dose": 1,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "LIVIA MAIA OTONI",
    "mae": "OLIVIA MARIA PACHECO MAIA OTONI",
    "pai": "LUCAS OTONI LIMA ROCHA",
    "dn": "2024-10-26",
    "tel": "",
    "status": "ativo",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-2",
        "codigo": "PCV20",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-3",
        "codigo": "PCV20",
        "dose": 3,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "FA-1",
        "codigo": "FA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      }
    ]
  },
  {
    "nome": "MARIA HELENA MENDES SILVA",
    "mae": "SUELLEN MENDES GOMES BEZERRA",
    "pai": "RONALDO ALBERTO DA CONCEIÇÃO SILVA",
    "dn": "2025-06-06",
    "tel": "",
    "status": "ativo",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PCV20-2",
        "codigo": "PCV20",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-3",
        "codigo": "PCV20",
        "dose": 3,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "HENRY MACEDO LIMA SOARES",
    "mae": "KLYCIA LIMA SILVA SOARES",
    "pai": "ERISON CORREA SOARES",
    "dn": "2025-08-27",
    "tel": "",
    "status": "ativo",
    "plano": "Plano 18 meses",
    "doses": [
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-2",
        "codigo": "PCV20",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-ACWY-2",
        "codigo": "MEN-ACWY",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "JOSÉ VITOR ALVES DA PAZ",
    "mae": "AMANDA ALVES PENHA",
    "pai": "",
    "dn": "2024-05-10",
    "tel": "",
    "status": "ativo",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "HEP-B-1",
        "codigo": "HEP-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-2",
        "codigo": "PCV20",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-ACWY-2",
        "codigo": "MEN-ACWY",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "pendente",
        "data": null
      },
      {
        "key": "SCR-1",
        "codigo": "SCR",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-3",
        "codigo": "FLU",
        "dose": 3,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FA-1",
        "codigo": "FA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEP-A-1",
        "codigo": "HEP-A",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "VZ-1",
        "codigo": "VZ",
        "dose": 1,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "HENRIQUE SOUSA CAMPELO",
    "mae": "",
    "pai": "",
    "dn": "2025-07-08",
    "tel": "",
    "status": "ativo",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-2",
        "codigo": "PCV20",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-ACWY-2",
        "codigo": "MEN-ACWY",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-3",
        "codigo": "PCV20",
        "dose": 3,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FA-1",
        "codigo": "FA",
        "dose": 1,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "Antônio Henrico Sarges Teixeira Silva",
    "mae": "",
    "pai": "",
    "dn": "2025-05-12",
    "tel": "",
    "status": "ativo",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-2",
        "codigo": "PCV20",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEXA-2",
        "codigo": "HEXA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-3",
        "codigo": "PCV20",
        "dose": 3,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FA-1",
        "codigo": "FA",
        "dose": 1,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "EVA MENDES BRANDÃO",
    "mae": "TALITA MENDES RIBEIRO",
    "pai": "VINICIUS RENAN LIMA BRANDÃO",
    "dn": "2025-08-04",
    "tel": "",
    "status": "ativo",
    "plano": "Plano 18 meses",
    "doses": [
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-2",
        "codigo": "PCV20",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "LUÍSA GUARÁ GIACOMINI",
    "mae": "RAISSA GUARA ASSUNÇÃO GIACOMINI",
    "pai": "RAFAEL GIACOMINI DA CRUZ PEREIRA",
    "dn": null,
    "tel": "",
    "status": "ativo",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "ANTONELLA MARIA BELLUOMINI DE ALENCAR MARTINS",
    "mae": "ANA CAROLLINE DE ALENCAR MARTINS",
    "pai": "NELSON FERREIRA MARTINS NETO",
    "dn": "2025-07-10",
    "tel": "",
    "status": "ativo",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-2",
        "codigo": "PCV20",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-2",
        "codigo": "ROTA",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-2",
        "codigo": "MEN-B",
        "dose": 2,
        "status": "pendente",
        "data": null
      },
      {
        "key": "ROTA-3",
        "codigo": "ROTA",
        "dose": 3,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "SCR-1",
        "codigo": "SCR",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-3",
        "codigo": "FLU",
        "dose": 3,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-2",
        "codigo": "FLU",
        "dose": 2,
        "status": "pendente",
        "data": null
      }
    ]
  },
  {
    "nome": "ISABELLA KEWPYS DOS SANTOS NOGUEIRA",
    "mae": "PRISCILA RAYANE DE MELO NOGUEIRA CONTATO: 98 991726848",
    "pai": "TALYSOM KEWPYS DOS SANTOS SILVA",
    "dn": "2025-08-02",
    "tel": "",
    "status": "ativo",
    "plano": "Plano Vacinal",
    "doses": []
  },
  {
    "nome": "BENÍCIO MIRANDA LIMA ​ ​",
    "mae": "YNDIA NAYAR MIRANDA CARAÇA ​",
    "pai": "ROMEU LIMA PEREIRA",
    "dn": null,
    "tel": "",
    "status": "ativo",
    "plano": "Plano Vacinal",
    "doses": [
      {
        "key": "HEXA-1",
        "codigo": "HEXA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PCV20-1",
        "codigo": "PCV20",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "ROTA-1",
        "codigo": "ROTA",
        "dose": 1,
        "status": "aplicada",
        "data": null
      },
      {
        "key": "MEN-ACWY-1",
        "codigo": "MEN-ACWY",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "MEN-B-1",
        "codigo": "MEN-B",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "PENTA-1",
        "codigo": "PENTA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FLU-1",
        "codigo": "FLU",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "FA-1",
        "codigo": "FA",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "SCR-1",
        "codigo": "SCR",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEP-A-1",
        "codigo": "HEP-A",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "VZ-1",
        "codigo": "VZ",
        "dose": 1,
        "status": "pendente",
        "data": null
      },
      {
        "key": "HEP-A-2",
        "codigo": "HEP-A",
        "dose": 2,
        "status": "pendente",
        "data": null
      }
    ]
  }
];

  const clientes = CLIENTES_DATA;
  
  let created = 0, updated = 0, planosCreated = 0, dosesCreated = 0, errors = 0;
  
  for (const c of clientes) {
    try {
      // Check if client already exists by name
      let cliente = await prisma.cliente.findFirst({
        where: { nome: c.nome }
      });
      
      if (cliente) {
        // Update existing
        await prisma.cliente.update({
          where: { id: cliente.id },
          data: {
            responsavelNome: c.mae || undefined,
            telefone: c.tel || undefined,
            tipoPaciente: 'crianca',
            tipoCliente: 'ativo',
            status: 'ativo',
          }
        });
        updated++;
      } else {
        // Create new
        const tipoCliente = 'ativo';
        const last = await prisma.cliente.findFirst({
          where: { codigoCliente: { startsWith: 'VIT-' } },
          orderBy: { id: 'desc' }
        });
        const n = last ? parseInt(last.codigoCliente.replace('VIT-', '')) + 1 : 1;
        const codigo = 'VIT-' + String(n).padStart(3, '0');
        
        cliente = await prisma.cliente.create({
          data: {
            nome: c.nome,
            codigoCliente: codigo,
            dataNascimento: c.dn ? new Date(c.dn) : null,
            tipoPaciente: 'crianca',
            tipoCliente,
            responsavelNome: c.mae || null,
            responsavelParentesco: c.mae ? 'mae' : null,
            telefone: c.tel || null,
            pacienteNome: c.nome,
            pacienteNascimento: c.dn ? new Date(c.dn) : null,
            status: 'ativo',
          }
        });
        created++;
      }
      
      // Create plan if has doses
      if (c.doses && c.doses.length > 0) {
        // Check if plan already exists
        const existingPlan = await prisma.planoContratado.findFirst({
          where: { clienteId: cliente.id, nomePlano: c.plano }
        });
        
        if (!existingPlan) {
          const valor = PLANO_VALORES[c.plano] || 3000;
          const statusContrato = c.status === 'finalizado' ? 'finalizado' : 'ativo';
          
          const plano = await prisma.planoContratado.create({
            data: {
              clienteId: cliente.id,
              nomePlano: c.plano,
              valorBruto: valor,
              valorFinal: valor,
              percentualDesconto: 0,
              margemLucro: 100,
              statusContrato,
              idadeInicio: c.plano.includes('0 a 6') ? 0 : c.plano.includes('6 a 12') ? 6 : 0,
              idadeFim: c.plano.includes('0 a 6') ? 6 : c.plano.includes('6 a 12') ? 12 : 18,
            }
          });
          planosCreated++;
          
          // Create doses
          let mesBase = 2;
          for (const d of c.doses) {
            const vacinaId = vacMap[d.codigo];
            if (!vacinaId) {
              console.log('  ⚠ Vacina não encontrada:', d.codigo);
              continue;
            }
            
            await prisma.planoContratadoDose.create({
              data: {
                planoContratadoId: plano.id,
                vacinaId,
                doseNumero: d.dose,
                mesPrevisto: mesBase,
                competencia: c.dn ? new Date(new Date(c.dn).setMonth(new Date(c.dn).getMonth() + mesBase)).toISOString().slice(0,7) : null,
                status: d.status,
                dataAplicacao: d.data ? new Date(d.data) : null,
              }
            });
            dosesCreated++;
            mesBase += (d.dose === 1 ? 0 : 2);
          }
        }
      }
    } catch (e) {
      console.error('Erro:', c.nome, e.message);
      errors++;
    }
  }
  
  console.log('\n═══ RESULTADO ═══');
  console.log('Clientes criados:', created);
  console.log('Clientes atualizados:', updated);
  console.log('Planos criados:', planosCreated);
  console.log('Doses criadas:', dosesCreated);
  console.log('Erros:', errors);
  
  await prisma.$disconnect();
}

run().catch(e => { console.error(e); process.exit(1); });
