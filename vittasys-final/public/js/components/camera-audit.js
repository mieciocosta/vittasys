/**
 * Camera Capture for Critical Audit Actions
 * 
 * Usage: const fotoBlob = await captureAuditPhoto('Descarte de vacina');
 * Returns: Blob (JPEG) or null if cancelled/denied
 * 
 * On company machines: IT can pre-authorize camera via Chrome policy:
 *   chrome://settings/content/camera → Allow for vittasys.vittalissaude.com.br
 *   Or via GPO: VideoCaptureAllowedUrls = ["https://vittasys.vittalissaude.com.br"]
 */

function captureAuditPhoto(actionLabel){
  return new Promise((resolve)=>{
    // Create modal overlay
    const overlay=document.createElement('div');
    overlay.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:99999;display:flex;align-items:center;justify-content:center';

    const modal=document.createElement('div');
    modal.style.cssText='background:white;border-radius:16px;padding:24px;max-width:480px;width:90%;text-align:center;position:relative';

    // Header
    const hdr=document.createElement('div');
    hdr.style.cssText='margin-bottom:16px';
    hdr.innerHTML=`
      <div style="font-size:14px;font-weight:700;color:#dc2626;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">⚠ AÇÃO CRÍTICA</div>
      <div style="font-size:18px;font-weight:800;color:#1B4965">${actionLabel}</div>
      <div style="font-size:12px;color:#64748b;margin-top:8px">Registro fotográfico do operador para auditoria</div>`;
    modal.appendChild(hdr);

    // Video preview
    const videoWrap=document.createElement('div');
    videoWrap.style.cssText='position:relative;border-radius:12px;overflow:hidden;background:#000;margin-bottom:16px';
    const video=document.createElement('video');
    video.style.cssText='width:100%;height:260px;object-fit:cover;transform:scaleX(-1)';
    video.autoplay=true;video.playsInline=true;video.muted=true;
    videoWrap.appendChild(video);

    // Countdown overlay
    const countdownEl=document.createElement('div');
    countdownEl.style.cssText='position:absolute;inset:0;display:none;align-items:center;justify-content:center;font-size:72px;font-weight:900;color:white;text-shadow:0 0 20px rgba(0,0,0,.5);background:rgba(0,0,0,.3)';
    videoWrap.appendChild(countdownEl);

    // Camera status
    const statusEl=document.createElement('div');
    statusEl.style.cssText='font-size:12px;color:#94a3b8;margin-bottom:12px';
    statusEl.textContent='Iniciando câmera...';

    // Canvas (hidden, for capture)
    const canvas=document.createElement('canvas');
    canvas.style.display='none';

    // Photo preview (hidden initially)
    const photoPreview=document.createElement('img');
    photoPreview.style.cssText='display:none;width:100%;height:260px;object-fit:cover;border-radius:12px;transform:scaleX(-1);margin-bottom:16px;border:3px solid #059669';

    // Buttons
    const btnWrap=document.createElement('div');
    btnWrap.style.cssText='display:flex;gap:10px';
    
    const btnCapture=document.createElement('button');
    btnCapture.style.cssText='flex:2;padding:14px;border:none;border-radius:10px;font-size:15px;font-weight:700;cursor:pointer;background:#dc2626;color:white;transition:opacity .2s';
    btnCapture.textContent='📸 Capturar e Confirmar';
    btnCapture.disabled=true;

    const btnSkip=document.createElement('button');
    btnSkip.style.cssText='flex:1;padding:14px;border:1px solid #e2e8f0;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;background:white;color:#64748b';
    btnSkip.textContent='Pular';

    btnWrap.appendChild(btnSkip);
    btnWrap.appendChild(btnCapture);

    modal.appendChild(videoWrap);
    modal.appendChild(statusEl);
    modal.appendChild(photoPreview);
    modal.appendChild(canvas);
    modal.appendChild(btnWrap);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    let stream=null;
    let captured=false;

    // Start camera
    async function startCamera(){
      try{
        stream=await navigator.mediaDevices.getUserMedia({
          video:{width:{ideal:640},height:{ideal:480},facingMode:'user'},
          audio:false
        });
        video.srcObject=stream;
        statusEl.textContent='✅ Câmera ativa — posicione-se e clique em Capturar';
        statusEl.style.color='#059669';
        btnCapture.disabled=false;
      }catch(err){
        console.error('Camera error:',err);
        if(err.name==='NotAllowedError'){
          statusEl.innerHTML='<span style="color:#dc2626">❌ Câmera não autorizada pelo navegador.</span><br><span style="font-size:11px">Peça ao TI para autorizar a câmera para este site.</span>';
        }else if(err.name==='NotFoundError'){
          statusEl.innerHTML='<span style="color:#dc2626">❌ Nenhuma câmera encontrada neste dispositivo.</span>';
        }else{
          statusEl.innerHTML=`<span style="color:#dc2626">❌ Erro: ${err.message}</span>`;
        }
        // Allow skipping if camera unavailable
        btnCapture.style.display='none';
        btnSkip.textContent='Continuar sem foto';
        btnSkip.style.flex='1';
      }
    }

    // Capture photo
    btnCapture.addEventListener('click',async()=>{
      if(captured)return;
      
      // 3-second countdown
      countdownEl.style.display='flex';
      for(let i=3;i>=1;i--){
        countdownEl.textContent=String(i);
        await new Promise(r=>setTimeout(r,700));
      }
      countdownEl.textContent='📸';
      await new Promise(r=>setTimeout(r,300));
      countdownEl.style.display='none';

      // Capture frame
      canvas.width=video.videoWidth||640;
      canvas.height=video.videoHeight||480;
      const ctx=canvas.getContext('2d');
      // Mirror horizontally (to match preview)
      ctx.translate(canvas.width,0);ctx.scale(-1,1);
      ctx.drawImage(video,0,0,canvas.width,canvas.height);

      // Add timestamp watermark
      ctx.setTransform(1,0,0,1,0,0); // Reset transform
      ctx.fillStyle='rgba(0,0,0,0.5)';
      ctx.fillRect(0,canvas.height-28,canvas.width,28);
      ctx.fillStyle='white';ctx.font='12px monospace';
      const ts=new Date().toLocaleString('pt-BR');
      const userLabel=AppState.usuario?.nome||'—';
      ctx.fillText(`${ts} · ${userLabel} · ${actionLabel}`,8,canvas.height-10);

      // Show preview
      photoPreview.src=canvas.toDataURL('image/jpeg',0.85);
      photoPreview.style.display='block';
      video.style.display='none';
      videoWrap.style.display='none';

      // Convert to blob
      canvas.toBlob((blob)=>{
        captured=true;
        statusEl.innerHTML='<span style="color:#059669;font-weight:700">✅ Foto capturada com sucesso</span>';
        
        // Change buttons
        btnCapture.textContent='✓ Confirmar Ação';
        btnCapture.style.background='#059669';
        btnCapture.onclick=()=>{cleanup();resolve(blob)};

        btnSkip.textContent='Recapturar';
        btnSkip.onclick=()=>{
          captured=false;
          photoPreview.style.display='none';
          video.style.display='block';
          videoWrap.style.display='block';
          btnCapture.textContent='📸 Capturar e Confirmar';
          btnCapture.style.background='#dc2626';
          btnCapture.onclick=null;
          btnSkip.textContent='Pular';
          btnSkip.onclick=()=>{cleanup();resolve(null)};
        };
      },'image/jpeg',0.85);
    });

    // Skip
    btnSkip.addEventListener('click',()=>{cleanup();resolve(null)});

    // Escape key
    overlay.addEventListener('keydown',e=>{if(e.key==='Escape'){cleanup();resolve(null)}});
    overlay.tabIndex=0;overlay.focus();

    function cleanup(){
      if(stream){stream.getTracks().forEach(t=>t.stop())}
      overlay.remove();
    }

    startCamera();
  });
}

/**
 * Send audit log with photo to backend
 * @param {Object} logData - audit log fields
 * @param {Blob|null} fotoBlob - captured photo blob
 * @returns {Object} response with log id and foto path
 */
async function sendAuditWithPhoto(logData,fotoBlob){
  if(!fotoBlob){
    // No photo — send regular log
    return Api.auditoriaLog(logData);
  }
  // Send as multipart with photo
  const fd=new FormData();
  fd.append('foto',fotoBlob,`audit-${Date.now()}.jpg`);
  Object.entries(logData).forEach(([k,v])=>{
    if(v!=null)fd.append(k,typeof v==='object'?JSON.stringify(v):String(v));
  });
  try{
    const r=await fetch('/api/auditoria/log-com-foto',{method:'POST',body:fd});
    return await r.json();
  }catch(e){console.error('Audit photo error:',e);return{success:false}}
}

/**
 * Capture geolocation for audit (non-blocking, 3s timeout)
 * Returns: {latitude, longitude, accuracy, geo_status} or {geo_status:'negado|indisponivel|timeout'}
 */
function captureGeoForAudit(){
  return new Promise(resolve=>{
    if(!navigator.geolocation){
      resolve({geo_status:'indisponivel'});return;
    }
    navigator.geolocation.getCurrentPosition(
      pos=>resolve({latitude:pos.coords.latitude,longitude:pos.coords.longitude,accuracy:Math.round(pos.coords.accuracy),geo_status:'ok'}),
      err=>{
        const status=err.code===1?'negado':err.code===3?'timeout':'erro';
        resolve({geo_status:status,geo_erro:err.message});
      },
      {timeout:3000,maximumAge:60000,enableHighAccuracy:false}
    );
  });
}
