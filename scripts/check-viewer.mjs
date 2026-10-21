import fs from 'node:fs/promises';
const model=await fs.readFile('src/final-model.js','utf8'),page=await fs.readFile('src/final-page.js','utf8'),html=await fs.readFile('index.html','utf8');
for(const pattern of ['IntersectionObserver','visibilitychange','requestAnimationFrame(draw)','mobile?1:1.5','const materials=new Set()'])if(!model.includes(pattern))throw Error('Missing viewer optimization '+pattern);
if(model.includes('setAnimationLoop'))throw Error('Unconditional animation loop returned');
for(const id of ['original-plans','plan-dialog','plan-large','plan-scroll','plan-full','plan-close','plan-less','plan-more','model-host','model-status','floor-scope'])if(!html.includes(`id="${id}"`))throw Error('Missing interface element '+id);
if(!html.includes('data-floor="exteriores"'))throw Error('Exterior selector absent');
if(!page.includes('loading="lazy"')&&!page.includes('loading=\\"lazy\\"'))throw Error('Originals must load lazily');
if(!page.includes('dialog.showModal()'))throw Error('Native accessible zoom dialog absent');
console.log('PASS: render demand/pause/DPR/material invalidation, exterior controls, lazy original thumbnails, native zoom dialog. Not a device FPS benchmark.');
