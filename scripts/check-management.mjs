import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const data = JSON.parse(fs.readFileSync('assets/management/rooftop.json', 'utf8'));
const script = fs.readFileSync('src/management.js', 'utf8');
const html = fs.readFileSync('index.html', 'utf8');
const css = fs.readFileSync('src/management.css', 'utf8');
const manifest = new Set(JSON.parse(fs.readFileSync('public-assets.json', 'utf8')).files);
const statuses = ['A definir', 'Pronto para executar', 'Em execução', 'Aguardando conferência', 'Aceito'];
const viewIds = ['resumo', 'rooftop', 'decisoes', 'materiais', 'prestadores', 'diario'];

// Public planning data must keep unknowns explicit and link only reviewed sources.
assert.equal(data.version, 1);
assert.equal(data.stage.status, 'Em planejamento');
assert.equal(data.stage.start, 'A confirmar');
assert.equal(data.stage.hiring, 'A confirmar');
assert.equal(data.stage.progress, null, 'No inferred construction percentage');
assert.deepEqual(data.statuses, statuses);
assert.equal(data.packages.length, 6);
assert.equal(data.decisions.length, 5);
assert.deepEqual(data.diary, [], 'Planning is not a construction execution report');
assert(data.planningMilestones.every(m => m.type === 'Planejamento'));
assert(data.stage.managementNote.includes('centralmente'));
assert(data.stage.managementNote.includes('ainda não estão disponíveis'));
const packageIds = new Set(data.packages.map(p => p.id));
const sourceIds = new Set(data.sources.map(s => s.id));
assert.equal(packageIds.size, data.packages.length);
assert.equal(sourceIds.size, data.sources.length);
function validatePackage(item) {
  assert(statuses.includes(item.status), 'Unknown service state');
  for (const key of ['location', 'scope', 'responsible', 'deadline', 'blocker', 'acceptance']) assert.equal(typeof item[key], 'string');
  assert(Array.isArray(item.evidence));
  if (item.status === 'Aceito') {
    assert(item.evidence.length > 0, 'Accepted service requires recorded evidence');
    assert(item.acceptance.trim() && !/^A definir/.test(item.acceptance), 'Accepted service requires defined acceptance');
    assert(!/^A definir/.test(item.responsible), 'Accepted service requires a responsible professional');
  }
}
for (const item of data.packages) {
  validatePackage(item);
  assert.equal(item.status, 'A definir');
  assert.equal(item.responsible, 'A definir');
  assert.equal(item.deadline, 'A definir');
  assert.deepEqual(item.evidence, []);
  assert(item.sourceIds.length > 0);
  for (const id of item.sourceIds) assert(sourceIds.has(id), `Unknown source ${id}`);
  for (const id of item.dependencies) assert(packageIds.has(id) && id !== item.id, `Invalid dependency ${id}`);
}
assert.throws(() => validatePackage({...data.packages[0], status:'Aceito'}), /requires recorded evidence/);
for (const decision of data.decisions) {
  assert.equal(decision.status, 'A definir');
  assert.deepEqual(decision.evidence, []);
  for (const id of decision.unlocks) assert(packageIds.has(id));
}
assert.deepEqual(data.materials.map(m => [m.id, m.quantity]), [
  ['cimento', 40], ['areia', 400], ['graute', 40], ['bianco', 3], ['blocos', 350], ['sika-1', 6]
]);
for (const item of data.materials) {
  assert.equal(item.received, null, 'Unknown received quantity must not become zero');
  assert.equal(item.buyer, 'A confirmar');
  assert.equal(item.status, 'A confirmar');
  assert(/^A confirmar/.test(item.specification));
}
assert(data.materials.find(m => m.id === 'bianco').unit.includes('18 L'));
assert(data.materials.find(m => m.id === 'graute').unit.includes('confirmar'));
assert(data.contractors.every(c => c.name === 'A definir'));
assert(data.contractors.some(c => c.status === 'Proposta recebida'));

// The pergola is a quotation alternative within Rooftop, not a seventh work state.
const pergola = data.pergola;
assert.equal(pergola.status, 'Em cotação');
assert.equal(pergola.species, 'Cumaru');
assert.equal(pergola.lengthM, 4.5);
assert.equal(pergola.widthM, 3);
assert.equal(pergola.areaM2, 13.5);
assert.equal(pergola.areaM2, pergola.lengthM * pergola.widthM);
assert.equal(pergola.responsible, 'A definir');
assert.equal(pergola.deadline, 'A definir');
assert.deepEqual(pergola.pieces.map(p => [p.id, p.quantity, p.sectionCm, p.lengthM]), [
  ['pilares', 4, [15, 15], 3],
  ['vigas', 2, [8, 25], 4.5],
  ['travessas', 14, [5, 12], 3],
  ['extremidades', 2, [8, 20], 3]
]);
let pieceCount = 0, nominalVolume = 0;
for (const piece of pergola.pieces) {
  assert(Number.isInteger(piece.quantity) && piece.quantity > 0);
  assert(piece.sectionCm.length === 2 && piece.sectionCm.every(n => Number.isFinite(n) && n > 0));
  assert(Number.isFinite(piece.lengthM) && piece.lengthM > 0);
  assert(typeof piece.stockNote === 'string' && piece.stockNote.trim());
  const volume = piece.quantity * (piece.sectionCm[0] / 100) * (piece.sectionCm[1] / 100) * piece.lengthM;
  assert(Math.abs(piece.volumeM3 - volume) < 1e-9, `Incorrect nominal volume: ${piece.id}`);
  pieceCount += piece.quantity;
  nominalVolume += volume;
}
assert.equal(pergola.totalPieces, 22);
assert.equal(pergola.totalPieces, pieceCount);
assert.equal(pergola.netVolumeM3, 0.798);
assert(Math.abs(pergola.netVolumeM3 - nominalVolume) < 1e-9, 'Incorrect aggregate nominal wood volume');
assert(pergola.columnsNote.includes('R02') && /medição|medir/.test(pergola.columnsNote));
assert(/16 linhas/.test(pergola.spacingNote) && /14 travessas/.test(pergola.spacingNote));
assert(/ainda não escolhida/.test(pergola.plantNote));
assert(/validação estrutural/.test(pergola.approvalNote));
assert(/Não libera compra, corte, montagem ou execução/.test(pergola.approvalNote));
assert(/sem perdas/.test(pergola.volumeNote));
assert(Array.isArray(pergola.technicalPending) && pergola.technicalPending.length >= 4);
assert(pergola.technicalPending.every(text => typeof text === 'string' && text.trim()));
assert(pergola.technicalPending.some(text => /impermeabilização/.test(text)));
assert(pergola.technicalPending.some(text => /laje/.test(text)));
assert(pergola.technicalPending.some(text => /vento/.test(text)));
assert.deepEqual(pergola.sourceIds, ['pergola-ilustracao', 'pergola-pdf', 'pergola-docx']);
for (const id of pergola.sourceIds) {
  assert(sourceIds.has(id), `Missing pergola source: ${id}`);
  const source = data.sources.find(item => item.id === id);
  assert(source.path.startsWith('assets/management/pergola/'));
  if (id === 'pergola-ilustracao') {
    assert(/\.(png|webp|jpe?g|svg)$/.test(source.path));
    assert(/Ilustração esquemática/.test(source.type));
    assert(/Não é desenho executivo/.test(source.note), 'Illustration must not imply technical approval');
  } else {
    assert(source.path.endsWith(id === 'pergola-pdf' ? '.pdf' : '.docx'));
    assert(/cotação sem preços/.test(source.type));
  }
}
for (const source of data.sources) {
  assert(/^assets\/[a-zA-Z0-9_./-]+$/.test(source.path) && !source.path.includes('..'));
  assert(!/facade-studies|render|credentials|private|intern[oa]/i.test(source.path), 'Only documentary reference sources');
  assert(manifest.has(source.path), `Source outside public allowlist: ${source.path}`);
  assert(fs.statSync(source.path).isFile());
}
function checkPublic(value) {
  if (Array.isArray(value)) return value.forEach(checkPublic);
  if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      assert(!/^(price|prices|cost|costs|amount|currency|email|phone|contact|contacts|bank|account|signature|cpf|cnpj|preco|preços|valor|valores|telefone|contato|contatos|banco|assinatura)$/i.test(key), `Sensitive public field: ${key}`);
      checkPublic(child);
    }
  } else if (typeof value === 'string') {
    assert(!/(?:R\$|BRL\s*\d|\b[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|(?:\/Users\/|\/home\/|file:\/\/)|https?:\/\/)/i.test(value), 'Unexpected private or external data');
  }
}
checkPublic(data);
for (const path of ['src/management.js', 'src/management.css', 'assets/management/rooftop.json']) assert(manifest.has(path), path);
assert.equal((html.match(/id="management-content"/g) || []).length, 1);
assert(html.includes('src/management.js') && html.includes('src/management.css'));
assert(css.includes('[hidden]') && css.includes('focus-visible'));

// Small DOM harness: it models only the browser APIs used by this independent module.
function harness({url = 'https://example.test/aquarius530/?andar=cobertura&ambiente=cobertura-r01', failure = false, modelState = 'failed'} = {}) {
  const nodes = new Map();
  const document = {activeElement:null};
  class Element {
    constructor(tag, attrs = {}) {
      this.tagName = tag.toUpperCase(); this.attrs = {...attrs}; this.dataset = {}; this.listeners = {}; this.textContent = ''; this.scrollCalls = [];
      for (const [key, value] of Object.entries(attrs)) if (key.startsWith('data-')) this.dataset[key.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = value;
      this.id = attrs.id || ''; this.hidden = 'hidden' in attrs; this.tabIndex = Number(attrs.tabindex ?? -1); this.value = tag === 'select' ? 'todos' : '';
    }
    setAttribute(key, value) { this.attrs[key] = String(value); if (key === 'tabindex') this.tabIndex = Number(value); }
    getAttribute(key) { return this.attrs[key] ?? null; }
    addEventListener(key, callback) { (this.listeners[key] ||= []).push(callback); }
    focus() { document.activeElement = this; }
    scrollIntoView(options) { this.scrollCalls.push(options); }
    matches(selector) {
      if (selector.startsWith('#')) return this.id === selector.slice(1);
      const match = selector.match(/^\[([\w-]+)(?:="([^"]*)")?\]$/);
      return !!match && match[1] in this.attrs && (match[2] === undefined || this.attrs[match[1]] === match[2]);
    }
    closest(selector) { return this.matches(selector) ? this : null; }
  }
  const host = new Element('div', {id:'management-content'});
  let markup = '';
  Object.defineProperty(host, 'innerHTML', {get:() => markup, set(value) {
    markup = value; nodes.clear();
    for (const match of value.matchAll(/<([a-z][a-z0-9-]*)\b([^>]*)>/gi)) {
      const attrs = {};
      for (const attr of match[2].matchAll(/([\w-]+)(?:="([^"]*)")?/g)) attrs[attr[1]] = attr[2] ?? '';
      const element = new Element(match[1], attrs);
      nodes.set(element.id || `anonymous-${nodes.size}`, element);
    }
  }});
  host.querySelectorAll = selector => [...nodes.values()].filter(n => n.matches(selector));
  host.querySelector = selector => host.querySelectorAll(selector)[0] || null;
  const model = {dataset:{modelState}, innerHTML:'existing model sentinel'};
  const downloads = {innerHTML:'existing downloads sentinel'};
  document.querySelector = selector => ({'#management-content':host, '#model-host':model, '#downloads':downloads}[selector] || host.querySelector(selector));
  document.getElementById = id => nodes.get(id) || null;
  let currentURL = new URL(url);
  const location = {};
  for (const field of ['href', 'search', 'hash']) Object.defineProperty(location, field, {get:() => currentURL[field], set:value => {currentURL[field] = value;}});
  const listeners = {};
  const window = {addEventListener(key, callback) { (listeners[key] ||= []).push(callback); }};
  const historyEntries = [url]; let historyIndex = 0;
  const dispatchWindow = name => (listeners[name] || []).forEach(callback => callback());
  const history = {
    pushState(_state, _title, value) { currentURL = new URL(String(value)); historyEntries.splice(++historyIndex); historyEntries.push(currentURL.href); },
    back() { if (historyIndex) {currentURL = new URL(historyEntries[--historyIndex]); dispatchWindow('popstate');} },
    forward() { if (historyIndex < historyEntries.length - 1) {currentURL = new URL(historyEntries[++historyIndex]); dispatchWindow('popstate');} }
  };
  const errors = [];
  const context = vm.createContext({document, window, location, history, URL, URLSearchParams, console:{error:error => errors.push(error)},
    fetch:async path => { assert.equal(path, 'assets/management/rooftop.json?v=rooftop2-pergola'); return {ok:!failure, json:async() => structuredClone(data)}; }
  });
  vm.runInContext(script, context, {filename:'src/management.js'});
  const settle = async() => {for (let i = 0; i < 4; i++) await new Promise(resolve => setImmediate(resolve));};
  const event = (target, extra = {}) => ({target, prevented:false, preventDefault() {this.prevented = true;}, ...extra});
  return {host, document, model, downloads, nodes, location, history, errors, settle,
    click(target) { target.focus(); const e = event(target); (host.listeners.click || []).forEach(callback => callback(e)); return e; },
    key(target, key) {const e = event(target, {key}); (host.querySelector('[role="tablist"]').listeners.keydown || []).forEach(callback => callback(e)); return e;},
    change(target, value) {target.value = value; (target.listeners.change || []).forEach(callback => callback(event(target)));},
    dispatchWindow
  };
}
function assertView(h, id) {
  const selected = h.host.querySelectorAll('[data-work-tab]').filter(t => t.getAttribute('aria-selected') === 'true');
  assert.equal(selected.length, 1); assert.equal(selected[0].dataset.workTab, id); assert.equal(selected[0].tabIndex, 0);
  assert(h.host.querySelectorAll('[data-work-tab]').filter(t => t !== selected[0]).every(t => t.tabIndex === -1));
  const visible = h.host.querySelectorAll('[role="tabpanel"]').filter(p => !p.hidden);
  assert.equal(visible.length, 1); assert.equal(visible[0].id, `gestao-${id}`);
  assert.equal(visible[0].getAttribute('aria-labelledby'), selected[0].id);
  return selected[0];
}
const h = harness(); await h.settle();
assert.equal(h.errors.length, 0);
assertView(h, 'resumo');
assert.equal(h.host.querySelectorAll('[data-work-tab]').length, 6);
assert.equal(h.host.querySelectorAll('[data-work-status]').length, 6);
assert(!h.host.innerHTML.includes('undefined'));
assert.equal(h.host.querySelectorAll('#pergolado').length, 1);
assert.equal((h.host.innerHTML.match(/<tbody>[\s\S]*?<\/tbody>/)?.[0].match(/<tr>/g) || []).length, 4, 'Four pergola quotation rows');
for (const id of pergola.sourceIds) assert(h.host.innerHTML.includes(data.sources.find(source => source.id === id).path));
for (let repeat = 0; repeat < 3; repeat++) for (const id of viewIds) {
  const tab = h.nodes.get(`tab-gestao-${id}`); h.click(tab); assertView(h, id);
  assert.equal(h.document.activeElement, tab, 'Tab activation retains the same focusable node');
  const params = new URLSearchParams(h.location.search);
  assert.equal(params.get('gestao'), id); assert.equal(params.get('andar'), 'cobertura'); assert.equal(params.get('ambiente'), 'cobertura-r01');
}
let tab = assertView(h, 'diario');
assert(h.key(tab, 'ArrowRight').prevented); tab = assertView(h, 'resumo'); assert.equal(h.document.activeElement, tab);
h.key(tab, 'ArrowLeft'); tab = assertView(h, 'diario'); assert.equal(h.document.activeElement, tab);
h.key(tab, 'Home'); tab = assertView(h, 'resumo'); assert.equal(h.document.activeElement, tab);
h.key(tab, 'End'); tab = assertView(h, 'diario'); assert.equal(h.document.activeElement, tab);
assert(!h.key(tab, 'Enter').prevented, 'Leave native activation keys to the browser');
const filter = h.nodes.get('work-status-filter');
h.click(h.nodes.get('tab-gestao-rooftop')); filter.focus();
for (let repeat = 0; repeat < 3; repeat++) for (const state of ['Em execução', 'todos', 'Aceito', 'A definir']) {
  h.change(filter, state);
  const count = ['todos', 'A definir'].includes(state) ? 6 : 0;
  assert.equal(h.host.querySelectorAll('[data-work-status]').filter(n => !n.hidden).length, count);
  assert.equal(h.nodes.get('work-no-results').hidden, count !== 0);
  assert(h.nodes.get('work-result').textContent.startsWith(`${count} de 6 serviços`));
  assert.equal(h.document.activeElement, filter, 'Filtering retains focus');
}
h.click(h.nodes.get('tab-gestao-materiais')); h.click(h.nodes.get('tab-gestao-rooftop'));
assert.equal(filter.value, 'A definir', 'Tab changes preserve filter state');
h.history.back(); assertView(h, 'materiais'); h.history.forward(); assertView(h, 'rooftop');
const decisionLink = h.host.querySelectorAll('[data-work-view]').find(n => n.dataset.workTarget === 'decisao-escopo-materiais');
assert(h.click(decisionLink).prevented); assertView(h, 'decisoes');
assert.equal(h.document.activeElement.id, 'decisao-escopo-materiais');
assert.equal(h.document.activeElement.tabIndex, -1);
assert(h.document.activeElement.scrollCalls.length > 0);
h.click(h.nodes.get('tab-gestao-resumo'));
const pergolaLink = h.host.querySelectorAll('[data-work-view]').find(n => n.dataset.workTarget === 'pergolado');
assert(pergolaLink, 'Summary must link to the pergola quotation module');
assert.equal(pergolaLink.getAttribute('href'), '#pergolado');
assert(h.click(pergolaLink).prevented); assertView(h, 'rooftop');
assert.equal(h.document.activeElement.id, 'pergolado');
assert.equal(h.document.activeElement.tabIndex, -1);
assert(h.document.activeElement.scrollCalls.length > 0);
assert.equal(h.location.hash, '#pergolado');
const pergolaParams = new URLSearchParams(h.location.search);
assert.equal(pergolaParams.get('gestao'), 'rooftop');
assert.equal(pergolaParams.get('andar'), 'cobertura');
assert.equal(pergolaParams.get('ambiente'), 'cobertura-r01');
h.history.back(); assertView(h, 'resumo');
h.history.forward(); assertView(h, 'rooftop');
assert.equal(h.location.hash, '#pergolado');
for (const config of [
  {url:'https://example.test/aquarius530/?andar=cobertura&ambiente=cobertura-r02&gestao=materiais#gestao-rooftop', expected:'rooftop'},
  {url:'https://example.test/aquarius530/?gestao=prestadores', expected:'prestadores'},
  {url:'https://example.test/aquarius530/#gestao-diario', expected:'diario'},
  {url:'https://example.test/aquarius530/?gestao=desconhecida', expected:'resumo'},
  {url:'https://example.test/aquarius530/?andar=cobertura&ambiente=cobertura-r02&gestao=rooftop#pergolado', expected:'rooftop'},
  {url:'https://example.test/aquarius530/#pergolado', expected:'rooftop'},
  {url:'https://example.test/aquarius530/?gestao=materiais#pergolado', expected:'rooftop'}
]) {
  const deep = harness(config); await deep.settle(); assert.equal(deep.errors.length, 0); assertView(deep, config.expected);
  if (deep.location.hash.startsWith('#gestao-') || deep.location.hash === '#pergolado') assert(deep.nodes.get(deep.location.hash.slice(1)).scrollCalls.length > 0);
}
h.location.hash = '#gestao-materiais'; h.dispatchWindow('hashchange'); assertView(h, 'materiais');
h.location.hash = '#pergolado'; h.dispatchWindow('hashchange'); assertView(h, 'rooftop');
for (const modelState of ['failed', 'loading', 'ready']) {
  const independent = harness({modelState}); await independent.settle(); assertView(independent, 'resumo');
  assert.equal(independent.model.innerHTML, 'existing model sentinel'); assert.equal(independent.downloads.innerHTML, 'existing downloads sentinel');
}
const failed = harness({failure:true}); await failed.settle();
assert.equal(failed.errors.length, 1); assert(failed.host.innerHTML.includes('Não foi possível carregar'));
assert(failed.host.innerHTML.includes('assets/management/rooftop.json'));
assert.equal(failed.model.innerHTML, 'existing model sentinel'); assert.equal(failed.downloads.innerHTML, 'existing downloads sentinel');
console.log('PASS: sanitized planning baseline, allowlisted reference sources, service dependencies, acceptance evidence guard and provisional materials; pergola quotation dimensions, 22 pieces / 0.798 m³ nominal wood, non-executive illustration, four table rows and focused deep link; six management views, repeated tabs/filters, keyboard focus, deep links/history and independent failure fallback. DOM harness only; browser rendering unverified.');
