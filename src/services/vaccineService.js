const repo = require('../repositories/vaccineRepository');
const { required } = require('../middlewares/validate');

module.exports = {
  list: () => repo.findAll(),
  getById: (id) => repo.findById(id),
  create: async (data) => {
    required(data, ['name', 'manufacturer']);
    return repo.create({ name: data.name, manufacturer: data.manufacturer, dosesTotal: parseInt(data.dosesTotal) || 1, description: data.description || null });
  },
};
