import * as THREE from '../vendor/three.module.js';
import {createCollisionWorld} from './walkthrough-physics.js';
export const FLOOR_SPAWNS={garagem:[5,-.93,-5],terreo:[6,1.95,-5],superior:[1,5.19,-4.5],cobertura:[5,8.04,-5]};
export function isEditing(target){return !!target?.closest?.('input,textarea,select,[contenteditable="true"]');}
export function createWalkController({model,camera,canvas,host,status,invalidate,onEnter,onExit}){
 const world=createCollisionWorld(model),keys=new Set();let enabled=false,feet,yaw=0,pitch=0,last=0,pointer=null,lastPoint=null,saved;
 const panel=document.createElement('div');panel.className='walk-panel';panel.innerHTML='<button type="button" data-walk-toggle aria-pressed="false">Caminhar em 3D</button><span class="walk-help">WASD / setas: andar · arraste: olhar · Esc: sair. Portas fechadas e trechos sem piso bloqueiam a passagem. Rooftop: transferência pelo catálogo, não escada.</span><div class="walk-pad" hidden aria-label="Controles de caminhada"><button data-walk-key="ArrowUp" aria-label="Andar para frente">↑</button><button data-walk-key="ArrowLeft" aria-label="Andar para esquerda">←</button><button data-walk-key="ArrowDown" aria-label="Andar para trás">↓</button><button data-walk-key="ArrowRight" aria-label="Andar para direita">→</button><button data-walk-exit>Sair da caminhada</button></div>';
 host.parentElement.insertBefore(panel,host.nextSibling);const toggle=panel.querySelector('[data-walk-toggle]'),pad=panel.querySelector('.walk-pad');
 const link=document.createElement('link');link.rel='stylesheet';link.href=new URL('./walkthrough.css',import.meta.url).href;document.head.append(link);
 const announce=t=>{status.textContent=t;};
 function apply(){camera.position.set(feet.x,feet.y+1.6,feet.z);camera.rotation.order='YXZ';camera.rotation.set(pitch,yaw,0);invalidate();}
 function release(){keys.clear();pointer=null;lastPoint=null;last=0;}
 function enter(eye=FLOOR_SPAWNS.terreo,label='Térreo',bounds){
  const p=world.spawn(eye,bounds);if(!p){announce('Não há posição livre e apoiada no piso neste ponto. Escolha outro ambiente; não atravessamos paredes para entrar.');return false;}
  if(!enabled){saved={position:camera.position.clone(),quaternion:camera.quaternion.clone()};onEnter();enabled=true;toggle.textContent='Sair da caminhada';toggle.setAttribute('aria-pressed','true');pad.hidden=false;host.dataset.walk='true';}
  release();feet=p;yaw=0;pitch=0;apply();canvas.tabIndex=0;canvas.focus({preventScroll:true});announce('Caminhada · '+label+' · transferência para ponto livre no piso. WASD/setas ou botões; arraste para olhar. Esc sai.');return true;
 }
 function exit(){if(!enabled)return;enabled=false;release();pad.hidden=true;host.dataset.walk='false';toggle.textContent='Caminhar em 3D';toggle.setAttribute('aria-pressed','false');onExit(saved);invalidate();}
 toggle.onclick=()=>enabled?exit():enter();panel.querySelector('[data-walk-exit]').onclick=exit;
 function keydown(e){if(!enabled||isEditing(e.target))return;if(e.key==='Escape'){exit();return;}const key=e.key.toLowerCase();if(!['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(key))return;if(document.activeElement!==canvas&&!host.contains(document.activeElement)&&!panel.contains(document.activeElement))return;e.preventDefault();keys.add(key);invalidate();}
 function keyup(e){keys.delete(e.key.toLowerCase());}
 document.addEventListener('keydown',keydown);document.addEventListener('keyup',keyup);window.addEventListener('blur',release);document.addEventListener('visibilitychange',()=>{if(document.hidden)release();});
 for(const b of panel.querySelectorAll('[data-walk-key]')){b.addEventListener('pointerdown',e=>{if(!enabled)return;e.preventDefault();b.setPointerCapture(e.pointerId);keys.add(b.dataset.walkKey.toLowerCase());invalidate();});for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,()=>keys.delete(b.dataset.walkKey.toLowerCase()));}
 canvas.addEventListener('pointerdown',e=>{if(!enabled||pointer!==null)return;e.preventDefault();pointer=e.pointerId;lastPoint=[e.clientX,e.clientY];canvas.setPointerCapture(pointer);canvas.focus({preventScroll:true});});
 canvas.addEventListener('pointermove',e=>{if(!enabled||pointer!==e.pointerId)return;yaw-=(e.clientX-lastPoint[0])*.004;pitch=THREE.MathUtils.clamp(pitch-(e.clientY-lastPoint[1])*.004,-1.35,1.35);lastPoint=[e.clientX,e.clientY];apply();});
 for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,e=>{if(pointer===e.pointerId){pointer=null;lastPoint=null;}});
 function tick(time){if(!enabled)return false;const dt=last?Math.min((time-last)/1000,.05):1/60;last=time;let x=Number(keys.has('d')||keys.has('arrowright'))-Number(keys.has('a')||keys.has('arrowleft')),z=Number(keys.has('s')||keys.has('arrowdown'))-Number(keys.has('w')||keys.has('arrowup'));if(!x&&!z){last=0;return false;}const n=Math.hypot(x,z);x=x/n*1.8*dt;z=z/n*1.8*dt;feet=world.move(feet,x*Math.cos(yaw)+z*Math.sin(yaw),z*Math.cos(yaw)-x*Math.sin(yaw));apply();return true;}
 return {enter,exit,tick,pause:release,get enabled(){return enabled;},world};
}
