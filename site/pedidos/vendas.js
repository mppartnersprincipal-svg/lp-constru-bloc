/* Aba "Vendas" do /pedidos: números do período escolhido no menu (resumo de /api/pedidos?resumo=1)
 * e ROAS com o investimento do Google Ads (/api/google-ads). Chamado por app.js → window.CBVendas.carregar().
 * Tudo que vem da API passa por esc(). */
(function () {
  'use strict';
  var ENTREGA = { entrega: 'Entrega', retirada: 'Retirada', indefinido: 'Não informado' };
  var $ = function (s) { return document.querySelector(s); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); };
  var money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  var brl = function (n) { return money.format(Number(n) || 0); };
  var dec = function (n, d) { return Number(n || 0).toLocaleString('pt-BR', { maximumFractionDigits: d == null ? 2 : d }); };
  var fmt = function (n) { return Number(n || 0).toLocaleString('pt-BR'); };
  function brDate(ymd, curto) { var p = String(ymd).split('-'); return curto ? p[2] + '/' + p[1] : p[2] + '/' + p[1] + '/' + p[0]; }
  function brMes(ym) { var p = String(ym).split('-'); return p[1] + '/' + p[0]; }
  function fmtTel(t) {
    if (!t) return '';
    if (t.length === 11) return '(' + t.slice(0, 2) + ') ' + t.slice(2, 7) + '-' + t.slice(7);
    if (t.length === 10) return '(' + t.slice(0, 2) + ') ' + t.slice(2, 6) + '-' + t.slice(6);
    return t;
  }
  var chart = null;
  var seq = 0;
  var estado = { resumo: null, ads: undefined, nome: '' };

  function get(path, qs, ctx) {
    return fetch(path + '?' + qs, { headers: { Authorization: 'Bearer ' + ctx.token } }).then(function (r) {
      if (r.status === 401) { ctx.onAuth('Sessão expirada. Entre novamente.'); throw new Error('401'); }
      return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) throw new Error(j.error || 'Erro ' + r.status); return j; });
    });
  }

  function carregar(ctx) {
    var s = ++seq, qs = new URLSearchParams({ de: ctx.de, ate: ctx.ate });
    estado = { resumo: null, ads: undefined, nome: ctx.nome };
    $('#vendas-body').innerHTML = '<div class="empty">Carregando as vendas…</div>';
    qs.set('resumo', '1');
    get('/api/pedidos', qs.toString(), ctx).then(function (v) { if (s === seq) { estado.resumo = v; render(); } })
      .catch(function (e) { if (e.message !== '401' && s === seq) $('#vendas-body').innerHTML = '<div class="state err"><b>Não foi possível carregar as vendas</b>' + esc(e.message) + '</div>'; });
    // O Google Ads nunca segura nem zera o resto: o ROAS aparece quando chegar
    get('/api/google-ads', new URLSearchParams({ de: ctx.de, ate: ctx.ate }).toString(), ctx)
      .then(function (a) { if (s === seq) { estado.ads = a; render(); } })
      .catch(function (e) { if (e.message !== '401' && s === seq) { estado.ads = null; render(); } });
  }

  function kpi(label, valor, cls, hint) {
    return '<div class="kpi' + (cls ? ' ' + cls : '') + '"><div class="lbl">' + esc(label) + '</div><div class="val">' + esc(valor) + '</div>' + (hint ? '<div class="khint">' + esc(hint) + '</div>' : '') + '</div>';
  }

  function render() {
    var v = estado.resumo, a = estado.ads, el = $('#vendas-body');
    if (!v) return;
    if (chart) { chart.destroy(); chart = null; }
    var k = v.kpis;
    var titulo = '<p class="vlead">' + esc(estado.nome) + ' · ' + brDate(v.range.de) + ' a ' + brDate(v.range.ate) + '</p>';
    if (!k.pedidos) { el.innerHTML = titulo + '<div class="empty">Nenhum pedido do Google neste período.</div>'; return; }
    var cost = a && a.status === 'ready' ? a.totals.cost : null;
    var carregandoAds = a === undefined;
    var roasHint = carregandoAds ? 'Consultando o Google Ads…' : cost ? 'Vendido ÷ ' + brl(cost) + ' investidos no Google Ads' : (a && a.status !== 'ready' ? 'Google Ads indisponível agora' : 'Sem investimento no Google Ads no período');
    var foraHint = k.fora_google_pedidos ? ' · fora: ' + k.fora_google_pedidos + ' pedido' + (k.fora_google_pedidos > 1 ? 's' : '') + ' que não veio do Google (' + brl(k.fora_google_valor) + ')' : '';
    el.innerHTML = titulo + '<div class="kpis kpis--vendas">' + [
      kpi('Vendido', brl(k.faturamento), 'gold wide', (k.taxas_entrega ? 'Inclui ' + brl(k.taxas_entrega) + ' de taxas de entrega' : 'Soma dos pedidos') + foraHint),
      kpi('Pedidos', fmt(k.pedidos), '', fmt(k.clientes) + ' clientes' + (k.sem_identificacao ? ' (' + k.sem_identificacao + ' sem nome/telefone)' : '')),
      kpi('Ticket médio', brl(k.ticket_medio), '', 'Vendido ÷ pedidos'),
      kpi('ROAS', carregandoAds ? '…' : cost ? dec(k.faturamento / cost, 1) + 'x' : '—', 'gold', roasHint),
      kpi('Custo por pedido', carregandoAds ? '…' : cost ? brl(cost / k.pedidos) : '—', '', 'Investimento ÷ pedidos fechados'),
      kpi('Recompra', dec(k.pct_receita_recompra, 1) + '%', 'gold', k.recompras + ' pedido' + (k.recompras === 1 ? '' : 's') + ' de quem já tinha comprado (' + brl(k.receita_recompra) + ')'),
      kpi('Clientes recorrentes', fmt(k.clientes_recorrentes), '', 'Compraram 2 vezes ou mais'),
    ].join('') + '</div>' +
      '<div class="card"><h3>' + (v.por_mes.length > 1 ? 'Vendas por mês' : 'Vendas por dia') + '</h3><div class="chart"><canvas id="c-vendas" role="img" aria-label="Gráfico de vendas"></canvas></div></div>' +
      '<div class="cards2"><div class="card"><h3>Produtos mais vendidos</h3><div class="bars" id="v-produtos"></div></div>' +
      '<div class="card"><h3>Entrega × retirada</h3><div class="bars gold" id="v-entrega"></div></div></div>' +
      '<div class="card"><h3>Clientes recorrentes</h3><p class="sub">2 compras ou mais no histórico, com compra no período</p><div class="tbl-wrap" id="v-rec"></div></div>' +
      '<p class="nota">Recorrência pelo telefone; sem telefone, pelo nome (aproximado). Pedidos marcados “Outro” ficam fora destes números e do ROAS. O ROAS usa o investimento do Google Ads no mesmo período.</p>';
    barras('#v-produtos', v.produtos.slice(0, 10).map(function (p) {
      return { label: p.produto, extra: dec(p.quantidade) + ' un. · ' + p.pedidos + ' pedido' + (p.pedidos > 1 ? 's' : ''), valor: p.valor, texto: brl(p.valor) };
    }));
    var totalPed = v.entrega.reduce(function (s, x) { return s + x.value; }, 0);
    barras('#v-entrega', v.entrega.map(function (x) { return { label: ENTREGA[x.key] || x.key, valor: x.value, texto: x.value + ' (' + Math.round(x.value / totalPed * 100) + '%)' }; }));
    $('#v-rec').innerHTML = v.recorrentes.length ? '<table><thead><tr><th>Cliente</th><th class="n">Compras</th><th class="n">Total</th><th>Última</th></tr></thead><tbody>' + v.recorrentes.map(function (c) {
      return '<tr><td>' + esc(c.nome || 'Sem nome') + (c.telefone ? '<br><span class="muted">' + esc(fmtTel(c.telefone)) + '</span>' : '') + '</td><td class="n">' + c.compras + '</td><td class="n">' + brl(c.total) + '</td><td>' + brDate(c.ultima) + '</td></tr>';
    }).join('') + '</tbody></table>' : '<div class="empty">Nenhum cliente recorrente no período</div>';
    grafico(v);
  }

  function barras(sel, itens) {
    var el = $(sel);
    if (!itens.length) { el.innerHTML = '<div class="empty">Sem dados no período</div>'; return; }
    var max = Math.max.apply(null, itens.map(function (x) { return x.valor; }).concat([1]));
    el.innerHTML = itens.map(function (x) {
      return '<div class="bar"><span class="name" title="' + esc(x.label) + '">' + esc(x.label) + (x.extra ? ' <span class="muted">· ' + esc(x.extra) + '</span>' : '') + '</span><span class="num">' + esc(x.texto) + '</span><div class="track"><div class="fill" style="width:' + Math.max(3, x.valor / max * 100) + '%"></div></div></div>';
    }).join('');
  }

  function grafico(v) {
    if (typeof Chart === 'undefined') return; // CDN fora do ar: o resto da aba continua
    var porMes = v.por_mes.length > 1;
    var serie = porMes ? v.por_mes.map(function (x) { return { label: brMes(x.mes), total: x.total, pedidos: x.pedidos }; })
      : v.por_dia.map(function (x) { return { label: brDate(x.data, true), total: x.total, pedidos: x.pedidos }; });
    Chart.defaults.font.family = 'Barlow, Arial, sans-serif';
    Chart.defaults.color = '#5B6275';
    chart = new Chart(document.getElementById('c-vendas'), { type: 'bar', data: { labels: serie.map(function (x) { return x.label; }), datasets: [
      { type: 'line', label: 'Pedidos', data: serie.map(function (x) { return x.pedidos; }), borderColor: '#E0B000', backgroundColor: '#E0B000', tension: .35, pointRadius: 2, yAxisID: 'y1' },
      { label: 'Vendido (R$)', data: serie.map(function (x) { return x.total; }), backgroundColor: 'rgba(0,32,128,.85)', borderRadius: 3 },
    ] }, options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
      scales: { y: { beginAtZero: true }, y1: { position: 'right', beginAtZero: true, grid: { drawOnChartArea: false }, ticks: { precision: 0 } } },
      plugins: { legend: { position: 'bottom' } } } });
  }

  window.CBVendas = { carregar: carregar };
})();
