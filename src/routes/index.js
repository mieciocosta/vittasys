const { Router } = require('express');
const r = Router();

r.use('/vaccines', require('./vaccines'));
r.use('/batches', require('./batches'));
r.use('/patients', require('./patients'));
r.use('/stock', require('./stock'));

// Health check
r.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'VittaSys API' }));

module.exports = r;
