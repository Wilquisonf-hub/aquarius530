import {mountRoomNavigation} from './room-navigation.js?v=f04-polish1';
import {mountFinalModel} from './final-model.js?v=f04-polish1';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safe=p=>{if(typeof p!=='string'||!/^assets\/[a-zA-Z0-9_./-]+$/.test(p)||p.includes('..'))throw new Error('Invalid public path');return p;};
let assetVersion='';
const asset=p=>safe(p)+(assetVersion?'?v='+encodeURIComponent(assetVersion):'');
const repositoryArchive='https://github.com/Wilquisonf-hub/aquarius530/archive/refs/heads/main.zip';
const downloadHref=p=>p===repositoryArchive?p:asset(p);
const link=f=>`<a href="${downloadHref(f.path)}" ${f.download?'download':''}>${esc(f.label)} ↗</a>`;
let controller,pending;
document.addEventListener('click',event=>{const a=event.target.closest('[data-select]');if(a){pending=a.dataset.select;controller?.selectFloor(pending);}});
for(const b of document.querySelectorAll('[data-hero]'))b.onclick=()=>{const photo=b.dataset.hero==='photo';document.querySelector('#hero-image').src=photo?'assets/photos/IMG_2770.jpeg':'assets/studies/facade-toscana-study-v2.webp';document.querySelector('#hero-image').alt=photo?'Fotografia real da fachada existente da casa.':'Estudo visual Toscana gerado por IA sobre a fotografia da casa; não aprovado.';document.querySelector('#hero-source').textContent=photo?'FOTOGRAFIA REAL · SITUAÇÃO EXISTENTE':'ESTUDO VISUAL POR IA · NÃO APROVADO';document.querySelector('#hero-label').textContent=photo?'FACHADA / REGISTRO FOTOGRÁFICO':'ESTUDO DE MATERIAIS + JARDIM';for(const btn of document.querySelectorAll('[data-hero]')){btn.classList.toggle('selected',btn===b);btn.setAttribute('aria-pressed',String(btn===b));}};
try{
 const r=await fetch('assets/final/catalog.json',{cache:'no-store'});if(!r.ok)throw new Error('Catalog unavailable');const c=await r.json();if(c.revision!=='F04'||!c.ready)throw new Error('Final package not ready');assetVersion=c.model.sha256;
 document.querySelector('#model-downloads').innerHTML=c.modelDownloads.map(link).join('');
 document.querySelector('#plan-grid').innerHTML=c.plans.map(p=>`<article class="plan-card"><a href="${asset(p.preview)}" aria-label="Abrir planta de ${esc(p.label)}"><img loading="lazy" src="${asset(p.preview)}" alt="Planta vetorial de ${esc(p.label)}"></a><h3>${esc(p.label)}</h3><p>${esc(p.note)}</p><div class="download-row">${p.files.map(link).join('')}<a href="#live-model" data-select="${esc(p.id)}">Ver no modelo ↗</a></div></article>`).join('');
 const figures=items=>items.map(p=>`<figure><a href="${asset(p.path)}"><img loading="lazy" src="${asset(p.path)}" alt="${esc(p.alt)}"></a><figcaption><strong>${esc(p.label)}</strong>${esc(p.note)}</figcaption></figure>`).join('');
 document.querySelector('#original-plans').innerHTML=(c.originalPlans||[]).map(g=>`<section class="original-group"><h3>${esc(g.label)}</h3><div class="photo-grid">${g.images.map(p=>`<figure><a href="${asset(p.path)}" data-original="${asset(p.path)}" data-title="${esc(p.label)}"><img loading="lazy" decoding="async" src="${asset(p.thumbnail)}" alt="${esc(p.label)}"></a><figcaption><strong>${esc(p.label)}</strong>${esc(p.note)}<br><a href="${asset(p.path)}" target="_blank" rel="noopener">Abrir imagem completa ↗</a></figcaption></figure>`).join('')}</div></section>`).join('');
 const dialog=document.querySelector('#plan-dialog'),large=document.querySelector('#plan-large');let zoom=1;
 const setZoom=z=>{zoom=Math.max(1,Math.min(5,z));large.style.width=(zoom*100)+'%';document.querySelector('#plan-less').disabled=zoom<=1;document.querySelector('#plan-more').disabled=zoom>=5;};
 document.querySelector('#plan-close').onclick=()=>dialog.close();document.querySelector('#plan-less').onclick=()=>setZoom(zoom-.5);document.querySelector('#plan-more').onclick=()=>setZoom(zoom+.5);
 document.querySelector('#original-plans').addEventListener('click',e=>{const a=e.target.closest('[data-original]');if(!a)return;e.preventDefault();document.querySelector('#plan-dialog-title').textContent=a.dataset.title;large.src=a.dataset.original;large.alt=a.dataset.title;document.querySelector('#plan-full').href=a.dataset.original;setZoom(1);dialog.showModal();});
 large.ondblclick=()=>setZoom(zoom===1?2:1);
 document.querySelector('#photo-grid').innerHTML=figures(c.photos);document.querySelector('#render-gallery').innerHTML=figures(c.renders||[]);
 document.querySelector('#review-downloads').innerHTML=(c.reports||[]).map(link).join('');
 await mountRoomNavigation(c,()=>controller).catch(e=>{document.querySelector('#ambientes').innerHTML='<p>O catálogo de ambientes não pôde ser carregado. As plantas, os downloads e o modelo seguem disponíveis. Recarregue a página para tentar novamente.</p>';console.error(e);});
 controller=await mountFinalModel(c.model);if(pending)controller?.selectFloor(pending);
}catch(e){document.querySelector('#model-host').dataset.modelState='failed';document.querySelector('#model-status').textContent='Não foi possível carregar os arquivos da casa. Recarregue a página para tentar novamente.';for(const id of ['ambientes','downloads'])document.querySelector('#'+id).innerHTML='<p>Arquivos indisponíveis nesta sessão. Recarregue a página para tentar novamente.</p>';document.querySelector('#plan-grid').innerHTML='<p class="failed">Arquivos atuais indisponíveis nesta sessão. Recarregue a página para tentar novamente.</p>';console.error(e);}
