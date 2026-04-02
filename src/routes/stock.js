const { Router } = require('express');
const ctrl = require('../controllers/stockController');
const r = Router();
r.get('/', ctrl.getStock);
r.get('/history', ctrl.getHistory);
r.post('/entry', ctrl.entry);
r.post('/exit', ctrl.exit);
module.exports = r;
