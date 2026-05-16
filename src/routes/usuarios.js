const{Router}=require('express');const r=Router();const prisma=require('../config/database');

const SAFE_SELECT={id:true,nome:true,cargo:true,email:true,cpf:true,dataNascimento:true,perfil:true,ativo:true,criadoEm:true};

// LIST all users (for login screen - minimal)
r.get('/',async(req,res,next)=>{try{
  const users=await prisma.usuario.findMany({where:{ativo:true},select:{id:true,nome:true,cargo:true,perfil:true,ativo:true},orderBy:{nome:'asc'}});
  res.json(users);
}catch(e){next(e)}});

// LIST all users (admin - full details)
r.get('/admin',async(req,res,next)=>{try{
  const users=await prisma.usuario.findMany({select:SAFE_SELECT,orderBy:[{ativo:'desc'},{nome:'asc'}]});
  res.json(users);
}catch(e){next(e)}});

// GET single user
r.get('/:id',async(req,res,next)=>{try{
  const u=await prisma.usuario.findUnique({where:{id:+req.params.id},select:SAFE_SELECT});
  if(!u)return res.status(404).json({error:'Usuário não encontrado'});
  res.json(u);
}catch(e){next(e)}});

// CREATE user (master only) — default PIN 1234
r.post('/',async(req,res,next)=>{try{
  const{nome,cargo,email,cpf,data_nascimento,perfil}=req.body;
  if(!nome||!cargo)return res.status(400).json({error:'Nome e cargo são obrigatórios'});
  if(!['master','ativos','espontaneos','atendimento','operador'].includes(perfil))
    return res.status(400).json({error:'Perfil inválido'});
  // Check email uniqueness
  if(email){const ex=await prisma.usuario.findUnique({where:{email}});if(ex)return res.status(400).json({error:'Email já cadastrado'})}
  const u=await prisma.usuario.create({data:{
    nome,cargo,email:email||null,cpf:cpf||null,
    dataNascimento:data_nascimento?new Date(data_nascimento):null,
    pin:'1234',perfil,ativo:true
  },select:SAFE_SELECT});
  res.json({success:true,usuario:u,message:'Usuário criado com senha padrão 1234'});
}catch(e){next(e)}});

// UPDATE user (master: all fields; self: only pin)
r.put('/:id',async(req,res,next)=>{try{
  const id=+req.params.id;const b=req.body;
  const u=await prisma.usuario.findUnique({where:{id}});
  if(!u)return res.status(404).json({error:'Não encontrado'});
  
  const isMaster=b._caller_perfil==='master';
  const isSelf=b._caller_id===id;
  
  const data={};
  
  if(isMaster){
    // Master can change everything
    if(b.nome)data.nome=b.nome;
    if(b.cargo)data.cargo=b.cargo;
    if(b.email!==undefined)data.email=b.email||null;
    if(b.cpf!==undefined)data.cpf=b.cpf||null;
    if(b.data_nascimento!==undefined)data.dataNascimento=b.data_nascimento?new Date(b.data_nascimento):null;
    if(b.perfil&&['master','ativos','espontaneos','atendimento','operador'].includes(b.perfil))data.perfil=b.perfil;
    if(b.ativo!==undefined)data.ativo=b.ativo;
  }else if(isSelf){
    // Self can ONLY change pin
    // nome, cpf, dataNascimento are BLOCKED for non-master
    if(b.nome||b.cpf||b.data_nascimento){
      return res.status(403).json({error:'Somente o master pode alterar nome, CPF e data de nascimento'});
    }
  }else{
    return res.status(403).json({error:'Sem permissão'});
  }
  
  // PIN change (self or master)
  if(b.pin_novo){
    if(isSelf&&!isMaster){
      // Self must provide current pin
      if(!b.pin_atual||b.pin_atual!==u.pin)return res.status(400).json({error:'PIN atual incorreto'});
    }
    if(!/^\d{4}$/.test(b.pin_novo))return res.status(400).json({error:'PIN deve ter 4 dígitos'});
    data.pin=b.pin_novo;
  }
  
  if(!Object.keys(data).length)return res.status(400).json({error:'Nenhum campo alterado'});
  
  await prisma.usuario.update({where:{id},data});
  res.json({success:true,message:'Usuário atualizado'});
}catch(e){next(e)}});

// RESET PIN (master only) → back to 1234
r.get('/:id/pin',async(req,res,next)=>{try{
  if(req.user?.perfil!=='master')
    return res.status(403).json({error:'Apenas master'});
  const u=await prisma.usuario.findUnique({where:{id:+req.params.id},select:{id:true,nome:true,pin:true}});
  if(!u)return res.status(404).json({error:'Não encontrado'});
  res.json({id:u.id,nome:u.nome,pin:u.pin});
}catch(e){next(e)}});

r.post('/:id/reset-pin',async(req,res,next)=>{try{
  await prisma.usuario.update({where:{id:+req.params.id},data:{pin:'1234'}});
  res.json({success:true,message:'Senha resetada para 1234'});
}catch(e){next(e)}});

// SOFT DELETE (master only) — sets ativo=false, keeps data for audits
r.delete('/:id',async(req,res,next)=>{try{
  const id=+req.params.id;
  const u=await prisma.usuario.findUnique({where:{id}});
  if(!u)return res.status(404).json({error:'Não encontrado'});
  if(u.perfil==='master'){
    const masters=await prisma.usuario.count({where:{perfil:'master',ativo:true}});
    if(masters<=2)return res.status(400).json({error:'Não é possível desativar. Mínimo 2 masters (Nágila e Miécio)'});
  }
  await prisma.usuario.update({where:{id},data:{ativo:false}});
  res.json({success:true,message:'Usuário desativado (auditorias preservadas)'});
}catch(e){next(e)}});

// REACTIVATE
r.post('/:id/reativar',async(req,res,next)=>{try{
  await prisma.usuario.update({where:{id:+req.params.id},data:{ativo:true}});
  res.json({success:true,message:'Usuário reativado'});
}catch(e){next(e)}});

module.exports=r;
