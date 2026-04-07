// ═══ ROUTE MAP ═══
const ROUTE_MAP={
  '/painel':'dashboard','/retirada':'retirada','/estoque':'estoque',
  '/movimentacoes':'historico','/planos':'planos','/clientes':'clientes',
  '/financeiro':'financeiro','/metas':'metas','/alertas':'alertas',
  '/aprovacoes':'aprovacoes',
  '/auditoria':'auditoria',
};
const ROUTE_REVERSE={};Object.entries(ROUTE_MAP).forEach(([k,v])=>ROUTE_REVERSE[v]=k);

const AppState={
  usuario:null,modulo:'dashboard',clienteDetalhe:null,planoDetalhe:null,movDetalheId:null,
  _l:[],subscribe(fn){this._l.push(fn)},notify(){this._l.forEach(fn=>fn())},

  // ═══ SESSION PERSISTENCE ═══
  login(u){
    this.usuario=u;
    try{sessionStorage.setItem('vittasys_session',JSON.stringify(u))}catch(e){}
    this.notify();
  },
  logout(){
    if(this.usuario){try{Api.auditoriaLog({acao:'logout',usuarioId:this.usuario.id,usuarioNome:this.usuario.nome,perfil:this.usuario.perfil})}catch(e){}}
    this.usuario=null;this.modulo='dashboard';
    try{sessionStorage.removeItem('vittasys_session')}catch(e){}
    history.pushState(null,'','/');
    this.notify();
  },
  restoreSession(){
    try{
      const s=sessionStorage.getItem('vittasys_session');
      if(s){this.usuario=JSON.parse(s);return true}
    }catch(e){}
    return false;
  },

  // ═══ NAVIGATION WITH URL ═══
  setModulo(m,pushState=true){
    this.modulo=m;
    if(pushState){
      const url=ROUTE_REVERSE[m]||'/'+m;
      try{history.pushState({modulo:m},'',url)}catch(e){}
    }
    // Audit: log screen navigation
    if(this.usuario){try{Api.auditoriaLog({acao:'navegacao',rota:'/'+m,usuarioId:this.usuario.id,usuarioNome:this.usuario.nome,perfil:this.usuario.perfil})}catch(e){}}
    this.notify();
  },
  verCliente(id){this.clienteDetalhe=id;this.modulo='cliente-detalhe';
    try{history.pushState(null,'',`/clientes/${id}`)}catch(e){}
    this.notify()},
  verPlano(id){this.planoDetalhe=id;this.modulo='plano-detalhe';
    try{history.pushState(null,'',`/planos/${id}`)}catch(e){}
    this.notify()},
  verMovimentacao(id){this.movDetalheId=id;this.modulo='historico';
    try{history.pushState(null,'',`/movimentacoes/${id}`)}catch(e){}
    this.notify()},

  // ═══ ROUTE PARSING ═══
  parseRoute(){
    const p=window.location.pathname;
    // /clientes/123
    const clienteMatch=p.match(/^\/clientes\/(\d+)$/);
    if(clienteMatch){this.clienteDetalhe=+clienteMatch[1];return'cliente-detalhe'}
    // /planos/123
    const planoMatch=p.match(/^\/planos\/(\d+)$/);
    if(planoMatch){this.planoDetalhe=+planoMatch[1];return'plano-detalhe'}
    // /movimentacoes/123
    const movMatch=p.match(/^\/movimentacoes\/(\d+)$/);
    if(movMatch){this.movDetalheId=+movMatch[1];return'historico'}
    // Standard routes
    return ROUTE_MAP[p]||'dashboard';
  },

  temPermissao(modulo){
    if(!this.usuario)return false;
    if(this.usuario.perfil==='master')return true;
    return(this.usuario.modulos_permitidos||[]).includes(modulo);
  },
  filtroClientePerfil(){
    if(!this.usuario)return'';
    if(this.usuario.perfil==='ativos')return'ativo';
    if(this.usuario.perfil==='espontaneos')return'espontaneo';
    return'';
  },
  isMaster(){return this.usuario?.perfil==='master'},
};

// ═══ BROWSER BACK/FORWARD ═══
window.addEventListener('popstate',()=>{
  const m=AppState.parseRoute();
  AppState.modulo=m;
  AppState.notify();
});
