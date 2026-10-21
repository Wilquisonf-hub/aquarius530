import * as THREE from '../vendor/three.module.js';
// Conservative kinematic pedestrian: bounded substeps, step support and radial body clearance.
// It intentionally stops at closed geometry, missing floors and unverified routes.
export function createCollisionWorld(model){
 model.updateMatrixWorld(true);
 const meshes=[],ray=new THREE.Raycaster(),up=new THREE.Vector3(0,1,0),down=new THREE.Vector3(0,-1,0),normal=new THREE.Vector3();
 const material=new THREE.MeshBasicMaterial({side:THREE.DoubleSide});
 model.traverse(o=>{if(!o.isMesh)return;let names='';for(let p=o;p;p=p.parent)names+=' '+p.name;
  if(/AGUA|VEGETACAO|R05_ABERTURA/i.test(names))return;
  const mesh=new THREE.Mesh(o.geometry,material);mesh.matrixAutoUpdate=false;mesh.matrixWorld.copy(o.matrixWorld);mesh.userData.box=new THREE.Box3().setFromObject(o);mesh.userData.source=o;meshes.push(mesh);
 });
 function cast(origin,direction,far){ray.set(origin,direction);ray.near=.001;ray.far=far;return ray.intersectObjects(meshes.filter(m=>ray.ray.intersectsBox(m.userData.box)),false);}
 function support(x,z,feet,maxStep=.25,maxDrop=.3){
  const hits=cast(new THREE.Vector3(x,feet+maxStep+.015,z),down,maxStep+maxDrop+.04);
  for(const h of hits){normal.copy(h.face.normal).transformDirection(h.object.matrixWorld);if(normal.y>.65&&h.point.y<=feet+maxStep+.02&&h.point.y>=feet-maxDrop-.02)return h.point.y;}return null;
 }
 const radius=.16,height=1.68;
 function clear(p){
  for(const h of [.30,.85,1.5])for(let k=0;k<8;k++){const a=k*Math.PI/4;if(cast(new THREE.Vector3(p.x,p.y+h,p.z),new THREE.Vector3(Math.cos(a),0,Math.sin(a)),radius).length)return false;}
  return !cast(new THREE.Vector3(p.x,p.y+.3,p.z),up,height-.3).length;
 }
 function grounded(p){const y=support(p.x,p.z,p.y);if(y===null)return null;const q=new THREE.Vector3(p.x,y,p.z);return clear(q)?q:null;}
 function move(p,dx,dz){const count=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.055));let q=p.clone();
  for(let i=0;i<count;i++){const nx=dx/count,nz=dz/count;const full=grounded(new THREE.Vector3(q.x+nx,q.y,q.z+nz));if(full){q=full;continue;}
   const x=grounded(new THREE.Vector3(q.x+nx,q.y,q.z));if(x)q=x;const z=grounded(new THREE.Vector3(q.x,q.y,q.z+nz));if(z)q=z;
  }return q;
 }
 function spawn(eye,bounds){const p=new THREE.Vector3(eye[0],eye[1]-1.6,eye[2]);for(const r of [0,.25,.5,.8,1.2])for(let k=0;k<(r?16:1);k++){const a=k*Math.PI/8;const q=grounded(new THREE.Vector3(p.x+r*Math.cos(a),p.y,p.z+r*Math.sin(a)));if(q&&(!bounds||(q.x>=bounds.min[0]&&q.x<=bounds.max[0]&&q.z>=bounds.min[2]&&q.z<=bounds.max[2])))return q;}return null;}
 return {support,clear,grounded,move,spawn,meshes:meshes.length,radius,height};
}
