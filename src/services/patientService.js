const repo = require('../repositories/patientRepository');
const { required, validateCPF } = require('../middlewares/validate');

module.exports = {
  list: () => repo.findAll(),
  getById: (id) => repo.findById(id),
  create: async (data) => {
    required(data, ['name', 'cpf']);
    const cpf = validateCPF(data.cpf);
    const exists = await repo.findByCpf(cpf);
    if (exists) throw Object.assign(new Error('CPF já cadastrado'), { status: 409 });
    return repo.create({
      name: data.name, cpf,
      birthDate: data.birthDate ? new Date(data.birthDate) : null,
      phone: data.phone || null, email: data.email || null,
    });
  },
};
