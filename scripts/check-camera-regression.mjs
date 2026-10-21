// Integration regression: actual vendored Three.js/OrbitControls, simulated DOM and GPU.
// This does not replace real-browser/mobile visual or FPS testing.
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {OrbitControls as RealOrbitControls} from '../vendor/OrbitControls.js';
const sourcePath=process.argv[2]||'src/final-model.js';
const expectBug=process.argv.includes('--expect-bug');
class Element {
 constructor(id='',tag='DIV'){this.id=id;this.tagName=tag;this.dataset={};this.style={};this.children=[];this.listeners=new Map();this.clientWidth=960;this.clientHeight=600;this.checked=true;this.attrs={};}
 addEventListener(type,fn){if(!this.listeners.has(type))this.listeners.set(type,new Set());this.listeners.get(type).add(fn);}
 removeEventListener(type,fn){this.listeners.get(type)?.delete(fn);}
 append(child){child.parentElement=this;this.children.push(child);}
 setAttribute(k,v){this.attrs[k]=v;}
 getRootNode(){return document;}
 setPointerCapture(){} releasePointerCapture(){}
 getBoundingClientRect(){return {left:0,top:0,width:this.clientWidth,height:this.clientHeight};}
 fire(type,props={}){const event={type,target:this,preventDefault(){},stopPropagation(){this.stopped=true;},...props};for(let e=this;e;e=e.parentElement){for(const fn of [...(e.listeners.get(type)||[])])fn(event);e['on'+type]?.(event);if(event.stopped)break;}return event;}
}
const ids=Object.fromEntries(['model-host','model-status','floor-scope','roof-hypothesis','reset','top','fullscreen','model-frame','floor-controls'].map(id=>[id,new Element(id)]));
const floorIds=['juntos','exteriores','garagem','terreo','superior','cobertura'];
const buttons=floorIds.map(id=>{const b=new Element('', 'BUTTON');b.dataset.floor=id;ids['floor-controls'].append(b);return b;});
ids['model-frame'].append(ids['model-host']);
const doc=new Element('document');doc.hidden=false;
doc.querySelector=sel=>ids[sel.slice(1)]||null;
doc.querySelectorAll=sel=>{
 if(sel==='#floor-controls button[data-floor]')return buttons;
 if(sel==='[data-floor]')return [...buttons,...Object.values(ids).filter(e=>'floor'in e.dataset)];
 throw Error('Unexpected selector '+sel);
};
globalThis.document=doc;globalThis.window={matchMedia:()=>({matches:false}),devicePixelRatio:1};
let nextFrame=1;const frames=new Map();
globalThis.requestAnimationFrame=fn=>{const id=nextFrame++;frames.set(id,fn);return id;};
globalThis.cancelAnimationFrame=id=>frames.delete(id);
function settle(){let count=0;while(frames.size){const batch=[...frames.values()];frames.clear();for(const fn of batch)fn();assert.ok(++count<1000,'render loop must become idle');}return count;}
let resize,intersect;
globalThis.ResizeObserver=class{constructor(fn){resize=fn;}observe(){}};
globalThis.IntersectionObserver=class{constructor(fn){intersect=fn;}observe(){}};
let controls,renderer;
class Renderer {constructor(){this.domElement=new Element('canvas','CANVAS');this.renders=0;renderer=this;}setPixelRatio(){}setSize(w,h){this.domElement.clientWidth=w;this.domElement.clientHeight=h;}render(scene,camera){camera.updateMatrixWorld();this.renders++;}}
class Controls extends RealOrbitControls {constructor(...args){super(...args);controls=this;}}
const scene=new THREE.Group();
for(const [i,id] of floorIds.slice(2).entries()){const group=new THREE.Group();group.name=id;const mesh=new THREE.Mesh(new THREE.BoxGeometry(8,2,10),new THREE.MeshBasicMaterial());mesh.position.y=i*3;group.add(mesh);scene.add(group);}
const roof=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshBasicMaterial());roof.name='hypothesis';roof.position.y=11;scene.add(roof);
class Loader{async loadAsync(){return {scene};}}
globalThis.__cameraRegression={THREE:{...THREE,WebGLRenderer:Renderer},OrbitControls:Controls,GLTFLoader:Loader};
const source=await fs.readFile(sourcePath,'utf8');
const instrumented='let testWalker;const createWalkController=options=>(testWalker={enabled:false,entries:0,pause(){},tick(){return false;},enter(){globalThis.__walkEntries=(globalThis.__walkEntries||0)+1;this.entries++;if(!this.enabled){this.saved={position:options.camera.position.clone(),quaternion:options.camera.quaternion.clone()};options.onEnter();this.enabled=true;}return true;},exit(){if(!this.enabled)return;this.enabled=false;options.onExit(this.saved);}}); const FLOOR_SPAWNS={garagem:[0,0,0],terreo:[0,0,0],superior:[0,0,0],cobertura:[0,0,0]};\n'+source.replace(/^import .*\n/gm,'');
const {mountFinalModel}=await import('data:text/javascript;base64,'+Buffer.from('const {THREE,OrbitControls,GLTFLoader}=globalThis.__cameraRegression;\n'+instrumented).toString('base64'));
const config={url:'fixture.glb',sha256:'test',requiredNodes:['garagem'],floors:Object.fromEntries(floorIds.slice(2).map((id,i)=>[id,{label:id,range:[i*3-1,i*3+2],groups:[id]}])),hypothesisGroups:['hypothesis']};
const controller=await mountFinalModel(config);assert.ok(controller);settle();
const pose=()=>[...controls.object.position.toArray(),...controls.target.toArray(),...controls.object.quaternion.toArray(),controls.object.zoom];
const same=(a,b)=>a.every((n,i)=>Math.abs(n-b[i])<1e-8);
const original=pose();
function drag(button=0,pointerType='mouse',id=1){const canvas=renderer.domElement;canvas.fire('pointerdown',{pointerId:id,pointerType,button,clientX:200,clientY:180,pageX:200,pageY:180});canvas.fire('pointermove',{pointerId:id,pointerType,button,clientX:340,clientY:240,pageX:340,pageY:240});canvas.fire('pointerup',{pointerId:id,pointerType,button});settle();}
drag();assert.ok(!same(original,pose()),'real OrbitControls must rotate');
const rotated=pose();renderer.domElement.fire('click');settle();
if(expectBug){assert.ok(!same(rotated,pose()),'old source must reproduce drag-end reset');console.log('REPRODUCED: canvas click bubbles to #model-host[data-floor].onclick and resets the camera after an actual OrbitControls drag.');process.exit(0);}
assert.ok(same(rotated,pose()),'drag-end click must preserve orbit');
assert.equal(ids['model-host'].onclick,undefined,'canvas host must never become a floor control');
assert.equal(ids['model-host'].attrs['aria-pressed'],undefined,'canvas host is not a pressed button');
function preserve(label,action){const before=pose();action();assert.ok(same(before,pose()),label+' (synchronous pose)');settle();assert.ok(before.every((n,i)=>Math.abs(n-pose()[i])<0.01),label+' (only residual damping below 0.01 scene units permitted)');}
preserve('repeat same floor',()=>controller.selectFloor(controller.getFloor()));
preserve('repeat toolbar button',()=>buttons[0].fire('click'));
preserve('hypothesis checkbox',()=>{ids['roof-hypothesis'].checked=false;ids['roof-hypothesis'].fire('change');});
assert.equal(roof.visible,false);
preserve('resize/fullscreen layout',()=>{ids['model-host'].clientWidth=430;resize();});
assert.equal(controls.object.aspect,430/600);
preserve('hidden/visible tab',()=>{doc.hidden=true;doc.fire('visibilitychange');doc.hidden=false;doc.fire('visibilitychange');});
preserve('scroll out/in viewport',()=>{intersect([{isIntersecting:false}]);intersect([{isIntersecting:true}]);});
drag(2);const panned=pose();assert.ok(!same(panned,rotated),'real right-drag must pan');
preserve('pan release click',()=>renderer.domElement.fire('click'));
renderer.domElement.fire('wheel',{deltaY:-100,deltaMode:0,clientX:200,clientY:180});settle();assert.ok(!same(panned,pose()),'real wheel must zoom');
preserve('zoom click',()=>renderer.domElement.fire('click'));
drag(0,'touch',2);preserve('touch release click',()=>renderer.domElement.fire('click'));
// Actual two-finger dolly/pan through the vendored touch event path.
const beforeTwoTouch=pose(),canvas=renderer.domElement;
for(const [pointerId,x] of [[3,180],[4,300]])canvas.fire('pointerdown',{pointerId,pointerType:'touch',pageX:x,pageY:200,clientX:x,clientY:200});
canvas.fire('pointermove',{pointerId:4,pointerType:'touch',pageX:380,pageY:240,clientX:380,clientY:240});
for(const pointerId of [4,3])canvas.fire('pointerup',{pointerId,pointerType:'touch'});
settle();assert.ok(!same(beforeTwoTouch,pose()),'two-finger pinch/pan must transform camera');
preserve('two-touch release click',()=>canvas.fire('click'));
const beforeFloor=pose();controller.selectFloor('superior');settle();assert.ok(!same(beforeFloor,pose()),'actual floor change must reframe');
preserve('same floor after isolation',()=>controller.selectFloor('superior'));
const beforeTop=pose();ids.top.fire('click');settle();assert.ok(!same(beforeTop,pose()),'explicit top view must reframe');
const beforeReset=pose();ids.reset.fire('click');settle();assert.ok(!same(beforeReset,pose()),'explicit perspective must reframe');
assert.equal(frames.size,0,'viewer must be idle when no changes remain');
console.log('PASS: real OrbitControls rotation/pan/wheel/touch/two-finger pinch-pan; bubbled drag-end click; same-floor toolbar/API; checkbox; resize; visibility; scroll; new-floor and explicit-view resets; renderer returns to idle. Simulated DOM/GPU, not browser/FPS QA.');

// Viewer/controller integration: full visibility and no clipping in walk, repeat floor is not teleport.
const beforeWalk=pose();controller.enterRoom({floor:'superior',label:'Test',entry:[0,5,0]});settle();assert(controller.isWalking());assert.equal(controls.enabled,false);for(const id of floorIds.slice(2))assert.equal(scene.getObjectByName(id).visible,true);scene.traverse(o=>{if(o.isMesh)assert.equal(o.material.clippingPlanes.length,0);});const entries=globalThis.__walkEntries;controller.selectFloor('superior');settle();assert.equal(globalThis.__walkEntries,entries,'Repeated floor reset walk position');controller.selectFloor('terreo');settle();assert.equal(globalThis.__walkEntries,entries+1);controller.exitWalk();settle();assert(!controller.isWalking());assert(controls.enabled);assert(same(beforeWalk,pose()),'Exit must restore exact orbit pose');assert.equal(frames.size,0);console.log('PASS: walker integration restores orbit, reveals all floors, disables clipping, avoids repeated floor transfer. Walker interface stub + real OrbitControls.');
// Final-polish states: ready controls, real fullscreen event label, failed GLB returns no API.
assert.equal(ids['model-host'].dataset.modelState,'ready');assert(buttons.every(b=>b.disabled===false));assert.equal(ids.reset.disabled,false);
doc.fullscreenElement=ids['model-frame'];doc.fire('fullscreenchange');assert.equal(ids.fullscreen.textContent,'Sair da tela cheia');doc.fullscreenElement=null;doc.fire('fullscreenchange');assert.equal(ids.fullscreen.textContent,'Tela cheia');
const load=Loader.prototype.loadAsync;Loader.prototype.loadAsync=async()=>{throw new Error('Intentional fixture failure')};const error=console.error;console.error=()=>{};const failed=await mountFinalModel(config);console.error=error;Loader.prototype.loadAsync=load;assert.equal(failed,null);assert.equal(ids['model-host'].dataset.modelState,'failed');assert(buttons.every(b=>b.disabled===true));assert.equal(ids.reset.disabled,true);assert(ids['model-status'].textContent.includes('Recarregue'));
console.log('PASS: ready/failed disabled controls, fullscreen label state, model-load failure returns null instead of a false-success API.');
