const { Router } = require('express');
const ctrl = require('../controllers/patientController');
const r = Router();
r.get('/', ctrl.list);
r.get('/:id', ctrl.getById);
r.post('/', ctrl.create);
module.exports = r;
