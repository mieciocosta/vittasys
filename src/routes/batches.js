const { Router } = require('express');
const ctrl = require('../controllers/batchController');
const r = Router();
r.get('/', ctrl.list);
r.get('/:id', ctrl.getById);
r.post('/', ctrl.create);
r.delete('/:id', ctrl.delete);
module.exports = r;
