import fs from 'node:fs/promises';
import {GLTFLoader} from '../vendor/GLTFLoader.js';
import * as THREE from '../vendor/three.module.js';
const c=JSON.parse(await fs.readFile('assets/final/catalog.json','utf8'));
const data=await fs.readFile(c.model.url);const gltf=await new Promise((resolve,reject)=>new GLTFLoader().parse(data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength),'',resolve,reject));
gltf.scene.updateMatrixWorld(true);
const result={revision:c.revision,requiredNodes:[],floorBands:[],shellCount:0};
gltf.scene.traverse(o=>{if(o.name==='FACHADA_EXTERIOR_UNIFICADA')result.shellCount++;});if(result.shellCount!==1)throw Error('Expected one canonical facade');
for(const name of c.model.requiredNodes){const n=gltf.scene.getObjectByName(name);if(!n)throw Error('Missing '+name);const box=new THREE.Box3().setFromObject(n);result.requiredNodes.push({name,bounds:[box.min.toArray(),box.max.toArray()]});}
const shell=gltf.scene.getObjectByName('FACHADA_EXTERIOR_UNIFICADA');const fullBox=new THREE.Box3().setFromObject(shell);
for(const [id,floor] of Object.entries(c.model.floors)){const [lo,hi]=floor.range;if(fullBox.min.y>=hi||fullBox.max.y<=lo)throw Error('Facade does not intersect '+id);const planes=[new THREE.Plane(new THREE.Vector3(0,1,0),-lo),new THREE.Plane(new THREE.Vector3(0,-1,0),hi)];const point=new THREE.Vector3(0,(lo+hi)/2,0);if(planes.some(p=>p.distanceToPoint(point)<0))throw Error('Clipping planes reject floor interior');if(planes.every(p=>p.distanceToPoint(new THREE.Vector3(0,hi+1,0))>=0))throw Error('Clip failed above floor');result.floorBands.push({id,range:floor.range,valid:true});}
console.log(JSON.stringify(result,null,2));
