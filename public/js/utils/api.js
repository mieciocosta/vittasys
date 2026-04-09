const API='/api';
const Api={
  async get(p,params={}){const qs=new URLSearchParams(params).toString();try{const r=await fetch(`${API}${p}${qs?'?'+qs:''}`);if(!r.ok)throw new Error(`HTTP ${r.status}`);return await r.json()}catch(e){console.error('GET',p,e);return null}},
  async post(p,b={}){try{const r=await fetch(`${API}${p}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)});return await r.json()}catch(e){return{error:e.message}}},
  async postFile(p,formData){try{const r=await fetch(`${API}${p}`,{method:'POST',body:formData});return await r.json()}catch(e){return{error:e.message}}},
  async put(p,b={}){try{const r=await fetch(`${API}${p}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)});return await r.json()}catch(e){return{error:e.message}}},
  async delete(p){try{const r=await fetch(`${API}${p}`,{method:'DELETE'});return await r.json()}catch(e){return{error:e.message}}},
  async del(p){try{const r=await fetch(`${API}${p}`,{method:'DELETE'});return await r.json()}catch(e){return{error:e.message}}},

  dashboard(){return this.get('/dashboard')},
  usuarios(){return this.get('/auth/usuarios')},
  login(id,pin){return this.post('/auth/login',{usuario_id:id,pin})},

  vacinas(){return this.get('/vacinas')},
  vacinaById(id){return this.get(`/vacinas/${id}`)},
  criarVacina(b){return this.post('/vacinas',b)},
  buscarPorBarcode(code){return this.get(`/vacinas/barcode/${encodeURIComponent(code)}`)},

  lotes(p){return this.get('/lotes',p)},
  atualizarLote(id,b){return this.put(`/lotes/${id}`,b)},
  excluirLote(id){return this.delete(`/lotes/${id}`)},
  criarLote(b){return this.post('/lotes',b)},
  cadastroBarras(b){return this.post('/lotes/cadastro-barras',b)},

  buscarUnidades(q){return this.get('/unidades/busca',{q})},
  atualizarBarcode(unidadeId,codigo){return this.put(`/unidades/barcode/${unidadeId}`,{codigo_barras:codigo})},
  unidadesLote(loteId){return this.get(`/unidades/lote/${loteId}`)},
  retirada(b){return this.post('/unidades/retirada',b)},
  retirasRecentes(){return this.get('/unidades/recentes')},

  clientes(p){return this.get('/clientes',p)},
  buscarClientes(q){return this.get('/clientes/busca',{q})},
  cliente(id){return this.get(`/clientes/${id}`)},
  criarCliente(b){return this.post('/clientes',b)},
  atualizarCliente(id,b){return this.put(`/clientes/${id}`,b)},
  deletarCliente(id){return this.del(`/clientes/${id}`)},

  movimentacoes(p){return this.get('/movimentacoes',p)},
  criarMovimentacao(b){return this.post('/movimentacoes',b)},
  movimentacaoDetalhe(id){return this.get(`/unidades/movimentacao/${id}`)},
  movimentacoesPendentes(){return this.get('/movimentacoes/pendentes')},
  movimentacoesMotivos(){return this.get('/movimentacoes/motivos')},
  aprovarMovimentacao(id,b){return this.post(`/movimentacoes/${id}/aprovar`,b)},
  reprovarMovimentacao(id,b){return this.post(`/movimentacoes/${id}/reprovar`,b)},
  // Auditoria
  auditoriaLogs(p){return this.get('/auditoria',p)},
  auditoriaStats(){return this.get('/auditoria/stats')},
  auditoriaLog(b){return this.post('/auditoria/log',b)},
  async auditoriaLogComFoto(data,fotoBlob){
    const fd=new FormData();
    Object.entries(data).forEach(([k,v])=>{if(v!=null)fd.append(k,String(v))});
    if(fotoBlob)fd.append('foto',fotoBlob,'auditoria.jpg');
    try{const r=await fetch(`${API}/auditoria/log-com-foto`,{method:'POST',body:fd});return await r.json()}catch(e){console.error(e);return null}
  },

  planosTemplates(){return this.get('/planos/templates')},
  planos(p){return this.get('/planos',p)},
  plano(id){return this.get(`/planos/${id}`)},
  criarPlano(b){return this.post('/planos',b)},
  planosStats(){return this.get('/planos/stats/resumo')},

  finResumo(){return this.get('/financeiro/resumo')},
  pagamentos(p){return this.get('/financeiro/pagamentos',p)},
  criarPagamento(b){return this.post('/financeiro/pagamentos',b)},

  metas(p){return this.get('/metas',p)},
  criarMeta(b){return this.post('/metas',b)},

  importarNFe(fd){return this.postFile('/nfe/importar',fd)},
  extrairClienteIA(fd){return this.postFile('/ia/extrair-cliente',fd)},
  extrairClienteIATexto(texto){return this.post('/ia/extrair-cliente',{texto_direto:texto})},
};
