const{Router}=require('express');const r=Router();const prisma=require('../config/database');
const VALID=['codigoCliente','nome','dataNascimento','sexo','cpf','telefone','email','tipoPaciente','tipoCliente','responsavelNome','responsavelParentesco','responsavelCpf','responsavelTelefone','vendedorId','vacinadorId','status','observacoes','observacoesClinicas'];
const fieldMap={codigo_cliente:'codigoCliente',data_nascimento:'dataNascimento',tipo_paciente:'tipoPaciente',tipo_cliente:'tipoCliente',responsavel_nome:'responsavelNome',responsavel_parentesco:'responsavelParentesco',responsavel_cpf:'responsavelCpf',responsavel_telefone:'responsavelTelefone',vendedor_id:'vendedorId',vacinador_id:'vacinadorId',observacoes_clinicas:'observacoesClinicas'};

function mapIn(b){const d={};Object.entries(b).forEach(([k,v])=>{const pk=fieldMap[k]||k;if(VALID.includes(pk)){if(['vendedorId','vacinadorId'].includes(pk)&&v)d[pk]=+v;else if(pk==='dataNascimento'&&v)d[pk]=new Date(v);else d[pk]=v}});return d}
function mapOut(c){return{...c,codigo_cliente:c.codigoCliente,data_nascimento:c.dataNascimento,tipo_paciente:c.tipoPaciente,tipo_cliente:c.tipoCliente,responsavel_nome:c.responsavelNome,responsavel_parentesco:c.responsavelParentesco,responsavel_cpf:c.responsavelCpf,responsavel_telefone:c.responsavelTelefone,vendedor_id:c.vendedorId,vacinador_id:c.vacinadorId,observacoes_clinicas:c.observacoesClinicas,criado_em:c.criadoEm,atualizado_em:c.atualizadoEm}}

// CPF validation
function validarCPF(raw){
  const c=raw.replace(/\D/g,'');
  if(c.length!==11||/^(\d)\1+$/.test(c))return null;
  let s=0;for(let i=0;i<9;i++)s+=(10-i)*+c[i];let d=(s*10)%11;if(d===10)d=0;if(d!==+c[9])return null;
  s=0;for(let i=0;i<10;i++)s+=(11-i)*+c[i];d=(s*10)%11;if(d===10)d=0;if(d!==+c[10])return null;
  return c; // returns clean digits
}

r.get('/',async(req,res,next)=>{try{
  const{page=1,limit=50,tipo_cliente,tipo_paciente,status,search,sort,order}=req.query;
  const where={};
  if(tipo_cliente)where.tipoCliente=tipo_cliente;
  if(tipo_paciente)where.tipoPaciente=tipo_paciente;
  if(status)where.status=status;
  if(search){const s=search.replace(/[\.\-]/g,'');where.OR=[{nome:{contains:search,mode:'insensitive'}},{cpf:{contains:s,mode:'insensitive'}},{codigoCliente:{contains:search,mode:'insensitive'}},{responsavelNome:{contains:search,mode:'insensitive'}},{telefone:{contains:search,mode:'insensitive'}}]}
  const sm={id:'id',nome:'nome',codigo:'codigoCliente',tipo:'tipoCliente',nascimento:'dataNascimento',status:'status'};
  const ob=sort&&sm[sort]?{[sm[sort]]:order==='DESC'?'desc':'asc'}:[{tipoCliente:'desc'},{nome:'asc'}];
  const[data,total]=await Promise.all([prisma.cliente.findMany({where,orderBy:ob,skip:(+page-1)*+limit,take:+limit,include:{_count:{select:{planosContratados:true,movimentacoes:true}}}}),prisma.cliente.count({where})]);
  const mapped=data.map(c=>{const o=mapOut(c);o.planos_ativos=c._count.planosContratados;o.total_movimentacoes=c._count.movimentacoes;o.vendedor_nome='';o.pacientes=[];return o});
  res.json({data:mapped,pagination:{page:+page,limit:+limit,total,pages:Math.ceil(total/+limit)}});
}catch(e){next(e)}});

r.get('/busca',async(req,res,next)=>{try{
  const{q}=req.query;if(!q||q.length<2)return res.json([]);
  const s=q.replace(/[\.\-]/g,'');
  const data=await prisma.cliente.findMany({where:{OR:[{nome:{contains:q,mode:'insensitive'}},{cpf:{contains:s,mode:'insensitive'}},{codigoCliente:{contains:q,mode:'insensitive'}},{responsavelNome:{contains:q,mode:'insensitive'}},{telefone:{contains:q,mode:'insensitive'}}]},orderBy:[{tipoCliente:'desc'},{nome:'asc'}],take:15});
  res.json(data.map(mapOut));
}catch(e){next(e)}});

r.get('/:id',async(req,res,next)=>{try{
  const c=await prisma.cliente.findUnique({where:{id:+req.params.id},include:{planosContratados:{include:{doses:{include:{vacina:true}},pagamentos:true}},movimentacoes:{orderBy:{dataHora:'desc'},take:30}}});
  if(!c)return res.status(404).json({error:'Não encontrado'});
  const o=mapOut(c);
  o.planos=c.planosContratados.map(p=>({...p,nome_plano:p.nomePlano,valor_final:p.valorFinal,status_contrato:p.statusContrato,total_pago:p.pagamentos.reduce((s,pg)=>s+pg.valorPago,0),saldo_pendente:p.valorFinal-p.pagamentos.reduce((s,pg)=>s+pg.valorPago,0),doses_aplicadas:p.doses.filter(d=>d.status==='aplicada').length,doses_total:p.doses.length,doses:p.doses.map(d=>({...d,vacina_nome:d.vacina.nome,dose_numero:d.doseNumero,data_aplicacao:d.dataAplicacao,local_aplicacao:d.localAplicacao}))}));
  o.movimentacoes=c.movimentacoes.map(m=>({...m,data_hora:m.dataHora,nome_vacina:m.nomeVacina,numero_lote:m.numeroLote,local_aplicacao:m.localAplicacao}));
  o.planos_ativos=o.planos.filter(p=>p.status_contrato==='ativo').length;
  o.total_movimentacoes=o.movimentacoes.length;o.pacientes=[];o.pagamentos=[];
  res.json(o);
}catch(e){next(e)}});

// ═══ CREATE with full validation ═══
r.post('/',async(req,res,next)=>{try{
  const b=req.body;
  // REQUIRED fields
  if(!b.nome||b.nome.trim().length<3)return res.status(400).json({error:'Nome é obrigatório (mínimo 3 caracteres)',campo:'nome'});
  if(!b.cpf)return res.status(400).json({error:'CPF é obrigatório',campo:'cpf'});
  if(!b.data_nascimento&&!b.dataNascimento)return res.status(400).json({error:'Data de nascimento é obrigatória',campo:'data_nascimento'});
  if(!b.telefone)return res.status(400).json({error:'Telefone é obrigatório',campo:'telefone'});

  // CPF validation
  const cpfClean=validarCPF(b.cpf);
  if(!cpfClean)return res.status(400).json({error:'CPF inválido. Verifique os dígitos.',campo:'cpf'});

  // CPF unique check
  const existente=await prisma.cliente.findFirst({where:{cpf:{contains:cpfClean}},select:{id:true,nome:true,codigoCliente:true,status:true}});
  if(existente)return res.status(409).json({error:`CPF já cadastrado: ${existente.nome} [${existente.codigoCliente||'#'+existente.id}]`,campo:'cpf',cliente_existente:existente});

  const d=mapIn(b);
  d.cpf=cpfClean;
  if(!d.codigoCliente&&d.tipoCliente==='ativo'){const last=await prisma.cliente.findFirst({where:{codigoCliente:{startsWith:'VIT-'}},orderBy:{id:'desc'}});const n=last?parseInt(last.codigoCliente.replace('VIT-',''))+1:1;d.codigoCliente=`VIT-${String(n).padStart(3,'0')}`}
  if(!d.codigoCliente&&d.tipoCliente==='espontaneo'){const last=await prisma.cliente.findFirst({where:{codigoCliente:{startsWith:'ESP-'}},orderBy:{id:'desc'}});const n=last?parseInt(last.codigoCliente.replace('ESP-',''))+1:1;d.codigoCliente=`ESP-${String(n).padStart(3,'0')}`}
  const c=await prisma.cliente.create({data:d});
  res.json({success:true,id:c.id,codigo_cliente:c.codigoCliente});
}catch(e){if(e.code==='P2002')return res.status(409).json({error:'CPF já cadastrado',campo:'cpf'});next(e)}});

r.put('/:id',async(req,res,next)=>{try{
  const d=mapIn(req.body);
  // If CPF changed, validate + check unique
  if(d.cpf){
    const cpfClean=validarCPF(d.cpf);
    if(!cpfClean)return res.status(400).json({error:'CPF inválido',campo:'cpf'});
    const existente=await prisma.cliente.findFirst({where:{cpf:{contains:cpfClean},id:{not:+req.params.id}}});
    if(existente)return res.status(409).json({error:`CPF já pertence a: ${existente.nome}`,campo:'cpf'});
    d.cpf=cpfClean;
  }
  if(!Object.keys(d).length)return res.json({success:true});
  await prisma.cliente.update({where:{id:+req.params.id},data:d});res.json({success:true});
}catch(e){next(e)}});

r.delete('/:id',async(req,res,next)=>{try{
  const[movs,plans]=await Promise.all([prisma.movimentacao.count({where:{clienteId:+req.params.id}}),prisma.planoContratado.count({where:{clienteId:+req.params.id,statusContrato:'ativo'}})]);
  if(movs>0||plans>0)return res.status(400).json({error:`Não é possível: ${movs} movimentações, ${plans} planos ativos`});
  await prisma.cliente.update({where:{id:+req.params.id},data:{status:'inativo'}});res.json({success:true});
}catch(e){next(e)}});
module.exports=r;
