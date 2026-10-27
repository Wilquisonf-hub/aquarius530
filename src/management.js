const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
const asset = path => {
  if (typeof path !== 'string' || !/^assets\/[a-zA-Z0-9_./-]+$/.test(path) || path.includes('..')) throw Error('Invalid management source');
  return path;
};
const views = [
  ['resumo', 'Resumo'], ['rooftop', 'Etapa 1 · Rooftop'], ['decisoes', 'Decisões'],
  ['materiais', 'Materiais'], ['prestadores', 'Prestadores'], ['diario', 'Diário / fotos']
];
const badge = value => `<span class="work-status">${esc(value)}</span>`;
const pair = (label, value, wide = false) => `<div${wide ? ' class="work-wide"' : ''}><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`;
const list = values => `<ul>${values.map(v => `<li>${esc(v)}</li>`).join('')}</ul>`;
const host = document.querySelector('#management-content');

async function mountManagement() {
  const response = await fetch('assets/management/rooftop.json?v=rooftop1', {cache:'no-store'});
  if (!response.ok) throw Error('Management data unavailable');
  const data = await response.json();
  if (data.version !== 1 || !Array.isArray(data.packages) || !data.packages.length) throw Error('Invalid management data');
  const sources = new Map(data.sources.map(source => [source.id, source]));
  const packages = new Map(data.packages.map(item => [item.id, item]));
  const sourceLinks = ids => `<div class="work-source-links">${ids.map(id => {
    const source = sources.get(id);
    return source ? `<a href="${asset(source.path)}" target="_blank" rel="noopener">${esc(source.label)} ↗</a>` : '';
  }).join('')}</div>`;
  const evidence = items => items.length ? items.join(' · ') : 'A registrar · nenhuma evidência de execução ou aceite recebida.';
  const intro = (eyebrow, title, text) => `<div class="work-panel-intro"><div><span class="work-label">${esc(eyebrow)}</span><h3>${esc(title)}</h3><p>${esc(text)}</p></div></div>`;
  const jump = (view, text, target = '') => `<a class="work-link" href="#gestao-${view}" data-work-view="${view}"${target ? ` data-work-target="${esc(target)}"` : ''}>${esc(text)} <span aria-hidden="true">↗</span></a>`;
  const summary = `<div class="work-summary"><article class="work-stage"><span class="work-label">ETAPA ${esc(data.stage.number)} / FOCO ATUAL</span><h3 class="work-stage-name">${esc(data.stage.title)}.</h3>${badge(data.stage.status)}<p style="margin-top:18px">${esc(data.stage.summary)}</p><dl class="work-facts">${pair('Início previsto', data.stage.start)}${pair('Contratação', data.stage.hiring)}</dl>${jump('rooftop', 'Consultar os 6 pacotes de serviço')}</article><div><span class="work-label">PRÓXIMAS DEFINIÇÕES</span><h3>Decidir para avançar.</h3><ul class="work-next-list">${data.decisions.slice(0, 3).map(d => `<li><a href="#gestao-decisoes" data-work-view="decisoes" data-work-target="decisao-${esc(d.id)}"><span>${esc(d.title)}</span><span aria-hidden="true">↗</span></a></li>`).join('')}</ul>${jump('decisoes', 'Ver as 5 decisões em aberto')}</div></div><div class="work-context"><div><h4>Antes de executar</h4><p>${esc(data.stage.nextStep)}</p></div><div><h4>Materiais em conferência</h4><p>6 itens provisórios. Especificações, compras e recebimentos a confirmar.</p>${jump('materiais', 'Conferir a lista')}</div><div><h4>Registros da obra</h4><p>${esc(data.diaryNote)}</p>${jump('diario', 'Consultar diário e referências')}</div></div>`;
  const rooftop = `${intro('SEQUÊNCIA DE PLANEJAMENTO', 'Etapa 1 · Rooftop', 'Seis pacotes de serviço, com dependências e critérios a definir. A ordem depende do escopo e do sistema aprovados; abrir um pacote não autoriza sua execução.')}<p class="work-notice">${esc(data.stage.technicalNote)} ${esc(data.stage.scopeNote)}</p><div class="work-filter"><label for="work-status-filter">Filtrar serviços por situação<select id="work-status-filter"><option value="todos">Todas as situações</option>${data.statuses.map(s => `<option value="${esc(s)}">${esc(s)}</option>`).join('')}</select></label><p class="work-result" id="work-result" role="status" aria-live="polite"></p></div><div id="work-packages">${data.packages.map((item, index) => `<details class="work-package" id="servico-${esc(item.id)}" data-work-status="${esc(item.status)}"${index === 0 ? ' open' : ''}><summary><span class="work-package-title"><span class="work-package-number">${esc(item.number)}</span><span><strong>${esc(item.title)}</strong><small>${esc(item.location)}</small></span></span>${badge(item.status)}</summary><div class="work-package-body"><p>${esc(item.scope)}</p><dl class="work-meta">${pair('Responsável pelo serviço', item.responsible)}${pair('Prazo', item.deadline)}${pair('Depende de', item.dependencies.length ? item.dependencies.map(id => packages.get(id)?.title || id).join(' · ') : 'Definição inicial do escopo e levantamento em campo.')}${pair('Impedimento atual', item.blocker)}${pair('Critério de aceite / conferência', item.acceptance, true)}${pair('Evidência e aceite', evidence(item.evidence), true)}</dl>${sourceLinks(item.sourceIds)}</div></details>`).join('')}<p class="work-no-results" id="work-no-results" hidden>Nenhum serviço registrado nesta situação. Todos os pacotes começam em “A definir”. Escolha outra situação para consultar o planejamento.</p></div><p class="work-notice">A regularização da base e os caimentos antecedem a impermeabilização conforme o sistema especificado. A proteção mecânica ou contrapiso superior, quando previsto, vem após teste e aceite. Layout, ancoragens e passagens precisam estar compatibilizados antes da aplicação.</p><span class="work-label">SITUAÇÕES DO REGISTRO · IMPEDIMENTOS SÃO INFORMADOS À PARTE</span><div class="work-states">${data.statuses.map(s => `<span>${esc(s)}</span>`).join('')}</div>`;
  const decisions = `${intro('PENDÊNCIAS / ETAPA 1', 'O que precisa ser definido.', 'Responsabilidade, prazo e evidência acompanham cada decisão. As pendências abaixo ainda não têm aprovação registrada.')}<ol class="work-decision-list">${data.decisions.map(d => `<li class="work-decision" id="decisao-${esc(d.id)}"><span>${esc(d.number)}</span><div><div class="work-decision-head"><h4>${esc(d.title)}</h4>${badge(d.status)}</div><p>${esc(d.detail)}</p><dl class="work-meta">${pair('Quem define / valida', d.owner)}${pair('Prazo', d.deadline)}${pair('Orienta os serviços', d.unlocks.map(id => packages.get(id)?.title || id).join(' · '), true)}${pair('Registro da decisão', d.evidence.length ? d.evidence.join(' · ') : 'A registrar · decisão ainda sem evidência de aprovação.', true)}</dl></div></li>`).join('')}</ol>`;
  const materials = `${intro('LISTA PROVISÓRIA / SEM LIBERAÇÃO DE COMPRA', 'Conferir antes de comprar.', data.materialsNote)}<div class="work-materials">${data.materials.map(m => `<article class="work-material"><div class="work-material-head"><div><span class="work-label">QUANTIDADE INFORMADA</span><h4>${esc(m.name)}</h4></div><div class="work-material-quantity">${esc(m.quantity)}<small>${esc(m.unit)}</small></div></div><dl class="work-meta">${pair('Especificação', m.specification, true)}${pair('Responsável pela compra', m.buyer)}${pair('Recebido', m.received === null ? 'A confirmar · não informado' : m.received)}${pair('Situação', m.status)}</dl><p>${esc(m.note)}</p></article>`).join('')}</div><p class="work-notice">A lista não define um sistema de impermeabilização. Piso acabado, painéis do boiler, cozinha molhada e pergolado exigem detalhamento próprio e confirmação de inclusão no escopo.</p>`;
  const contractors = `${intro('PAPÉIS / CONTRATAÇÃO A CONFIRMAR', 'Quem faz. Quem confere.', 'Os responsáveis serão identificados após definição de escopo e contratação. Uma proposta recebida ainda precisa de conferência.')}<div class="work-roles">${data.contractors.map(c => `<article class="work-role">${badge(c.status)}<h4>${esc(c.role)}</h4><p>${esc(c.scope)}</p><dl class="work-meta">${pair('Responsável', c.name)}${pair('Próxima definição', c.nextStep)}</dl></article>`).join('')}</div><span class="work-label">RESPONSABILIDADES NO PROJETO</span><div class="work-context">${data.responsibilities.map(r => `<div><h4>${esc(r.role)}</h4><p>${esc(r.scope)}</p></div>`).join('')}</div><p class="work-notice">${esc(data.stage.managementNote)}</p>`;
  const photos = ['foto-volumes', 'foto-paineis', 'planta-rooftop'].map(id => sources.get(id));
  const diary = `${intro('DIÁRIO / EVIDÊNCIAS', 'Cada serviço, um registro.', 'O planejamento e a execução física têm registros separados. Novos relatos devem indicar local, serviço, responsável, data informada, fotografia e conferência.')}<div class="work-diary"><div class="work-empty"><span class="work-label">EXECUÇÃO FÍSICA</span><h4>Nenhum relato de obra registrado.</h4><p>${esc(data.diaryNote)}</p><p style="margin-top:16px">O próximo registro depende de informações e evidências recebidas da obra.</p></div><div>${data.planningMilestones.map(m => `<article class="work-milestone"><span class="work-label">${esc(m.type)} · </span><time datetime="${esc(m.date)}">${esc(m.date.split('-').reverse().join('/'))}</time><h4>${esc(m.title)}</h4><p>${esc(m.detail)}</p></article>`).join('')}</div></div><div class="work-source-heading"><h4>Base para localizar e conferir.</h4><p>Fotografias existentes e planta aproximada. Referências de contexto, sem comprovação de avanço da Etapa 1.</p></div><div class="work-photos">${photos.map(s => `<figure><a href="${asset(s.path)}" target="_blank" rel="noopener"><img src="${asset(s.path)}" loading="lazy" decoding="async" alt="${esc(s.label)} · ${esc(s.type)}"></a><figcaption>${esc(s.label)} ↗<small>${esc(s.type)} · ${esc(s.note)}</small></figcaption></figure>`).join('')}</div>${sourceLinks(['planta-historica', 'foto-veneziana', 'foto-recuos'])}`;
  const content = {resumo:summary, rooftop, decisoes:decisions, materiais:materials, prestadores:contractors, diario:diary};
  host.innerHTML = `<div class="work-tabs" role="tablist" aria-label="Áreas de gestão da obra">${views.map(([id, label], index) => `<button type="button" role="tab" id="tab-gestao-${id}" aria-controls="gestao-${id}" aria-selected="${index === 0}" tabindex="${index === 0 ? 0 : -1}" data-work-tab="${id}"><span aria-hidden="true">${String(index + 1).padStart(2, '0')}</span>${label}</button>`).join('')}</div>${views.map(([id], index) => `<div class="work-panel" role="tabpanel" id="gestao-${id}" aria-labelledby="tab-gestao-${id}" tabindex="0"${index ? ' hidden' : ''}>${content[id]}</div>`).join('')}<div class="work-maintenance"><p>${esc(data.stage.managementNote)} Atualizações são organizadas a partir dos registros fornecidos; a conferência técnica cabe ao profissional responsável.</p><span>BASE DE PLANEJAMENTO<br>27 OUT 2026</span></div>`;
  const tabs = [...host.querySelectorAll('[data-work-tab]')];
  const panels = [...host.querySelectorAll('[role="tabpanel"]')];
  function selectView(id, {writeURL = true, focus = false} = {}) {
    if (!views.some(([view]) => view === id)) return;
    tabs.forEach(tab => {
      const selected = tab.dataset.workTab === id;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      if (selected && focus) tab.focus({preventScroll:true});
    });
    panels.forEach(panel => { panel.hidden = panel.id !== `gestao-${id}`; });
    if (writeURL) {
      const url = new URL(location.href);
      url.searchParams.set('gestao', id);
      url.hash = `gestao-${id}`;
      history.pushState(null, '', url);
    }
  }
  function route() {
    const hash = location.hash.slice(1);
    const hashView = hash.startsWith('gestao-') ? hash.slice(7) : '';
    const id = views.some(([view]) => view === hashView) ? hashView : new URLSearchParams(location.search).get('gestao');
    selectView(id || 'resumo', {writeURL:false});
  }
  host.addEventListener('click', event => {
    const tab = event.target.closest('[data-work-tab]');
    if (tab) { selectView(tab.dataset.workTab); return; }
    const link = event.target.closest('[data-work-view]');
    if (!link) return;
    event.preventDefault();
    selectView(link.dataset.workView);
    const target = link.dataset.workTarget ? document.getElementById(link.dataset.workTarget) : document.getElementById(`gestao-${link.dataset.workView}`);
    target?.scrollIntoView({behavior:'instant', block:'start'});
    if (target?.getAttribute('role') === 'tabpanel') target.focus({preventScroll:true});
    else { target?.setAttribute('tabindex', '-1'); target?.focus({preventScroll:true}); }
  });
  host.querySelector('[role="tablist"]').addEventListener('keydown', event => {
    const index = tabs.indexOf(event.target);
    if (index < 0) return;
    let next;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    else if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = tabs.length - 1;
    else return;
    event.preventDefault();
    selectView(tabs[next].dataset.workTab, {focus:true});
  });
  const filter = host.querySelector('#work-status-filter');
  const packageNodes = [...host.querySelectorAll('[data-work-status]')];
  function applyFilter() {
    let count = 0;
    packageNodes.forEach(node => {
      node.hidden = filter.value !== 'todos' && node.dataset.workStatus !== filter.value;
      if (!node.hidden) count++;
    });
    host.querySelector('#work-result').textContent = `${count} de ${packageNodes.length} serviços · ${filter.value === 'todos' ? 'todas as situações' : filter.value}`;
    host.querySelector('#work-no-results').hidden = count !== 0;
  }
  filter.addEventListener('change', applyFilter);
  window.addEventListener('popstate', route);
  window.addEventListener('hashchange', route);
  applyFilter();
  route();
  // Dynamic panels are absent when native fragment scrolling first runs.
  if (location.hash.startsWith('#gestao-')) document.getElementById(location.hash.slice(1))?.scrollIntoView({behavior:'instant', block:'start'});
}

if (host) mountManagement().catch(error => {
  host.innerHTML = '<p class="work-notice" role="status">Não foi possível carregar o caderno de gestão nesta sessão. Recarregue a página para tentar novamente. A Etapa 1 continua em planejamento; início e contratação a confirmar.</p><a class="work-link" href="assets/management/rooftop.json">Consultar os dados de planejamento ↗</a>';
  console.error(error);
});
