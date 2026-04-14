// ═══ ROUTE MAP ═══
const ROUTE_MAP={
  '/painel':'dashboard','/retirada':'retirada','/estoque':'estoque',
  '/movimentacoes':'historico','/planos':'planos','/clientes':'clientes',
  '/financeiro':'financeiro','/metas':'metas','/alertas':'alertas',
  '/aprovacoes':'aprovacoes','/agenda':'agenda',
  '/auditoria':'auditoria','/usuarios':'usuarios',
};
const ROUTE_REVERSE={};Object.entries(ROUTE_MAP).forEach(([k,v])=>ROUTE_REVERSE[v]=k);

// ═══ SESSION TIMEOUT ═══
const SESSION_TIMEOUT_MS=15*60*1000; // 15 minutes
let _sessionTimer=null;
let _lastActivity=Date.now();

function _resetSessionTimer(){
  _lastActivity=Date.now();
  // Save timestamp
  try{sessionStorage.setItem('vittasys_last_activity',String(_lastActivity))}catch(e){}
}

function _checkSessionTimeout(){
  if(!AppState.usuario)return;
  const now=Date.now();
  const elapsed=now-_lastActivity;
  if(elapsed>=SESSION_TIMEOUT_MS){
    // Session expired
    clearInterval(_sessionTimer);
    AppState.logout();
    Toast?.show('Sessão expirada. Faça login novamente.','warning');
  }
}

function _startSessionMonitor(){
  // Reset on any user activity
  ['click','keydown','mousemove','touchstart','scroll'].forEach(evt=>{
    document.addEventListener(evt,_resetSessionTimer,{passive:true,once:false});
  });
  // Check every 30 seconds
  _sessionTimer=setInterval(_checkSessionTimeout,30000);
  _resetSessionTimer();
}

function _stopSessionMonitor(){
  if(_sessionTimer){clearInterval(_sessionTimer);_sessionTimer=null}
}

const AppState={
  usuario:null,modulo:'dashboard',clienteDetalhe:null,planoDetalhe:null,movDetalheId:null,
  _l:[],subscribe(fn){this._l.push(fn)},notify(){this._l.forEach(fn=>fn())},

  // ═══ SESSION PERSISTENCE ═══
  login(u){
    this.usuario=u;
    try{
      sessionStorage.setItem('vittasys_session',JSON.stringify(u));
      sessionStorage.setItem('vittasys_login_time',String(Date.now()));
    }catch(e){}
    _startSessionMonitor();
    this.notify();
  },
  logout(){
    _stopSessionMonitor();
    if(this.usuario){try{Api.auditoriaLog({acao:'logout',usuarioId:this.usuario.id,usuarioNome:this.usuario.nome,perfil:this.usuario.perfil})}catch(e){}}
    this.usuario=null;this.modulo='dashboard';
    try{sessionStorage.removeItem('vittasys_session');sessionStorage.removeItem('vittasys_last_activity');sessionStorage.removeItem('vittasys_login_time')}catch(e){}
    history.pushState(null,'','/');
    this.notify();
  },
  restoreSession(){
    try{
      const s=sessionStorage.getItem('vittasys_session');
      if(s){
        // Check if session has expired
        const lastAct=+(sessionStorage.getItem('vittasys_last_activity')||0);
        if(lastAct&&(Date.now()-lastAct)>=SESSION_TIMEOUT_MS){
          sessionStorage.removeItem('vittasys_session');
          sessionStorage.removeItem('vittasys_last_activity');
          return false;
        }
        this.usuario=JSON.parse(s);
        _lastActivity=lastAct||Date.now();
        _startSessionMonitor();
        return true;
      }
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
    // Audit: log navigation with geo attempt
    if(this.usuario){
      const logData={acao:'navegacao',rota:'/'+m,usuarioId:this.usuario.id,
        usuarioNome:this.usuario.nome,perfil:this.usuario.perfil};
      // Try to get geolocation (non-blocking)
      if(navigator.geolocation){
        navigator.geolocation.getCurrentPosition(
          pos=>{logData.detalhes=JSON.stringify({latitude:pos.coords.latitude,longitude:pos.coords.longitude,accuracy:Math.round(pos.coords.accuracy)});Api.auditoriaLog(logData)},
          err=>{logData.detalhes=JSON.stringify({geo_status:'negado',geo_erro:err.message});Api.auditoriaLog(logData)},
          {timeout:3000,maximumAge:60000}
        );
      }else{logData.detalhes=JSON.stringify({geo_status:'indisponivel'});Api.auditoriaLog(logData)}
    }
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
