const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const errorHandler = require('./middlewares/errorHandler');
const routes = require('./routes');

const app = express();

// Security & parsing
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// API routes
app.use('/api', routes);

// Root
app.get('/', (req, res) => res.json({
  name: 'VittaSys API',
  version: '1.0.0',
  description: 'Sistema de Gestão de Vacinação — Vittalis Saúde',
  endpoints: {
    vaccines: '/api/vaccines',
    batches: '/api/batches',
    stock: '/api/stock',
    stockHistory: '/api/stock/history',
    stockEntry: '/api/stock/entry',
    stockExit: '/api/stock/exit',
    patients: '/api/patients',
    health: '/api/health',
  }
}));

// 404
app.use((req, res) => res.status(404).json({ error: 'Endpoint não encontrado' }));

// Error handler
app.use(errorHandler);

module.exports = app;
