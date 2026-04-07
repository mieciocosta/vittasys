(function(){
  const root=document.getElementById('app');

  // ═══ RESTORE SESSION ON LOAD ═══
  AppState.restoreSession();
  if(AppState.usuario){
    AppState.modulo=AppState.parseRoute();
  }

  AppState.subscribe(renderApp);
  renderApp();

  async function renderApp(){
    root.innerHTML='';
    if(!AppState.usuario){root.appendChild(await renderLogin());return}

    // Permission check
    const baseModulo=AppState.modulo.replace(/-detalhe$/,'');
    if(!AppState.temPermissao(AppState.modulo)&&!['cliente-detalhe','plano-detalhe','dashboard'].includes(AppState.modulo)){
      AppState.modulo='dashboard';
    }

    const layout=h('div',{className:'app-layout'});
    const alertData=await Api.lotes({vencimento:'proximo',limit:1});
    const alertCount=alertData?.pagination?.total||0;
    layout.appendChild(renderSidebar(alertCount));

    const main=h('main',{className:'main-content'});
    const map={
      dashboard:renderDashboard,retirada:renderRetirada,estoque:renderEstoque,
      historico:renderHistorico,planos:renderPlanos,clientes:renderClientes,
      financeiro:renderFinanceiro,metas:renderMetas,alertas:renderAlertas,
      aprovacoes:renderAprovacoes,
      'cliente-detalhe':renderClienteDetalhe,'plano-detalhe':renderPlanoDetalhe
    };

    try{
      const content=await(map[AppState.modulo]||renderDashboard)();
      main.appendChild(content);
    }catch(e){
      console.error(e);
      main.appendChild(h('div',{className:'empty-state'},`Erro: ${e.message}`));
    }

    layout.appendChild(main);root.appendChild(layout);
  }
})();
