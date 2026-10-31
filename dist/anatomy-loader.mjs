// Runs before the instrument's larger module graph. The preview uses only real
// received XYZ triples; percentages count decoded asset bytes, not a timer.
export const ANATOMY_POINTS=65536;
export async function loadAnatomyStream({pointCount=ANATOMY_POINTS,fetchImpl=globalThis.fetch,onProgress=()=>{}}={}){
 const length=pointCount*12,controller=new AbortController();
 const state={positions:new Float32Array(pointCount*3),normals:new Float32Array(pointCount*3),positionPoints:0,normalPoints:0,receivedBytes:0,totalBytes:length*2};
 async function read(part,path){
  const response=await fetchImpl(path,{signal:controller.signal});
  if(!response.ok)throw new Error('Anatomy asset unavailable ('+response.status+'): '+path);
  const raw=new Uint8Array(length),view=new DataView(raw.buffer),target=state[part];let received=0,points=0;
  function accept(chunk){
   if(received+chunk.byteLength>length)throw new Error('Anatomy buffer length exceeds exactly '+pointCount+' XYZ triples');
   raw.set(chunk,received);received+=chunk.byteLength;state.receivedBytes+=chunk.byteLength;
   const next=Math.floor(received/12);
   for(let i=points;i<next;i++){
    for(let axis=0;axis<3;axis++){
     const value=view.getFloat32((i*3+axis)*4,true);
     if(!Number.isFinite(value))throw new Error('Non-finite anatomy coordinate');
     target[i*3+axis]=value;
    }
    if(part==='normals'&&Math.abs(Math.hypot(target[i*3],target[i*3+1],target[i*3+2])-1)>.01)throw new Error('Invalid anatomical surface normal');
   }
   points=next;state[part==='positions'?'positionPoints':'normalPoints']=points;
   onProgress({...state,part});
  }
  if(response.body?.getReader){
   const reader=response.body.getReader();
   try{while(true){const {done,value}=await reader.read();if(done)break;accept(value);}}
   catch(error){await reader.cancel().catch(()=>{});throw error;}
   finally{reader.releaseLock();}
  }else accept(new Uint8Array(await response.arrayBuffer()));
  if(received!==length)throw new Error('Anatomy buffer must contain exactly '+pointCount+' XYZ triples (truncated asset)');
 }
 try{
  await Promise.all([read('positions','./assets/anatomy/brain-65536.xyz.f32'),read('normals','./assets/anatomy/brain-65536.normals.f32')]);
  return {positions:state.positions,normals:state.normals};
 }catch(error){controller.abort();throw error;}
}

let finishPreview=()=>{},failPreview=()=>{};
export function completeAnatomyLoading(){finishPreview();}
export function failAnatomyLoading(error){failPreview(error);}
function startLoadingPreview(){
 const root=document.getElementById('brain-loading'),canvas=document.getElementById('brain-preview'),brain=document.getElementById('brain'),status=document.getElementById('anatomy-loading-label'),detail=document.getElementById('anatomy-loading-detail');
 const context=canvas?.getContext('2d',{alpha:true});
 const progress=window.cortexAnatomyLoading={stage:'connecting',positionPoints:0,normalPoints:0,receivedBytes:0,totalBytes:ANATOMY_POINTS*24,percent:0,previewPoints:0,rendererReady:false};
 let positions=null,drawn=0,frame=0,complete=false,failed=false,observer;
 const request=()=>{if(!frame&&!complete&&!failed&&!document.hidden)frame=requestAnimationFrame(draw);};
 function draw(){
  frame=0;if(!context||complete||failed)return;
  const rect=canvas.getBoundingClientRect();if(!rect.width||!rect.height)return;
  const dpr=Math.min(window.devicePixelRatio||1,1.5),width=Math.round(rect.width*dpr),height=Math.round(rect.height*dpr);
  if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;drawn=0;}
  const aspect=width/height,scale=Math.min(.94,aspect*.90/.88),cy=Math.cos(-.075),sy=Math.sin(-.075),cx=Math.cos(.20),sx=Math.sin(.20);
  context.fillStyle='#95f8cc';
  // At most 16k sampled preview dots. The full 65k field takes over in WebGL.
  for(let i=drawn;i<progress.positionPoints;i+=4){
   const x=positions[i*3],y=positions[i*3+1],z=positions[i*3+2],xx=cy*x+sy*z,zz=-sy*x+cy*z,yy=cx*y-sx*zz,z2=sx*y+cx*zz,perspective=4.8/(4.8-z2);
   const px=(xx*perspective*scale/aspect+1)*width/2,py=(1-(yy*perspective*scale-.015))*height/2;
   context.globalAlpha=.32+.44*Math.max(0,Math.min(1,(z2+.7)/1.4));
   context.fillRect(px,py,1.15*dpr,1.15*dpr);
  }
  drawn=Math.ceil(progress.positionPoints/4)*4;progress.previewPoints=Math.ceil(progress.positionPoints/4);
 }
 if(root){root.hidden=false;root.setAttribute('aria-busy','true');}
 if(brain)brain.setAttribute('aria-busy','true');
 if(typeof ResizeObserver!=='undefined'&&canvas){observer=new ResizeObserver(request);observer.observe(canvas);}
 const onVisible=()=>{if(!document.hidden)request();};document.addEventListener('visibilitychange',onVisible);
 // The waiting pixel is an indicator, not received anatomy; the counter stays 0.
 request();
 failPreview=error=>{
  failed=true;progress.stage='error';progress.error=error.message;
  if(frame){cancelAnimationFrame(frame);frame=0;}observer?.disconnect();document.removeEventListener('visibilitychange',onVisible);brain?.setAttribute('aria-busy','false');
  if(root){root.setAttribute('aria-busy','false');root.removeAttribute('role');}
  if(status)status.textContent='MODEL LOAD FAILED';
  if(detail)detail.textContent='Reload the page to try again.';
 };
 const ready=loadAnatomyStream({onProgress:event=>{
  if(failed)return;
  positions=event.positions;Object.assign(progress,{stage:'streaming',positionPoints:event.positionPoints,normalPoints:event.normalPoints,receivedBytes:event.receivedBytes,percent:Math.floor(event.receivedBytes/event.totalBytes*100)});
  if(root){if(event.positionPoints>0)root.setAttribute('data-has-points','true');root.setAttribute('aria-valuenow',String(progress.percent));root.setAttribute('aria-valuetext',progress.percent+'% model data; '+event.positionPoints.toLocaleString()+' of 65,536 points');}
  if(status)status.textContent='FORMING THE FIELD · '+progress.percent+'%';
  if(detail)detail.textContent=event.positionPoints.toLocaleString()+' / 65,536 POINTS';
  request();
 }}).then(data=>{
  if(!failed){progress.stage='preparing';if(status)status.textContent='MODEL LOADED · PREPARING FIELD';}return data;
 }).catch(error=>{
  failPreview(error);
  throw error;
 });
 // A slow instrument module must not leave an early network rejection unhandled.
 ready.catch(()=>{});
 finishPreview=()=>{
  if(complete||failed)return;complete=true;progress.rendererReady=true;progress.stage='ready';
  if(frame)cancelAnimationFrame(frame);observer?.disconnect();document.removeEventListener('visibilitychange',onVisible);
  if(root){root.hidden=true;root.setAttribute('aria-busy','false');}
  brain?.setAttribute('aria-busy','false');if(canvas){canvas.width=1;canvas.height=1;}
 };
 return ready;
}
export const anatomyReady=typeof document==='undefined'?null:startLoadingPreview();
