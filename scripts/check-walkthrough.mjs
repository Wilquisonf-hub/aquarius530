import fs from 'node:fs';import assert from 'node:assert/strict';import * as THREE from '../vendor/three.module.js';import {GLTFLoader} from '../vendor/GLTFLoader.js';import {createCollisionWorld} from '../src/walkthrough-physics.js';import {FLOOR_SPAWNS,isEditing} from '../src/walkthrough.js';
const c=JSON.parse(fs.readFileSync('assets/final/catalog.json'));const data=fs.readFileSync(c.model.url);const {scene}=await new Promise((r,j)=>new GLTFLoader().parse(data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength),'',r,j));const w=createCollisionWorld(scene);const result={revision:c.revision,meshes:w.meshes,spawns:{},routes:{}};
for(const [id,eye]of Object.entries(FLOOR_SPAWNS)){const p=w.spawn(eye);assert(p,`No safe spawn ${id}`);assert(w.clear(p));result.spawns[id]=p.toArray();}
function route(name,start,points){let p=new THREE.Vector3(...start);assert(w.grounded(p),'Unsupported route start '+name);let trace=[p.toArray()];for(const [x,z]of points){p=w.move(p,x-p.x,z-p.z);trace.push(p.toArray());}result.routes[name]=trace;return p;}
let p=route('main-up',[.6,.35,-6.3],[[.6,-9.2],[-.6,-9.2],[-.6,-6.2]]);assert(p.y>3.5,'Main staircase ascent blocked '+p.toArray());p=route('main-down',p.toArray(),[[-.6,-9.2],[.6,-9.2],[.6,-6.3]]);assert(p.y<.4,'Main staircase descent blocked');
p=route('garage-up',[.6,-2.35,-1.05],[[.6,-.3],[-.7,-.3],[-.7,-3.2],[1.8,-3.2]]);assert(p.y>.3,'Garage ascent blocked');p=route('garage-down',p.toArray(),[[-.7,-3.2],[-.7,-.3],[.6,-.3],[.6,-1.35]]);assert(p.y< -2.3,'Garage descent blocked');
p=route('lateral-up',[13.9,-1.8625,-11.15],[[17.4,-11.15]]);assert(p.y>.19,'Lateral ascent blocked');p=route('lateral-down',p.toArray(),[[13.9,-11.15]]);assert(p.y< -1.8,'Lateral descent blocked');
result.roomTransfers=[];for(const room of JSON.parse(fs.readFileSync('assets/final/rooms.json')).rooms.filter(r=>r.navigable!==false)){const p=w.spawn(room.entry,room.bounds);assert(p,'Unsafe room '+room.id);result.roomTransfers.push({id:room.id,position:p.toArray()});}

p=route('lateral-complete-up',[12.2,-2.63,-11.2],[[13.1,-11.2],[13.5,-11.2],[13.9,-11.2],[17.4,-11.2]]);assert(p.y>.19&&p.x>17.3,'Complete lateral access blocked');p=route('lateral-complete-down',p.toArray(),[[12.2,-11.2]]);assert(p.x<12.3&&p.y< -2.5,'Complete lateral descent blocked');
const rooms=JSON.parse(fs.readFileSync('assets/final/rooms.json')).rooms;
const paths={'superior-dormitorio-1':[[6.934,-5.8],[6.934,-8.3]],'superior-dormitorio-2':[[7.2,-5.8],[7.2,-3.15],[8.2,-3.15],[9.584,-4.5]],'superior-dormitorio-3':[[-.55,-5.8],[-.55,-4.5],[.3,-4.5],[.3,-3.8],[1.234,-2.45]],'superior-dormitorio-4':[[-.6,-5.8],[-.6,-3.3],[-3,-3.3],[-4.266,-1.9]]};
for(const [id,waypoints] of Object.entries(paths)){const start=w.spawn(rooms.find(r=>r.id==='superior-circulacao').entry),goal=rooms.find(r=>r.id===id).entry;const p=route('corridor-to-'+id,start.toArray(),waypoints);assert(Math.hypot(p.x-goal[0],p.z-goal[2])<.05,'Doorway entry blocked '+id);}

// Swept move must stop at facade, and cannot tunnel through it even on a large requested step.
p=w.spawn([-3,1.95,-1]);const q=w.move(p,-40,0);assert(q.x> -6,'Facade tunneling');assert(w.support(50,50,.35)===null,'Missing floor accepted');assert(w.move(p,0,0).distanceTo(p)<.001);
assert(isEditing({closest:()=>true}));assert(!isEditing({closest:()=>null}));
console.log(JSON.stringify(result,null,2));
