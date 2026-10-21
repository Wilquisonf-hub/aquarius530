import fs from 'node:fs';import assert from 'node:assert/strict';import vm from 'node:vm';
const source=fs.readFileSync('src/final-page.js','utf8'),html=fs.readFileSync('index.html','utf8');
const nodes={'#plan-less':{},'#plan-more':{}};const context={document:{querySelector:s=>nodes[s]},large:{style:{}}};vm.createContext(context);
const definition=source.match(/const setZoom=z=>\{[^\n]+?\};/)[0];vm.runInContext('let zoom=1;'+definition+';globalThis.zoomTo=setZoom;',context);
context.zoomTo(1);assert(nodes['#plan-less'].disabled);assert(!nodes['#plan-more'].disabled);context.zoomTo(5);assert(!nodes['#plan-less'].disabled);assert(nodes['#plan-more'].disabled);context.zoomTo(9);assert.equal(context.large.style.width,'500%');context.zoomTo(-1);assert.equal(context.large.style.width,'100%');
assert(!/F03/.test(html));assert(!/F03/.test(fs.readFileSync('src/final-model.js','utf8')));assert(html.includes('Restaurar perspectiva'));assert(html.includes('Modelo 3D'));
for(const path of ['src/final-page.js','src/presentation-f02.css','src/room-navigation.css'])assert(html.includes(path+'?v=f04-polish1'));
for(const [,ref] of html.matchAll(/(?:src|href)="([^"#]+)"/g)){if(ref.includes(':'))continue;assert(fs.existsSync(ref.split(/[?#]/)[0]),ref);}
for(const [,ref]of source.matchAll(/from '([^']+)'/g))assert(fs.existsSync(new URL(ref.split(/[?#]/)[0],new URL('../src/final-page.js',import.meta.url))),ref);
console.log('PASS: zoom bounds/disabled states, F04 copy, descriptive labels, cache-busted references resolve. Source/extracted-function checks, not browser rendering.');
