const{Router}=require('express');const r=Router();const prisma=require('../config/database');
const multer=require('multer');const path=require('path');const fs=require('fs');const xml2js=require('xml2js');
const upload=multer({dest:path.join(__dirname,'..','..','uploads'),limits:{fileSize:10*1024*1024}});

r.post('/importar',upload.single('xml'),async(req,res,next)=>{
  if(!req.file)return res.status(400).json({error:'Arquivo XML obrigatório'});
  try{
    const xmlContent=fs.readFileSync(req.file.path,'utf-8');
    const parser=new xml2js.Parser({explicitArray:false,ignoreAttrs:false,tagNameProcessors:[xml2js.processors.stripPrefix]});
    const result=await parser.parseStringPromise(xmlContent);
    const nfe=result.nfeProc?.NFe?.infNFe||result.NFe?.infNFe||result.infNFe;
    if(!nfe)return res.status(400).json({error:'XML inválido — não é NF-e'});
    const ide=nfe.ide||{};const emit=nfe.emit||{};const total=nfe.total?.ICMSTot||{};
    let dets=nfe.det;if(!Array.isArray(dets))dets=dets?[dets]:[];

    const itensImportados=[];const itensSemBarcode=[];

    for(const det of dets){
      const prod=det.prod||{};const nomeProd=prod.xProd||'Sem nome';
      const qtd=parseInt(parseFloat(prod.qCom||prod.qTrib||1));
      const valorUnit=parseFloat(prod.vUnCom||prod.vUnTrib||0);
      const valorTotal=parseFloat(prod.vProd||0);
      const ean=prod.cEAN&&prod.cEAN!=='SEM GTIN'?prod.cEAN:null;

      // Find or create vaccine
      let vacina=await prisma.vacina.findFirst({where:{nome:{contains:nomeProd.split(' ').slice(1,3).join(' '),mode:'insensitive'}}});
      if(!vacina){const codigo='NF-'+(prod.cProd||String(Date.now()).slice(-6));
        vacina=await prisma.vacina.create({data:{codigo,nome:nomeProd,fabricante:emit.xNome||'Importado',categoria:'Importada NF',valorCustoMedio:valorUnit}})}

      // Create lot
      const numLote=`NF${ide.nNF||'0'}-${prod.cProd||det.$.nItem}`;
      const validade=new Date();validade.setFullYear(validade.getFullYear()+1);
      let lote;try{lote=await prisma.lote.create({data:{vacinaId:vacina.id,numeroLote:numLote,fabricante:emit.xNome||'',quantidadeTotal:qtd,quantidadeDisponivel:qtd,validade,valorUnitarioCusto:valorUnit,dataEntrada:ide.dhEmi?new Date(ide.dhEmi):new Date()}})}
      catch(e){lote=await prisma.lote.findFirst({where:{numeroLote:numLote}})}

      if(!lote)continue;

      // Create units with barcodes
      const unCriadas=[];
      for(let i=0;i<qtd;i++){
        let cb;
        if(ean&&qtd===1)cb=ean;
        else if(ean)cb=`${ean}-${String(i+1).padStart(3,'0')}`;
        else cb=`NF${ide.nNF}-${prod.cProd}-${String(i+1).padStart(4,'0')}`;
        try{await prisma.unidade.create({data:{loteId:lote.id,codigoBarras:cb}});unCriadas.push(cb)}
        catch(e){const fb=cb+'-'+Date.now().toString(36);await prisma.unidade.create({data:{loteId:lote.id,codigoBarras:fb}});unCriadas.push(fb)}
      }

      // Movement
      await prisma.movimentacao.create({data:{tipo:'entrada',loteId:lote.id,vacinaId:vacina.id,usuarioId:+(req.body.usuario_id||1),quantidade:qtd,codigoBarras:ean||null,numeroLote:numLote,nomeVacina:nomeProd,status:'concluido',observacoes:`NF-e ${ide.nNF}`}});

      const item={item:det.$.nItem,nome:nomeProd,quantidade:qtd,valor_unitario:valorUnit,valor_total:valorTotal,lote:numLote,lote_id:lote.id,vacina_id:vacina.id,unidades:unCriadas.length,ean};
      itensImportados.push(item);
      if(!ean)itensSemBarcode.push(item);
    }

    res.json({success:true,numero_nota:ide.nNF,fornecedor:emit.xNome||emit.xFant,data_emissao:ide.dhEmi,valor_total:parseFloat(total.vNF||0),itens_importados:itensImportados,itens_sem_barcode:itensSemBarcode,total_itens:itensImportados.length,total_unidades:itensImportados.reduce((s,i)=>s+i.unidades,0),message:`NF ${ide.nNF} importada: ${itensImportados.length} vacinas, ${itensImportados.reduce((s,i)=>s+i.unidades,0)} unidades${itensSemBarcode.length>0?' (⚠ '+itensSemBarcode.length+' sem código de barras)':''}`});
  }catch(err){console.error('NF-e:',err);res.status(500).json({error:err.message})}
});

r.get('/',async(req,res,next)=>{try{
  // List imported NFs from movements
  const nfs=await prisma.movimentacao.findMany({where:{tipo:'entrada',observacoes:{startsWith:'NF-e'}},orderBy:{dataHora:'desc'},take:20,select:{id:true,nomeVacina:true,quantidade:true,numeroLote:true,observacoes:true,dataHora:true}});
  res.json(nfs);
}catch(e){next(e)}});

module.exports=r;
