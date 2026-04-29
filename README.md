# 💎 VittaSys v2.0 — Vittalis Saúde

Frontend + Backend integrado. PostgreSQL + Prisma. Deploy direto no Railway.

## Rodar Local

```bash
# 1. Clone
git clone https://github.com/mieciocosta/vittasys.git
cd vittasys

# 2. Instale
npm install

# 3. Configure o banco
cp .env.example .env
# Edite DATABASE_URL com seu PostgreSQL local

# 4. Crie tabelas + dados
npx prisma db push
node prisma/seed.js

# 5. Rode
npm start
# Acesse http://localhost:3000
```

## Deploy no Railway

```bash
# 1. Push para o GitHub
git add .
git commit -m "VittaSys v2.0 - Frontend + Backend integrado"
git push origin main 

# 2. No Railway:
#    - O serviço já está conectado ao repo
#    - DATABASE_URL já está configurada
#    - O Procfile executa: prisma db push + node src/server.js
#    - Deploy automático a cada push
```

## Estrutura

```
vittasys/
├── public/                  ← Frontend (servido como estático)
│   ├── index.html
│   ├── css/main.css
│   ├── assets/logos/
│   └── js/
│       ├── app.js
│       ├── utils/
│       └── components/
├── src/                     ← Backend
│   ├── server.js
│   ├── app.js              ← Express: API + static files
│   ├── config/database.js   ← Prisma singleton
│   ├── middlewares/
│   └── routes/              ← Todas as rotas da API
├── prisma/
│   ├── schema.prisma        ← 13 tabelas PostgreSQL
│   └── seed.js
├── package.json
├── Procfile                 ← Railway auto-deploy
└── .env
```

## Login

| Usuário | PIN | Perfil |
|---|---|---|
| Nágila Santos | 2305 | 👑 Master |
| Miécio Costa | 2305 | 👑 Master |
| Dra. Camila | 1234 | ⭐ Ativos |
| Téc. Bruno | 1234 | 📋 Espontâneos |

## Tech Stack

Express serve o frontend como arquivos estáticos e a API em `/api/*`.
Zero CORS. Um único serviço. Um único deploy.
