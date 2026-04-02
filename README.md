# 💎 VittaSys API — Vittalis Saúde

API de Gestão de Vacinação com PostgreSQL, Prisma ORM e arquitetura em camadas.

## Stack

| Camada | Tecnologia |
|---|---|
| Runtime | Node.js 18+ |
| Framework | Express |
| ORM | Prisma |
| Banco | PostgreSQL |
| Deploy | Railway |

## Estrutura

```
src/
├── server.js              # Entry point
├── app.js                 # Express config
├── config/database.js     # Prisma singleton
├── middlewares/
│   ├── errorHandler.js    # Error handling global
│   └── validate.js        # Validações (CPF, campos)
├── routes/                # Rotas HTTP
├── controllers/           # Recebe req/res
├── services/              # Regras de negócio
└── repositories/          # Acesso ao banco (Prisma)
```

## Rodar Local

```bash
# 1. Instalar dependências
npm install

# 2. Criar .env com seu PostgreSQL local
cp .env.example .env
# Edite DATABASE_URL com seus dados

# 3. Criar tabelas + seed
npx prisma db push
node prisma/seed.js

# 4. Iniciar
npm start
```

## Deploy no Railway

```bash
# 1. Criar projeto no Railway (railway.app)
# 2. Adicionar PostgreSQL como plugin
# 3. Conectar repositório GitHub
# 4. Railway auto-detecta o Procfile e faz deploy
# 5. A DATABASE_URL é injetada automaticamente pelo Railway
```

O `Procfile` executa migrations automaticamente antes de iniciar.

## API Endpoints

### Vacinas
```
POST /api/vaccines          { name, manufacturer, dosesTotal? }
GET  /api/vaccines
GET  /api/vaccines/:id
```

### Lotes
```
POST   /api/batches         { vaccineId, batchNumber, expirationDate, quantityTotal }
GET    /api/batches
GET    /api/batches/:id
DELETE /api/batches/:id     (só se não tiver movimentações)
```

### Estoque
```
GET  /api/stock             Lotes com estoque disponível
GET  /api/stock/history     ?type=entrada|saida&batchId=&patientId=&from=&to=&limit=&offset=
POST /api/stock/entry       { batchId, quantity, reason? }
POST /api/stock/exit        { batchId, quantity, reason?, patientId? }
```

### Pacientes
```
POST /api/patients          { name, cpf, birthDate?, phone?, email? }
GET  /api/patients
GET  /api/patients/:id
```

### Health
```
GET /api/health
```

## Regras de Negócio

- **Saída**: reduz estoque do lote automaticamente (transação atômica)
- **Saída > estoque**: bloqueada com erro 400
- **Lote vencido**: bloqueado para saída
- **Exclusão de lote**: só se não tiver movimentações
- **CPF duplicado**: bloqueado (unique constraint)
- **Entrada**: incrementa estoque do lote
- **Rastreabilidade**: toda movimentação registra lote + paciente + timestamp

## Prisma Studio

```bash
npx prisma studio  # UI visual do banco em localhost:5555
```

## Variáveis de Ambiente

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | Connection string PostgreSQL |
| `PORT` | Porta do servidor (default: 3000) |
| `NODE_ENV` | development / production |
