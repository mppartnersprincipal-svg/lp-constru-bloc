/* Dashboard first-party da LP Construbloc. Consome /api/dashboard, /api/google-ads, /api/ga4 e /api/login.
 * Filtros ficam na URL (?periodo, de, ate, origem, pagina, jornadas). Tudo que vem da API passa por esc(). */
(function () {
  'use strict';
  var TOKEN_KEY = 'cb-dash-token';
  var LIVE_MS = 30000;
  var CH = { google_ads: 'Google Ads', google_organic: 'Google (orgânico)', instagram: 'Instagram', meta_ads: 'Meta Ads', facebook: 'Facebook', direct: 'Direto', referral: 'Indicação', search_other: 'Outros buscadores', other: 'Outro' };
  var PAGE = { home: 'Home', areia: 'Areia', brita: 'Brita', '?': 'Não identificada' };
  var CONSENT = { accepted: 'Aceitou', essential: 'Só o essencial', nao_respondeu: 'Não respondeu' };
  var TYPE = { fina: 'fina', media: 'média', grossa: 'grossa', zero: '0', um: '1' };
  var USAGE = { concreto: 'Concreto', camada: 'Camada de brita' };
  var SECTION = { flutuante: 'Botão flutuante', 'barra-mobile': 'Barra mobile', topbar: 'Barra do topo', header: 'Header', footer: 'Rodapé', topo: 'Hero' };
  var GA4_CH = { 'Paid Search': 'Pesquisa paga', 'Organic Search': 'Pesquisa orgânica', Direct: 'Direto', Referral: 'Indicação', 'Organic Social': 'Social orgânico', 'Paid Social': 'Social pago', 'Cross-network': 'Várias redes', Display: 'Display', 'Paid Other': 'Outros pagos', 'Organic Maps': 'Maps', Unassigned: 'Não atribuído' };
  var GA4_EV = { whatsapp_click: 'Cliques WhatsApp', phone_click: 'Cliques em ligar', cta_click: 'Outros CTAs', calculator_use: 'Usos da calculadora', faq_open: 'FAQs abertas' };
  var ADS_STATUS = { ENABLED: ['Ativa', 'on'], PAUSED: ['Pausada', 'off'], REMOVED: ['Removida', 'rm'] };
  var COLORS = ['#002080', '#E0B000', '#1B3A9E', '#5B6275', '#F0D830', '#A2A8B8', '#000838', '#C99E00', '#DCE0EA'];
  var charts = {};
  var state = { periodo: '30d', de: null, ate: null, origem: 'todas', pagina: 'todas', jornadas: 'conv', funil: 'home' };
  var lastReport = null;
  var token = null;
  var $ = function (s) { return document.querySelector(s); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); };
  var fmt = function (n) { return Number(n || 0).toLocaleString('pt-BR'); };
  var dec = function (n, d) { return Number(n || 0).toLocaleString('pt-BR', { maximumFractionDigits: d == null ? 2 : d }); };
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }

  Chart.defaults.color = '#5B6275';
  Chart.defaults.borderColor = '#E4E8F5';
  Chart.defaults.font.family = 'Barlow, Arial, sans-serif';

  // ---------- Auth ----------
  token = lsGet(TOKEN_KEY);
  function showApp() { $('#login').classList.add('hidden'); $('#app').classList.remove('hidden'); readUrl(); load(); startLive(); }
  function showLogin(msg) { lsSet(TOKEN_KEY, null); token = null; stopLive(); $('#app').classList.add('hidden'); $('#login').classList.remove('hidden'); if (msg) $('#login-error').textContent = msg; }
  $('#login-form').addEventListener('submit', function (e) {
    e.preventDefault();
    $('#login-error').textContent = '';
    fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: $('#pwd').value }) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (x) { if (!x.ok) throw new Error(x.j.error || 'Falha no login'); token = x.j.token; lsSet(TOKEN_KEY, token); $('#pwd').value = ''; showApp(); })
      .catch(function (err) { $('#login-error').textContent = err.message; });
  });
  $('#logout').addEventListener('click', function () { showLogin(); });

  // ---------- Filtros (na URL) ----------
  function ymd(d) { return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); }
  function periodDates(p) {
    var today = new Date(), de = new Date();
    var back = { hoje: 0, '7d': 6, '90d': 89 }[p];
    de.setDate(today.getDate() - (back == null ? 29 : back));
    return { de: ymd(de), ate: ymd(today) };
  }
  function readUrl() {
    var u = new URLSearchParams(location.search);
    ['periodo', 'de', 'ate', 'origem', 'pagina', 'jornadas'].forEach(function (k) { if (u.get(k)) state[k] = u.get(k); });
    if (!u.get('de') || !u.get('ate')) { var d = periodDates(state.periodo); state.de = d.de; state.ate = d.ate; }
    if (state.pagina !== 'todas') state.funil = state.pagina;
    syncFilters();
  }
  function writeUrl() {
    var u = new URLSearchParams({ periodo: state.periodo, de: state.de, ate: state.ate, origem: state.origem, pagina: state.pagina, jornadas: state.jornadas });
    history.replaceState(null, '', '?' + u.toString() + location.hash);
  }
  function syncFilters() {
    document.querySelectorAll('[data-periodo]').forEach(function (b) { b.classList.toggle('is-active', b.dataset.periodo === state.periodo); });
    document.querySelectorAll('[data-jornadas]').forEach(function (b) { b.classList.toggle('is-active', b.dataset.jornadas === state.jornadas); });
    document.querySelectorAll('[data-funil]').forEach(function (b) { b.classList.toggle('is-active', b.dataset.funil === state.funil); });
    $('#de').value = state.de; $('#ate').value = state.ate; $('#origem').value = state.origem; $('#pagina').value = state.pagina;
  }
  function changed() { syncFilters(); writeUrl(); load(); }
  document.querySelectorAll('[data-periodo]').forEach(function (b) { b.addEventListener('click', function () { state.periodo = b.dataset.periodo; var d = periodDates(state.periodo); state.de = d.de; state.ate = d.ate; changed(); }); });
  document.querySelectorAll('[data-jornadas]').forEach(function (b) { b.addEventListener('click', function () { state.jornadas = b.dataset.jornadas; changed(); }); });
  document.querySelectorAll('[data-funil]').forEach(function (b) { b.addEventListener('click', function () { state.funil = b.dataset.funil; syncFilters(); if (lastReport) funnel(lastReport.funnels); }); });
  ['de', 'ate'].forEach(function (id) { $('#' + id).addEventListener('change', function () { if ($('#de').value && $('#ate').value) { state.periodo = 'custom'; state.de = $('#de').value; state.ate = $('#ate').value; changed(); } }); });
  $('#origem').addEventListener('change', function () { state.origem = $('#origem').value; changed(); });
  $('#pagina').addEventListener('change', function () { state.pagina = $('#pagina').value; if (state.pagina !== 'todas') state.funil = state.pagina; changed(); });

  // ---------- Dados ----------
  function api(path, qs) {
    return fetch(path + '?' + qs, { headers: { Authorization: 'Bearer ' + token } }).then(function (r) {
      if (r.status === 401) { showLogin('Sessão expirada. Entre novamente.'); throw new Error('401'); }
      return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) throw new Error(j.error || 'Erro ' + r.status); return j; });
    });
  }
  var loadSeq = 0;
  function load() {
    var seq = ++loadSeq;
    $('#updated').textContent = 'Carregando…';
    var qs = new URLSearchParams({ de: state.de, ate: state.ate, origem: state.origem, pagina: state.pagina, jornadas: state.jornadas }).toString();
    // Consultas em paralelo: o Google Ads nunca segura nem zera o restante do painel
    api('/api/dashboard', qs).then(function (d) { if (seq === loadSeq) render(d); })
      .catch(function (e) { if (e.message !== '401' && seq === loadSeq) $('#updated').textContent = 'Erro: ' + e.message; });
    $('#ads-body').innerHTML = '<div class="card"><div class="empty">Consultando o Google Ads…</div></div>';
    api('/api/google-ads', new URLSearchParams({ de: state.de, ate: state.ate }).toString())
      .then(function (a) { if (seq === loadSeq) googleAds(a); })
      .catch(function (e) { if (e.message !== '401' && seq === loadSeq) googleAds({ status: 'error', message: 'A consulta ao Google Ads não foi concluída. Tente atualizar o painel em alguns minutos.' }); });
    $('#ga4-body').innerHTML = '<div class="card"><div class="empty">Consultando o GA4…</div></div>';
    api('/api/ga4', new URLSearchParams({ de: state.de, ate: state.ate }).toString())
      .then(function (g) { if (seq === loadSeq) ga4(g); })
      .catch(function (e) { if (e.message !== '401' && seq === loadSeq) ga4({ status: 'error', message: 'A consulta ao GA4 não foi concluída. Tente atualizar o painel em alguns minutos.' }); });
  }

  // ---------- Render ----------
  function render(d) {
    lastReport = d;
    $('#updated').textContent = 'Período ' + brDate(d.range.de) + ' a ' + brDate(d.range.ate) + ' · atualizado ' + new Date(d.generated_at).toLocaleTimeString('pt-BR') + (d.truncated ? ' · período grande demais: dados parciais, reduza o intervalo' : '');
    renderKpis(d.kpis.current, d.kpis.previous);
    renderOverview(d);
    renderContacts(d);
    calculator(d.calculator);
    campaigns(d.campaigns);
    funnel(d.funnels);
    bars('#faq-bars', d.faq.map(function (x) { var p = x.key.split('|'); return { key: x.key, label: (PAGE[p[0]] || p[0]) + ' · ' + p.slice(1).join('|'), value: x.value }; }));
    journeys(d.journeys);
    heatmap(d.heatmap);
    bars('#cities', d.cities); bars('#regions', d.regions);
    clicks(d.clicks);
    bars('#browsers', d.browsers); bars('#os', d.os);
    donut('c-consent', d.consent.map(function (x) { return { key: CONSENT[x.key] || x.key, value: x.value }; }));
  }
  function renderKpis(c, p) {
    $('#kpis').innerHTML = [
      kpi('Visitas', c.sessions, p.sessions), kpi('Visitantes', c.visitors, p.visitors),
      kpi('Cliques WhatsApp', c.wa_clicks, p.wa_clicks, null, null, 'gold'), kpi('Ligações', c.phone_clicks, p.phone_clicks, null, null, 'gold'),
      kpi('Taxa de conversão', dec(c.conversion_rate, 1) + '%', null, c.conversion_rate - p.conversion_rate, 'pp', 'gold', 'Sessões com WhatsApp ou ligação'),
      kpi('Tempo médio', c.avg_duration_s + ' s', null, pctDelta(c.avg_duration_s, p.avg_duration_s)), kpi('Rolagem média', c.avg_scroll_pct + '%'),
      kpi('Via Google Ads', dec(c.google_ads_share, 1) + '%', null, c.google_ads_share - p.google_ads_share, 'pp'),
    ].join('');
  }
  function renderOverview(d) {
    chart('c-daily', { type: 'bar', data: { labels: d.daily.map(function (x) { return brDate(x.date, true); }), datasets: [
      { type: 'line', label: 'WhatsApp', data: d.daily.map(function (x) { return x.wa_clicks; }), borderColor: '#1E8E3E', backgroundColor: '#1E8E3E', tension: .35, pointRadius: 2, yAxisID: 'y1' },
      { type: 'line', label: 'Ligações', data: d.daily.map(function (x) { return x.phone_clicks; }), borderColor: '#E0B000', backgroundColor: '#E0B000', tension: .35, pointRadius: 2, yAxisID: 'y1' },
      { label: 'Visitas', data: d.daily.map(function (x) { return x.sessions; }), backgroundColor: 'rgba(0,32,128,.85)', borderRadius: 3 },
    ] }, options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } }, y1: { position: 'right', beginAtZero: true, grid: { drawOnChartArea: false }, ticks: { precision: 0 } } }, plugins: { legend: { position: 'bottom' } } } });
    donut('c-channels', d.channels.map(function (x) { return { key: CH[x.key] || x.key, value: x.value }; }));
    donut('c-pages', d.pages.map(function (x) { return { key: PAGE[x.key] || x.key, value: x.value }; }));
    donut('c-devices', d.devices.map(function (x) { return { key: ({ mobile: 'Celular', tablet: 'Tablet', desktop: 'Desktop' })[x.key] || x.key, value: x.value }; }));
    donut('c-audience', d.audience.map(function (x) { return { key: x.key === 'novo' ? 'Novo' : 'Recorrente', value: x.value }; }));
  }
  function renderContacts(d) {
    bars('#wa-loc', d.wa_by_location);
    bars('#phone-loc', d.phone_by_location);
    pivotTable('#contact-pivot', d.contact_location_x_channel);
    bars('#contact-page', d.contact_by_page.map(function (x) { var p = x.key.split('|'); return { key: x.key, label: (PAGE[p[0]] || p[0]) + ' · ' + (p[1] === 'phone' ? 'Ligação' : 'WhatsApp'), value: x.value }; }));
    bars('#cta-loc', d.cta_by_location);
  }
  function pctDelta(v, prev) { return prev ? Math.round((v - prev) / prev * 100) : (v > 0 ? 100 : 0); }
  function kpi(label, value, prev, deltaOverride, unit, cls, hint) {
    var delta = deltaOverride != null ? deltaOverride : (prev == null || typeof value !== 'number' ? null : pctDelta(value, prev));
    var deltaHtml = delta == null ? '' : '<div class="delta ' + (delta > 0 ? 'up' : delta < 0 ? 'down' : '') + '">' + (delta > 0 ? '▲ ' : delta < 0 ? '▼ ' : '') + dec(Math.abs(delta), 1) + (unit || '%') + ' vs período anterior</div>';
    return '<div class="kpi' + (cls ? ' ' + cls : '') + '"><div class="lbl">' + esc(label) + '</div><div class="val">' + (typeof value === 'number' ? fmt(value) : esc(value)) + '</div>' + (hint ? '<div class="hint">' + esc(hint) + '</div>' : '') + deltaHtml + '</div>';
  }
  function chart(id, cfg) { if (charts[id]) charts[id].destroy(); var el = document.getElementById(id); if (el) charts[id] = new Chart(el, cfg); }
  function donut(id, items) {
    var el = document.getElementById(id); if (!el) return;
    var box = el.parentElement, empty = box.querySelector('.empty');
    if (!items.length) {
      if (charts[id]) { charts[id].destroy(); delete charts[id]; }
      el.classList.add('hidden');
      if (!empty) box.insertAdjacentHTML('beforeend', '<div class="empty">Sem dados no período</div>');
      return;
    }
    el.classList.remove('hidden'); if (empty) empty.remove();
    chart(id, { type: 'doughnut', data: { labels: items.map(function (x) { return x.key; }), datasets: [{ data: items.map(function (x) { return x.value; }), backgroundColor: COLORS, borderColor: '#fff', borderWidth: 2 }] }, options: { responsive: true, maintainAspectRatio: false, cutout: '64%', plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, padding: 12 } } } } });
  }
  function bars(sel, items, title) {
    var el = $(sel);
    var head = title ? '<h4>' + esc(title) + '</h4>' : '';
    if (!items || !items.length) { el.innerHTML = head + '<div class="empty">Sem dados no período</div>'; return; }
    var max = Math.max.apply(null, items.map(function (x) { return x.value; }).concat([1]));
    el.innerHTML = head + items.slice(0, 12).map(function (x) {
      var label = x.label || sectionName(x.key);
      return '<div class="bar"><span class="name" title="' + esc(label) + '">' + esc(label) + '</span><span class="num">' + fmt(x.value) + '</span><div class="track"><div class="fill" style="width:' + Math.max(3, x.value / max * 100) + '%"></div></div></div>';
    }).join('');
  }
  function sectionName(k) { return SECTION[k] || k; }
  function pivotTable(sel, rows) {
    var el = $(sel); if (!rows.length) { el.innerHTML = '<div class="empty">Sem contatos no período</div>'; return; }
    var cols = []; rows.forEach(function (r) { Object.keys(r.cols).forEach(function (c) { if (cols.indexOf(c) < 0) cols.push(c); }); });
    el.innerHTML = '<table><thead><tr><th>Botão</th>' + cols.map(function (c) { return '<th class="n">' + esc(CH[c] || c) + '</th>'; }).join('') + '<th class="n">Total</th></tr></thead><tbody>' +
      rows.map(function (r) {
        var p = r.row.split('|'), t = 0;
        var tds = cols.map(function (c) { var v = r.cols[c] || 0; t += v; return '<td class="n">' + (v || '·') + '</td>'; }).join('');
        return '<tr><td><span class="tag ' + (p[0] === 'phone' ? 'gold' : 'wa') + '">' + (p[0] === 'phone' ? 'Ligação' : 'WhatsApp') + '</span> ' + esc(p.slice(1).join('|')) + '</td>' + tds + '<td class="n"><b>' + t + '</b></td></tr>';
      }).join('') + '</tbody></table>';
  }

  // ---------- Calculadora ----------
  function calculator(c) {
    var total = c.by_product.reduce(function (a, p) { return a + p.sessions; }, 0);
    $('#calc-lead').textContent = total
      ? fmt(total) + ' cálculos finais no período. "Volume de caminhão" = ' + dec(c.truck_m3) + ' m³ ou mais (≈ ' + Math.round(c.truck_m3 * 70) + ' sacos de areia / ' + Math.round(c.truck_m3 * 75) + ' de brita).'
      : 'Ninguém usou a calculadora no período.';
    $('#calc-products').innerHTML = c.by_product.map(function (p) {
      var name = p.product === 'areia' ? 'Areia' : 'Brita';
      return '<div class="card"><header><div><h3>' + name + '</h3><p>Sessões que calcularam e o que aconteceu depois</p></div></header><div class="kpis" style="margin:0">' + [
        kpi('Sessões', p.sessions, null, null, null, null, fmt(p.uses) + ' usos (cada edição conta)'),
        kpi('Volume médio', dec(p.avg_m3) + ' m³', null, null, null, null, 'Mediana ' + dec(p.median_m3) + ' m³'),
        kpi('Caminhão', p.truck_sessions, null, null, null, 'gold', p.sessions ? Math.round(p.truck_sessions / p.sessions * 100) + '% dos cálculos' : ''),
        kpi('Chamaram', p.converted_sessions, null, null, null, 'gold', p.sessions ? Math.round(p.converted_sessions / p.sessions * 100) + '% de quem calculou' : ''),
      ].join('') + '</div></div>';
    }).join('');
    var labels = c.by_product[0].buckets.map(function (b) { return b.label; });
    chart('c-volume', { type: 'bar', data: { labels: labels, datasets: c.by_product.map(function (p, i) {
      return { label: p.product === 'areia' ? 'Areia' : 'Brita', data: p.buckets.map(function (b) { return b.value; }), backgroundColor: i ? '#E0B000' : '#002080', borderRadius: 3 };
    }) }, options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }, plugins: { legend: { position: 'bottom' } } } });
    bars('#calc-type', c.by_type.map(function (x) { var p = x.key.split('|'); return { key: x.key, label: (p[0] === 'areia' ? 'Areia ' : 'Brita ') + (TYPE[p[1]] || p[1]), value: x.value }; }), 'Tipo');
    bars('#calc-usage', c.by_usage.map(function (x) { return { key: x.key, label: USAGE[x.key] || x.key, value: x.value }; }), 'Uso da brita');
    $('#truck-sub').textContent = 'Cálculo final de ' + dec(c.truck_m3) + ' m³ ou mais. Vale o comercial oferecer o ensacado em quantidade (melhor margem) antes de o cliente procurar caçamba a granel.';
    var el = $('#calc-truck');
    if (!c.truck.length) { el.innerHTML = '<div class="empty">Nenhum cálculo de caminhão no período</div>'; return; }
    el.innerHTML = '<table><thead><tr><th>Quando</th><th>Produto</th><th class="n">Volume</th><th class="n">Sacos (≈)</th><th>Origem</th><th>Cidade</th><th>Contato</th></tr></thead><tbody>' + c.truck.map(function (t) {
      var sacos = Math.ceil(t.volume_m3 * (t.product === 'areia' ? 70 : 75));
      var contato = [t.wa_clicks ? 'WhatsApp' : '', t.phone_clicks ? 'Ligação' : ''].filter(Boolean).join(' + ');
      return '<tr><td>' + brDateTime(t.ts) + '</td><td>' + esc((t.product === 'areia' ? 'Areia ' : 'Brita ') + (TYPE[t.product_type] || t.product_type || '') + (t.usage ? ' · ' + (USAGE[t.usage] || t.usage) : '')) + '</td><td class="n">' + dec(t.volume_m3) + ' m³</td><td class="n">' + fmt(sacos) + '</td><td>' + esc(CH[t.channel] || t.channel || '·') + '</td><td>' + esc(t.city || '·') + '</td><td>' + (contato ? '<span class="tag on">' + contato + '</span>' : '<span class="tag off">não chamou</span>') + '</td></tr>';
    }).join('') + '</tbody></table>';
  }

  // ---------- Google Ads (porte da seção da Sólida) ----------
  function googleAds(a) {
    var el = $('#ads-body');
    if (!a || a.status !== 'ready') {
      var pend = a && a.status === 'not_configured';
      $('#ads-lead').textContent = 'Investimento e resultados das campanhas de anúncios';
      el.innerHTML = '<div class="state' + (pend ? '' : ' err') + '"><b>' + (pend ? 'Conexão com o Google Ads pendente' : 'Não foi possível carregar o Google Ads') + '</b>' + esc(a && a.message) + '</div>';
      return;
    }
    var money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: a.customer.currencyCode });
    var pct = new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 2 });
    var m = function (v) { return v == null ? '—' : money.format(v); };
    var p = function (v) { return v == null ? '—' : pct.format(v); };
    var t = a.totals;
    $('#ads-lead').textContent = 'Resultados da conta ' + a.customer.name + ' · ' + a.customer.currencyCode + ' · ' + brDate(a.from) + ' a ' + brDate(a.to) + ' · fuso da conta: ' + a.customer.timeZone;
    var cards = '<div class="kpis">' + [
      kpi('Investimento', m(t.cost), null, null, null, 'gold', 'Valor gasto em anúncios'), kpi('Impressões', t.impressions, null, null, null, null, 'Exibições dos anúncios'),
      kpi('Cliques', t.clicks, null, null, null, null, 'Cliques nos anúncios'), kpi('CTR', p(t.ctr), null, null, null, null, 'Cliques ÷ impressões'),
      kpi('CPC médio', m(t.averageCpc), null, null, null, null, 'Custo médio por clique'), kpi('Conversões', dec(t.conversions), null, null, null, 'gold', 'Registradas no Google Ads'),
      kpi('Custo por conversão', m(t.costPerConversion), null, null, null, 'gold', 'Investimento ÷ conversões'),
    ].join('') + '</div>';
    var table = !a.campaigns.length ? '<div class="empty">Nenhuma campanha com resultados no período. Tente ampliar o período.</div>' :
      '<div class="tbl-wrap"><table><thead><tr><th>Campanha</th><th>Status</th><th class="n">Investimento</th><th class="n">Impressões</th><th class="n">Cliques</th><th class="n">CTR</th><th class="n">CPC médio</th><th class="n">Conversões</th><th class="n">Custo / conv.</th></tr></thead><tbody>' +
      a.campaigns.map(function (c) {
        var st = ADS_STATUS[c.status] || ['Não informado', 'off'];
        return '<tr><td><b>' + esc(c.name) + '</b></td><td><span class="tag ' + st[1] + '">' + st[0] + '</span></td><td class="n">' + m(c.cost) + '</td><td class="n">' + fmt(c.impressions) + '</td><td class="n">' + fmt(c.clicks) + '</td><td class="n">' + p(c.ctr) + '</td><td class="n">' + m(c.averageCpc) + '</td><td class="n">' + dec(c.conversions) + '</td><td class="n">' + m(c.costPerConversion) + '</td></tr>';
      }).join('') + '</tbody></table></div>';
    el.innerHTML = cards + '<div class="card"><header><div><h3>Resultados por campanha</h3><p>Inclui campanhas pausadas ou removidas com resultados no período</p></div></header>' + table +
      '<p class="note">O período selecionado vale para os anúncios; os filtros de origem e de página valem só para as visitas do site. As conversões seguem a atribuição do Google Ads, podem ser fracionárias e ser atualizadas depois. Não são o mesmo número que os cliques no WhatsApp medidos pelo site. "—" indica uma taxa que não pode ser calculada no período.</p></div>';
  }

  // ---------- GA4 (Data API, só leitura) ----------
  function ga4(g) {
    var el = $('#ga4-body');
    if (charts['c-ga4-daily']) { charts['c-ga4-daily'].destroy(); delete charts['c-ga4-daily']; }
    if (!g || g.status !== 'ready') {
      var pend = g && g.status === 'not_configured';
      $('#ga4-lead').textContent = 'Sessões, eventos-chave e origens medidos pelo GA4';
      el.innerHTML = '<div class="state' + (pend ? '' : ' err') + '"><b>' + (pend ? 'Conexão com o GA4 pendente' : 'Não foi possível carregar o GA4') + '</b>' + esc(g && g.message) + '</div>';
      return;
    }
    var t = g.totals, pv = g.previous;
    var pct = function (v) { return v == null ? '—' : dec(v * 100, 1) + '%'; };
    var pp = function (a, b) { return a == null || b == null ? null : (a - b) * 100; };
    $('#ga4-lead').textContent = 'Propriedade ' + g.propertyId + ' · ' + brDate(g.from) + ' a ' + brDate(g.to) + (g.timeZone ? ' · fuso da propriedade: ' + g.timeZone : '');
    var cards = '<div class="kpis">' + [
      kpi('Sessões', t.sessions, pv.sessions), kpi('Usuários', t.users, pv.users), kpi('Novos usuários', t.newUsers, pv.newUsers),
      kpi('Taxa de engajamento', pct(t.engagementRate), null, pp(t.engagementRate, pv.engagementRate), 'pp', null, 'Sessões engajadas ÷ sessões'),
      kpi('Duração média', Math.round(t.averageSessionDuration) + ' s', null, pctDelta(t.averageSessionDuration, pv.averageSessionDuration)),
      kpi('Eventos-chave', dec(t.keyEvents), null, pctDelta(t.keyEvents, pv.keyEvents), null, 'gold', 'Marcados como evento-chave no GA4'),
      kpi('Eventos-chave / sessão', pct(t.keyEventRate), null, pp(t.keyEventRate, pv.keyEventRate), 'pp', 'gold'),
    ].join('') + '</div>';
    var events = '<div class="kpis">' + g.events.map(function (e) { return kpi(GA4_EV[e.name] || e.name, e.count, e.previous, null, null, null, e.name); }).join('') + '</div>';
    var table = function (rows, head, label) {
      if (!rows.length) return '<div class="empty">Sem dados no período</div>';
      return '<div class="tbl-wrap"><table><thead><tr><th>' + head + '</th><th class="n">Sessões</th><th class="n">Usuários</th><th class="n">Eventos-chave</th></tr></thead><tbody>' +
        rows.map(function (r) { return '<tr><td>' + esc(label(r.key)) + '</td><td class="n">' + fmt(r.sessions) + '</td><td class="n">' + fmt(r.users) + '</td><td class="n">' + dec(r.keyEvents) + '</td></tr>'; }).join('') + '</tbody></table></div>';
    };
    el.innerHTML = cards +
      '<div class="card"><header><div><h3>Sessões e eventos-chave por dia</h3><p>Segundo o GA4</p></div></header><div class="chart"><canvas id="c-ga4-daily" role="img" aria-label="Sessões e eventos-chave por dia no GA4"></canvas></div></div>' +
      '<div class="card"><header><div><h3>Eventos do site no GA4</h3><p>Contagem de eventos enviados pelo GTM (o mesmo clique pode contar mais de uma vez por sessão)</p></div></header>' + events + '</div>' +
      '<div class="grid g-11"><div class="card"><header><div><h3>Canais</h3><p>Agrupamento padrão de canais do GA4</p></div></header>' + table(g.channels, 'Canal', function (k) { return GA4_CH[k] || k; }) + '</div>' +
      '<div class="card"><header><div><h3>Páginas de entrada</h3><p>Primeira página da sessão</p></div></header>' + table(g.landingPages, 'Página', function (k) { return k; }) + '</div></div>' +
      '<p class="note">O período selecionado vale para o GA4; os filtros de origem e de página valem só para as visitas do site. O GA4 depende de consentimento e bloqueadores, aplica modelagem e pode levar até 48 h para fechar os números, por isso diverge do coletor próprio.' + (g.thresholded ? ' <b>Alguns números foram ocultados pelo GA4 (limite de privacidade) e podem estar abaixo do real.</b>' : '') + '</p>';
    chart('c-ga4-daily', { type: 'bar', data: { labels: g.daily.map(function (x) { return brDate(x.date, true); }), datasets: [
      { type: 'line', label: 'Eventos-chave', data: g.daily.map(function (x) { return x.keyEvents; }), borderColor: '#E0B000', backgroundColor: '#E0B000', tension: .35, pointRadius: 2, yAxisID: 'y1' },
      { label: 'Sessões', data: g.daily.map(function (x) { return x.sessions; }), backgroundColor: 'rgba(0,32,128,.85)', borderRadius: 3 },
    ] }, options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } }, y1: { position: 'right', beginAtZero: true, grid: { drawOnChartArea: false }, ticks: { precision: 0 } } }, plugins: { legend: { position: 'bottom' } } } });
  }

  function campaigns(rows) {
    var el = $('#campaigns'); if (!rows.length) { el.innerHTML = '<div class="empty">Nenhuma sessão de campanha no período</div>'; return; }
    el.innerHTML = '<table><thead><tr><th>Campanha</th><th>Grupo / anúncio</th><th>Termo</th><th>Canal</th><th>Entrada</th><th class="n">Visitas</th><th class="n">WhatsApp</th><th class="n">Ligações</th><th class="n">Conv.</th></tr></thead><tbody>' +
      rows.map(function (r) { return '<tr><td>' + esc(r.campaign) + '</td><td>' + esc(r.content || '·') + '</td><td>' + esc(r.term || '·') + '</td><td><span class="tag ' + (r.channel === 'google_ads' ? 'ads' : '') + '">' + esc(CH[r.channel] || r.channel) + '</span></td><td>' + esc(PAGE[r.page] || r.page || '·') + '</td><td class="n">' + r.sessions + '</td><td class="n">' + r.wa_clicks + '</td><td class="n">' + r.phone_clicks + '</td><td class="n">' + (r.sessions ? Math.round(r.converting / r.sessions * 100) : 0) + '%</td></tr>'; }).join('') + '</tbody></table>';
  }
  function funnel(all) {
    var f = all[state.funil] || { sessions: 0, steps: [] };
    $('#funnel-sub').textContent = f.sessions ? '% das ' + fmt(f.sessions) + ' sessões que abriram ' + PAGE[state.funil] + ' e viram cada seção' : 'Ninguém abriu esta página no período';
    var max = Math.max.apply(null, f.steps.map(function (s) { return s.value; }).concat([1]));
    $('#funnel').innerHTML = f.steps.map(function (s) { return '<div class="step"><span>' + esc(s.label) + '</span><div class="track"><div class="fill" style="width:' + (s.value / max * 100) + '%">' + (s.value ? fmt(s.value) : '') + '</div></div><span class="num">' + s.pct + '%</span></div>'; }).join('');
  }
  function journeys(list) {
    var el = $('#journeys'); if (!list.length) { el.innerHTML = '<div class="card"><div class="empty">Nenhuma jornada no período</div></div>'; return; }
    el.innerHTML = list.map(function (j) {
      var origem = (CH[j.channel] || j.channel || 'Outro') + (j.campaign ? ' · ' + j.campaign : '') + (j.content ? ' · ' + j.content : '') + (j.term ? ' · "' + j.term + '"' : '');
      var meta = ['<span>' + brDateTime(j.started_at) + '</span>', '<span><b>' + esc(origem) + '</b></span>', '<span>Entrou por ' + esc(PAGE[j.page] || j.page || '?') + '</span>',
        '<span>' + esc([j.device, j.browser, j.os].filter(Boolean).join(' · ')) + '</span>', j.city ? '<span>' + esc(j.city + (j.region ? ' · ' + j.region : '')) + '</span>' : '',
        '<span>' + j.duration_s + ' s no site' + (j.max_scroll_pct != null ? ' · ' + j.max_scroll_pct + '% da página' : '') + '</span>', j.returning ? '<span class="tag">já visitou antes</span>' : ''].join('');
      return '<div class="journey"><div class="meta">' + meta + '</div><div class="trail">' + j.trail.map(function (s) { return '<span class="' + esc(s.kind) + '">' + esc(s.text) + '</span>'; }).join('') + '</div></div>';
    }).join('');
  }
  function heatmap(m) {
    var days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'], max = 0, peak = null;
    m.forEach(function (row, d) { row.forEach(function (v, h) { if (v > max) { max = v; peak = { d: d, h: h }; } }); });
    var html = '<div></div>' + Array.from({ length: 24 }, function (_, h) { return '<div class="h">' + (h % 3 === 0 ? h + 'h' : '') + '</div>'; }).join('');
    m.forEach(function (row, d) { html += '<div class="d">' + days[d] + '</div>' + row.map(function (v, h) { var a = max ? v / max : 0; return '<div class="c" title="' + days[d] + ' ' + h + 'h: ' + v + '" style="background:rgba(0,32,128,' + (0.05 + a * 0.9) + ')"></div>'; }).join(''); });
    $('#heat').innerHTML = html;
    $('#heat-peak').textContent = peak && max ? 'Pico: ' + days[peak.d] + ' às ' + peak.h + 'h (' + max + ' visitas). A loja abre das 7h às 19h.' : 'Sem dados no período';
  }
  function clicks(rows) {
    var el = $('#clicks'); if (!rows.length) { el.innerHTML = '<div class="empty">Sem cliques no período</div>'; return; }
    el.innerHTML = '<table><thead><tr><th>Elemento</th><th>Onde</th><th>Página</th><th class="n">Cliques</th></tr></thead><tbody>' + rows.map(function (r) { return '<tr><td>' + esc(r.text) + '</td><td class="muted">' + esc(sectionName(r.section) || '·') + '</td><td class="muted">' + esc(PAGE[r.page] || r.page || '·') + '</td><td class="n">' + r.value + '</td></tr>'; }).join('') + '</tbody></table>';
  }

  // ---------- Ao vivo ----------
  var liveTimer = null;
  function startLive() { stopLive(); tickLive(); liveTimer = setInterval(function () { if (!document.hidden) tickLive(); }, LIVE_MS); }
  function stopLive() { if (liveTimer) clearInterval(liveTimer); liveTimer = null; }
  function liveText(e) {
    var p = e.props || {};
    if (e.name === 'whatsapp_click') return 'WhatsApp: ' + (p.cta_location || '');
    if (e.name === 'phone_click') return 'Ligação: ' + (p.cta_location || '');
    if (e.name === 'cta_click') return 'Link: ' + (p.cta_location || '');
    if (e.name === 'calculator_use') return 'Calculou ' + p.product + ' ' + (TYPE[p.product_type] || p.product_type || '') + ': ' + dec(p.volume_m3) + ' m³';
    if (e.name === 'faq_open') return 'FAQ: ' + p.faq_question;
    if (e.name === 'click') return 'Clicou: ' + (p.text || '');
    if (e.name === 'page_view') return 'Abriu ' + (PAGE[e.page_type] || 'a página');
    return e.name;
  }
  function tickLive() {
    if (!token) return;
    api('/api/dashboard', 'live=1').then(function (d) {
      var el = $('#live'); if (!d.events.length) { el.innerHTML = '<div class="empty">Nenhum evento ainda</div>'; return; }
      el.innerHTML = d.events.map(function (e) {
        var s = e.session || {};
        return '<div class="ev"><time>' + new Date(e.ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) + '</time><span>' + esc(liveText(e)) + '</span><span class="who">' + esc([CH[s.channel] || s.channel, s.device, s.city].filter(Boolean).join(' · ')) + '</span></div>';
      }).join('');
    }).catch(function () {});
  }
  function brDate(ymd, short) { var p = String(ymd).split('-'); return short ? p[2] + '/' + p[1] : p[2] + '/' + p[1] + '/' + p[0]; }
  function brDateTime(iso) { return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }); }

  if (token) showApp();
})();
