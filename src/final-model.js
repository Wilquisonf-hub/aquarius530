import * as THREE from '../vendor/three.module.js';
import {OrbitControls} from '../vendor/OrbitControls.js';
import {GLTFLoader} from '../vendor/GLTFLoader.js';
import {createWalkController,FLOOR_SPAWNS} from './walkthrough.js';
export async function mountFinalModel(config){
 const host=document.querySelector('#model-host'),status=document.querySelector('#model-status');let renderer;
 const setReady=state=>{host.dataset.modelState=state;for(const button of document.querySelectorAll('#floor-controls button[data-floor]'))button.disabled=state!=='ready';for(const id of ['reset','top','fullscreen','roof-hypothesis'])document.querySelector('#'+id).disabled=state!=='ready';};
 setReady('loading');
 try{renderer=new THREE.WebGLRenderer({antialias:true});}catch{setReady('failed');status.textContent='O navegador não iniciou o 3D. As plantas vetoriais e os arquivos abaixo continuam disponíveis.';return null;}
 const mobile=window.matchMedia('(max-width: 800px)').matches;renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,mobile?1:1.5));renderer.localClippingEnabled=true;host.append(renderer.domElement);
 const scene=new THREE.Scene();scene.background=new THREE.Color('#e8e8e1');
 const camera=new THREE.PerspectiveCamera(42,1,.01,1000),controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;
 scene.add(new THREE.HemisphereLight(0xffffff,0x596351,2.4));const sun=new THREE.DirectionalLight(0xffffff,2.5);sun.position.set(15,25,12);scene.add(sun);
 let walker,walkFloor=null,orbitTarget,orbitFloor,model,mode=null,center=new THREE.Vector3(),radius=20,active=true,frame=0,inViewport=true;
 const invalidate=()=>{if(active&&!frame)frame=requestAnimationFrame(draw);};
 const draw=(time)=>{frame=0;if(!active)return;const walking=walker?.enabled;const changed=walking?walker.tick(time):controls.update();renderer.render(scene,camera);if(changed)invalidate();};
 controls.addEventListener('change',invalidate);controls.addEventListener('start',invalidate);
 const resize=()=>{if(!host.clientWidth||!host.clientHeight)return;renderer.setSize(host.clientWidth,host.clientHeight);camera.aspect=host.clientWidth/host.clientHeight;camera.updateProjectionMatrix();invalidate();};
 const observer=new ResizeObserver(resize);observer.observe(host);resize();
 const visible=o=>{for(let p=o;p;p=p.parent)if(!p.visible)return false;return true;};
 function fit(){model.updateMatrixWorld(true);const box=new THREE.Box3();model.traverse(o=>{if(o.isMesh&&visible(o)){const b=new THREE.Box3().setFromObject(o);if(!['juntos','exteriores'].includes(mode)){const [lo,hi]=config.floors[mode].range;if(b.max.y<lo||b.min.y>hi)return;b.min.y=Math.max(b.min.y,lo);b.max.y=Math.min(b.max.y,hi);}box.union(b);}});if(box.isEmpty())throw new Error('Empty selected geometry');center=box.getCenter(new THREE.Vector3());const s=box.getSize(new THREE.Vector3());radius=Math.max(s.x,s.y,s.z,1);camera.far=radius*30;camera.updateProjectionMatrix();}
 function view(top=false){
  if(walker?.enabled)walker.exit();
  // Discard residual gesture damping before an explicit camera change.
  const damping=controls.enableDamping;controls.enableDamping=false;controls.update();
  const distance=radius*(camera.aspect<1?2.0:1.35);camera.position.copy(center).add(top?new THREE.Vector3(0,distance*1.35,.001):(mode==='exteriores'?new THREE.Vector3(distance,distance*.85,distance*.65):new THREE.Vector3(-distance,distance*.85,-distance*.65)));controls.target.copy(center);controls.update();controls.enableDamping=damping;invalidate();}
 function selectFloor(next){if(walker?.enabled){if(next===walkFloor)return;if(FLOOR_SPAWNS[next]){if(walker.enter(FLOOR_SPAWNS[next],next==='cobertura'?'Rooftop (transferência; acesso por escada não verificado)':config.floors[next]?.label))walkFloor=next;}return;}if(!model||!(['juntos','exteriores'].includes(next)||config.floors[next]))return;const changed=next!==mode;mode=next;host.dataset.floor=mode;
  const floor=config.floors[mode],planes=['juntos','exteriores'].includes(mode)?[]:[new THREE.Plane(new THREE.Vector3(0,1,0),-floor.range[0]),new THREE.Plane(new THREE.Vector3(0,-1,0),floor.range[1])];
  const materials=new Set();model.traverse(o=>{if(o.isMesh)for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);});for(const m of materials){const recompile=(m.clippingPlanes?.length||0)!==planes.length;m.clippingPlanes=planes;if(recompile)m.needsUpdate=true;}
  for(const [id,f] of Object.entries(config.floors))for(const name of f.groups||[]){const group=model.getObjectByName(name);if(group)group.visible=['juntos','exteriores'].includes(mode)||mode===id;}
  for(const [name,levels] of Object.entries(config.contextGroups||{})){const group=model.getObjectByName(name);if(group)group.visible=['juntos','exteriores'].includes(mode)||levels.includes(mode);}
  for(const name of config.hypothesisGroups||[]){const g=model.getObjectByName(name);if(g)g.visible=document.querySelector('#roof-hypothesis').checked&&['juntos','exteriores','cobertura'].includes(mode);}
  for(const b of document.querySelectorAll('#floor-controls button[data-floor]'))b.setAttribute('aria-pressed',String(b.dataset.floor===mode));
  // Visibility changes and repeated selections must not erase the user's orbit/pan/zoom.
  fit();if(changed)view();else invalidate();status.textContent=(floor?.label||(mode==='exteriores'?'Terreno / exteriores':'Casa inteira'))+' · arraste para girar; use dois dedos para ampliar ou mover.';
  document.querySelector('#floor-scope').textContent=floor?.note||(mode==='exteriores'?config.exteriorNote:config.note);
 }
 status.textContent='Carregando o modelo integrado F04…';
 try{
  const gltf=await new GLTFLoader().loadAsync(config.url+'?sha='+encodeURIComponent(config.sha256));model=gltf.scene;
  for(const name of config.requiredNodes)if(!model.getObjectByName(name))throw new Error('Missing model node: '+name);
  scene.add(model);selectFloor('juntos');
  walker=createWalkController({model,camera,canvas:renderer.domElement,host,status,invalidate,
   onEnter:()=>{walkFloor=null;orbitFloor=mode;orbitTarget=controls.target.clone();selectFloor('juntos');for(const name of config.hypothesisGroups||[]){const g=model.getObjectByName(name);if(g)g.visible=true;}controls.enabled=false;},
   onExit:saved=>{controls.enabled=true;selectFloor(orbitFloor||'juntos');camera.position.copy(saved.position);camera.quaternion.copy(saved.quaternion);controls.target.copy(orbitTarget);const damping=controls.enableDamping;controls.enableDamping=false;controls.update();controls.enableDamping=damping;}
  });
  // #model-host also carries data-floor as state, but must never receive a click reset.
  for(const button of document.querySelectorAll('#floor-controls button[data-floor]'))button.onclick=()=>selectFloor(button.dataset.floor);
  document.querySelector('#roof-hypothesis').onchange=()=>selectFloor(mode);
  document.querySelector('#reset').onclick=()=>view();document.querySelector('#top').onclick=()=>view(true);
  const fullscreenButton=document.querySelector('#fullscreen');const syncFullscreen=()=>{fullscreenButton.textContent=document.fullscreenElement===document.querySelector('#model-frame')?'Sair da tela cheia':'Tela cheia';};document.addEventListener('fullscreenchange',syncFullscreen);
  setReady('ready');
  document.querySelector('#fullscreen').onclick=async()=>{const frame=document.querySelector('#model-frame');try{if(document.fullscreenElement)await document.exitFullscreen();else if(frame.requestFullscreen)await frame.requestFullscreen();else{frame.scrollIntoView({block:'start'});status.textContent='Tela cheia não disponível neste navegador. Use o gesto de pinça para aproximar o modelo.';}}catch{status.textContent='Não foi possível entrar em tela cheia neste navegador.';}};
 }catch(error){if(model)scene.remove(model);model=null;setReady('failed');status.textContent='Não foi possível carregar o modelo 3D. Recarregue a página ou consulte as plantas e os downloads abaixo.';console.error(error);observer.disconnect?.();controls.dispose?.();renderer.dispose?.();active=false;if(frame)cancelAnimationFrame(frame);return null;}
 invalidate();
 const updateActive=()=>{active=!document.hidden&&inViewport;if(!active)walker?.pause();if(!active&&frame){cancelAnimationFrame(frame);frame=0;}if(active)invalidate();};
 document.addEventListener('visibilitychange',updateActive);
 new IntersectionObserver(entries=>{inViewport=entries[0].isIntersecting;updateActive();},{rootMargin:'100px'}).observe(host);
 return {selectFloor,getFloor:()=>mode,
  focusRoom(room){if(!model)return false;if(room.navigable===false||!room.focus){status.textContent='Ambiente catalogado como evidência, ainda sem geometria 3D validada.';return false;}if(walker?.enabled)walker.exit();selectFloor(room.floor);const p=new THREE.Vector3(...room.focus);controls.target.copy(p);const span=room.bounds?Math.max(room.bounds.max[0]-room.bounds.min[0],room.bounds.max[2]-room.bounds.min[2]):5;const distance=THREE.MathUtils.clamp(span*.8,2.2,8);camera.position.copy(p).add(new THREE.Vector3(distance*.8,distance,distance));const damping=controls.enableDamping;controls.enableDamping=false;controls.update();controls.enableDamping=damping;invalidate();return true;},
  enterRoom(room){if(!model||!walker)return false;if(room.navigable===false||!room.entry){status.textContent='Ambiente catalogado como evidência, ainda sem geometria 3D validada.';return false;}const ok=walker?.enter(room.entry,room.label+(room.floor==='cobertura'?' (transferência; acesso por escada não verificado)':''),room.bounds);if(ok)walkFloor=room.floor;return ok;},
  exitWalk(){walker?.exit();},isWalking:()=>!!walker?.enabled};
}
