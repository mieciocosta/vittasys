const AppState={
  usuario:null,modulo:'dashboard',clienteDetalhe:null,planoDetalhe:null,
  _l:[],subscribe(fn){this._l.push(fn)},notify(){this._l.forEach(fn=>fn())},
  login(u){this.usuario=u;this.notify()},
  logout(){this.usuario=null;this.modulo='dashboard';this.notify()},
  setModulo(m){this.modulo=m;this.notify()},
  verCliente(id){this.clienteDetalhe=id;this.modulo='cliente-detalhe';this.notify()},
  verPlano(id){this.planoDetalhe=id;this.modulo='plano-detalhe';this.notify()},
  // Permission check
  temPermissao(modulo){
    if(!this.usuario)return false;
    if(this.usuario.perfil==='master')return true;
    return(this.usuario.modulos_permitidos||[]).includes(modulo);
  },
  // Tipo cliente filter based on perfil
  filtroClientePerfil(){
    if(!this.usuario)return'';
    if(this.usuario.perfil==='ativos')return'ativo';
    if(this.usuario.perfil==='espontaneos')return'espontaneo';
    return''; // master/operador see all
  },
  isMaster(){return this.usuario?.perfil==='master'},
};
