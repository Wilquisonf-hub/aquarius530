import fs from 'node:fs/promises';import path from 'node:path';import crypto from 'node:crypto';import {fileURLToPath} from 'node:url';
export async function validate(){
 const manifest=JSON.parse(await fs.readFile('public-assets.json','utf8'));
 if(manifest.revision!=='F04'||!manifest.ready)throw new Error('F04 asset manifest not ready');
 const files=new Set(manifest.files);if(files.size!==manifest.files.length)throw new Error('Duplicate public path');
 for(const f of files){if(f.startsWith('/')||f.includes('..')||/(^|\/)\./.test(f)||/originals|credentials|reports-internal/.test(f))throw new Error('Unsafe public path: '+f);const st=await fs.stat(f);if(!st.isFile())throw new Error('Not a file: '+f);}
 const c=JSON.parse(await fs.readFile('assets/final/catalog.json','utf8'));
 if(!c.ready||c.revision!=='F04'||Object.keys(c.model.floors).length!==4)throw new Error('Incomplete catalog');
 const refs=[];function scan(v){if(typeof v==='string'&&v.startsWith('assets/'))refs.push(v);else if(Array.isArray(v))v.forEach(scan);else if(v&&typeof v==='object')Object.values(v).forEach(scan);}scan(c);
 for(const p of refs)if(!files.has(p))throw new Error('Catalog reference excluded from public build: '+p);
 for(const p of files){if(!/\.(html|js|css)$/.test(p)||p.startsWith('vendor/'))continue;const body=await fs.readFile(p,'utf8');if(/R15|r15-|property\.street|chatgpt\.com\/c\//.test(body))throw new Error('Stale/private content: '+p);}
 for(const p of files){if(!/\.(html|js|css)$/.test(p))continue;const body=await fs.readFile(p,'utf8');const relative=[...body.matchAll(/(?:from\s*|import\s*)['"](\.[^'"]+)['"]/g)].map(m=>m[1]);if(p.endsWith('.html'))relative.push(...[...body.matchAll(/(?:src|href)=['"]([^'"#]+)['"]/g)].map(m=>m[1]).filter(x=>!x.includes(':')));if(p.endsWith('.css'))relative.push(...[...body.matchAll(/url\(['"]?([^)'"]+)['"]?\)/g)].map(m=>m[1]));for(const ref of relative){const dest=path.posix.normalize(path.posix.join(path.posix.dirname(p),ref.split('?')[0].split('#')[0]));if(!files.has(dest))throw new Error('Missing static dependency '+p+' → '+dest);}}
 const glb=await fs.readFile(c.model.url),len=glb.readUInt32LE(12),json=JSON.parse(glb.subarray(20,20+len).toString());
 if(glb.toString('utf8',0,4)!=='glTF')throw new Error('Invalid GLB');const names=new Set(json.nodes.map(n=>n.name));for(const n of c.model.requiredNodes)if(!names.has(n))throw new Error('Missing required model node: '+n);
 const hash=crypto.createHash('sha256').update(glb).digest('hex');if(c.model.sha256!==hash)throw new Error('Final model digest mismatch');
 for(const floor of Object.values(c.model.floors)){if(floor.range.length!==2||floor.range[0]>=floor.range[1])throw new Error('Bad clipping range');for(const n of floor.groups)if(!names.has(n))throw new Error('Missing floor group '+n);}
 console.log('PASS: catalog, four floors, clipping bands, model identity, required nodes, asset whitelist, no stale/private content.');return manifest;
}
if(process.argv[1]===fileURLToPath(import.meta.url))await validate();
