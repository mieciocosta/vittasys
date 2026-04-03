const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// Security
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(cors());
app.use(express.json());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ═══ API ROUTES ═══
app.use('/api/auth', require('./routes/auth'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/vacinas', require('./routes/vacinas'));
app.use('/api/lotes', require('./routes/lotes'));
app.use('/api/unidades', require('./routes/unidades'));
app.use('/api/clientes', require('./routes/clientes'));
app.use('/api/planos', require('./routes/planos'));
app.use('/api/financeiro', require('./routes/financeiro'));
app.use('/api/movimentacoes', require('./routes/movimentacoes'));
app.use('/api/metas', require('./routes/metas'));
app.use('/api/nfe', require('./routes/nfe'));
app.use('/api/ia', require('./routes/ia'));
// Compat
app.use('/api/pacotes', require('./routes/planos'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ═══ FRONTEND (static files) ═══
app.use(express.static(path.join(__dirname, '..', 'public')));

// SPA catch-all: any non-API route serves index.html
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Endpoint não encontrado' });
  }
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Error handler
app.use(errorHandler);

module.exports = app;
