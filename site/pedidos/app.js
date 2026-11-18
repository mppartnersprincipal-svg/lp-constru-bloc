/* Controle de pedidos da Construbloc (/pedidos): aba Pedidos (cadastro e lista) e aba Vendas (vendas.js).
 * Consome /api/pedidos e /api/login. Mesmo token do /dashboard (localStorage 'cb-dash-token').
 * O total exibido no formulário é só prévia: quem calcula é o servidor. Tudo que vem da API passa por esc().
 * Estado na URL: ?aba=pedidos|vendas&periodo=AAAA-MM|30d|tudo */
(function () {
  'use strict';
  var TOKEN_KEY = 'cb-dash-token';
  var MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  var ENTREGA = { entrega: 'Entrega', retirada: 'Retirada', indefinido: 'Entrega não informada' };
  var ABAS = ['pedidos', 'vendas'];
  var token = null;
  var state = { aba: 'pedidos', periodo: null, meses: [], busca: '', pedidos: [], editando: null };
  var $ = function (s) { return document.querySelector(s); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); };
  var money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  var brl = function (n) { return money.format(Number(n) || 0); };
  var qtd = function (n) { return Number(n || 0).toLocaleString('pt-BR', { maximumFractionDigits: 3 }); };
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }

  // Mesmo parser do servidor (api/_lib/pedidos.js → numero), só para a prévia do total
  function numero(v) {
    var s = String(v == null ? '' : v).trim().replace(/^R\$\s*/i, '');
    if (!s) return NaN;
    if (s.indexOf(',') >= 0) s = s.replace(/\./g, '').replace(',', '.');
    else if (/^-?[1-9]\d{0,2}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, ''); // 1.500 = mil e quinhentos
    return /^-?\d+(\.\d+)?$/.test(s) ? Number(s) : NaN;
  }
  function hoje() { var d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); }
  function brDate(ymd) { var p = String(ymd).split('-'); return p[2] + '/' + p[1] + '/' + p[0]; }
  function fmtTel(t) {
    if (!t) return '';
    if (t.length === 11) return '(' + t.slice(0, 2) + ') ' + t.slice(2, 7) + '-' + t.slice(7);
    if (t.length === 10) return '(' + t.slice(0, 2) + ') ' + t.slice(2, 6) + '-' + t.slice(6);
    return t;
  }
  function toast(msg) { var el = $('#toast'); el.textContent = msg; el.classList.remove('hidden'); clearTimeout(toast.t); toast.t = setTimeout(function () { el.classList.add('hidden'); }, 2600); }

  // ---------- Auth ----------
  token = lsGet(TOKEN_KEY);
  function showApp() { $('#login').classList.add('hidden'); $('#app').classList.remove('hidden'); readUrl(); load(); }
  function showLogin(msg) { lsSet(TOKEN_KEY, null); token = null; closeForm(); $('#app').classList.add('hidden'); $('#login').classList.remove('hidden'); if (msg) $('#login-error').textContent = msg; }
  $('#login-form').addEventListener('submit', function (e) {
    e.preventDefault();
    $('#login-error').textContent = '';
    fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: $('#pwd').value }) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (x) { if (!x.ok) throw new Error(x.j.error || 'Falha no login'); token = x.j.token; lsSet(TOKEN_KEY, token); $('#pwd').value = ''; showApp(); })
      .catch(function (err) { $('#login-error').textContent = err.message; });
  });
  $('#logout').addEventListener('click', function () { showLogin(); });

  function api(method, qs, body) {
    var opts = { method: method, headers: { Authorization: 'Bearer ' + token } };
    if (body) { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); }
    return fetch('/api/pedidos' + (qs ? '?' + qs : ''), opts).then(function (r) {
      if (r.status === 401) { showLogin('Sessão expirada. Entre novamente.'); throw new Error('401'); }
      return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) throw new Error(j.error || 'Erro ' + r.status); return j; });
    });
  }

  // ---------- Abas e período (na URL) ----------
  var MES_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
  function periodoValido(p) { return MES_RE.test(p || '') || p === '30d' || p === 'tudo'; }
  function readUrl() {
    var u = new URLSearchParams(location.search);
    state.aba = ABAS.indexOf(u.get('aba')) >= 0 ? u.get('aba') : 'pedidos';
    var p = u.get('periodo') || u.get('mes'); // ?mes= era o formato antigo
    state.periodo = periodoValido(p) ? p : hoje().slice(0, 7);
  }
  function writeUrl() { history.replaceState(null, '', '?aba=' + state.aba + '&periodo=' + state.periodo); }
  function addDias(ymd, n) { var d = new Date(ymd + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
  function nomeMes(m) { return MESES[Number(m.slice(5, 7)) - 1] + ' ' + m.slice(0, 4); }
  /** Datas do período escolhido. "tudo" começa no mês mais antigo com pedidos. */
  function periodoRange(p) {
    if (MES_RE.test(p)) {
      var y = Number(p.slice(0, 4)), mo = Number(p.slice(5, 7));
      return { de: p + '-01', ate: p + '-' + String(new Date(Date.UTC(y, mo, 0)).getUTCDate()).padStart(2, '0'), nome: nomeMes(p) };
    }
    if (p === '30d') return { de: addDias(hoje(), -29), ate: hoje(), nome: 'Últimos 30 dias' };
    // Antes da 1ª resposta não se sabe o mês mais antigo: pede desde 2023 (a API limita a 400 dias)
    var primeiro = state.meses.length ? state.meses[state.meses.length - 1].mes : null;
    return { de: primeiro ? primeiro + '-01' : '2023-01-01', ate: hoje(), nome: primeiro ? 'Desde ' + nomeMes(primeiro).toLowerCase() : 'Desde o início' };
  }
  function montarPeriodos() {
    var atual = hoje().slice(0, 7), meses = state.meses.slice();
    if (!meses.some(function (m) { return m.mes === atual; })) meses.unshift({ mes: atual, pedidos: 0 });
    if (MES_RE.test(state.periodo) && !meses.some(function (m) { return m.mes === state.periodo; })) meses.push({ mes: state.periodo, pedidos: 0 });
    meses.sort(function (a, b) { return a.mes < b.mes ? 1 : -1; });
    $('#periodo').innerHTML = '<optgroup label="Mês">' + meses.map(function (m) {
      return '<option value="' + esc(m.mes) + '">' + esc(nomeMes(m.mes)) + ' (' + m.pedidos + (m.pedidos === 1 ? ' pedido' : ' pedidos') + ')</option>';
    }).join('') + '</optgroup><optgroup label="Outros períodos"><option value="30d">Últimos 30 dias</option><option value="tudo">Desde o início</option></optgroup>';
    $('#periodo').value = state.periodo;
  }
  $('#periodo').addEventListener('change', function () { state.periodo = $('#periodo').value; writeUrl(); load(); });
  function mostrarAba() {
    ABAS.forEach(function (a) {
      var ativa = a === state.aba;
      $('#tab-' + a).setAttribute('aria-selected', String(ativa));
      $('#tab-' + a).classList.toggle('is-active', ativa);
      $('#painel-' + a).classList.toggle('hidden', !ativa);
    });
    $('#novo').classList.toggle('hidden', state.aba !== 'pedidos');
  }
  ABAS.forEach(function (a) {
    $('#tab-' + a).addEventListener('click', function () { if (state.aba === a) return; state.aba = a; writeUrl(); mostrarAba(); load(); });
  });

  // ---------- Carregar ----------
  var loadSeq = 0;
  function load() {
    var seq = ++loadSeq, r = periodoRange(state.periodo);
    mostrarAba();
    $('#list-error').textContent = '';
    $('#list').innerHTML = '<div class="empty">Carregando…</div>';
    api('GET', new URLSearchParams({ de: r.de, ate: r.ate }).toString()).then(function (d) {
      if (seq !== loadSeq) return;
      state.pedidos = d.pedidos;
      state.meses = d.meses || [];
      montarPeriodos();
      $('#produtos-list').innerHTML = d.produtos.map(function (p) { return '<option value="' + esc(p) + '"></option>'; }).join('');
      render();
      // "tudo" depende do mês mais antigo, que só se conhece depois da 1ª resposta
      var r2 = periodoRange(state.periodo);
      if (state.aba === 'vendas' && window.CBVendas) window.CBVendas.carregar({ de: r2.de, ate: r2.ate, nome: r2.nome, token: token, onAuth: showLogin });
    }).catch(function (e) { if (e.message !== '401' && seq === loadSeq) { $('#list').innerHTML = ''; $('#list-error').textContent = e.message; } });
  }
  function filtrados() {
    var q = state.busca.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    if (!q) return state.pedidos;
    var dig = q.replace(/\D/g, '');
    var norm = function (s) { return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); };
    return state.pedidos.filter(function (p) {
      if (dig.length >= 4 && (p.cliente_telefone || '').indexOf(dig) >= 0) return true;
      return norm(p.cliente_nome).indexOf(q) >= 0 || p.itens.some(function (i) { return norm(i.produto).indexOf(q) >= 0; });
    });
  }
  function render() {
    var all = state.pedidos;
    var fat = all.reduce(function (s, p) { return s + Number(p.total); }, 0);
    var rec = all.filter(function (p) { return p.compra_n > 1; }).length;
    $('#kpis').innerHTML = [
      ['Vendido', brl(fat), 'gold'], ['Pedidos', String(all.length), ''],
      ['Ticket médio', brl(all.length ? fat / all.length : 0), ''], ['Recompras', String(rec), 'gold'],
    ].map(function (k) { return '<div class="kpi ' + k[2] + '"><div class="lbl">' + k[0] + '</div><div class="val">' + esc(k[1]) + '</div></div>'; }).join('');
    var list = filtrados();
    if (!list.length) {
      $('#list').innerHTML = '<div class="empty">' + (all.length ? 'Nenhum pedido encontrado na busca.' : 'Nenhum pedido lançado neste período.<br>Toque em “+ Novo pedido” para começar.') + '</div>';
      return;
    }
    $('#list').innerHTML = list.map(card).join('');
  }
  function card(p) {
    var nome = p.cliente_nome || 'Cliente não informado';
    var tags = '<span class="tag">' + esc(ENTREGA[p.entrega] || p.entrega) + (p.entrega === 'entrega' && Number(p.taxa_entrega) ? ' · taxa ' + brl(p.taxa_entrega) : '') + '</span>';
    if (Number(p.desconto)) tags += '<span class="tag">desconto ' + brl(p.desconto) + '</span>';
    if (p.compra_n > 1) tags +='<span class="tag gold">' + p.compra_n + 'ª compra</span>';
    else if (p.compras_cliente > 1) tags += '<span class="tag blue">1ª compra · voltou depois</span>';
    if (p.origem === 'outro') tags += '<span class="tag">Fora do Google</span>';
    var itens = p.itens.map(function (i) {
      var semPreco = i.quantidade == null || i.valor_unitario == null; // importados da planilha com "x"
      return '<li><span>' + (i.quantidade == null ? '' : qtd(i.quantidade) + ' × ') + esc(i.produto) + '</span><span>' + (semPreco ? 'sem preço' : brl(i.quantidade * i.valor_unitario)) + '</span></li>';
    }).join('');
    var extra = [p.pesquisou ? 'Pesquisou: “' + esc(p.pesquisou) + '”' : '', p.observacao ? esc(p.observacao) : ''].filter(Boolean).join(' · ');
    return '<article class="order" data-id="' + esc(p.id) + '"><div class="head"><div class="who"><b>' + esc(nome) + '</b><small>' + brDate(p.data) + (p.cliente_telefone ? ' · ' + esc(fmtTel(p.cliente_telefone)) : '') + '</small></div>' +
      '<div class="total">' + brl(p.total) + '</div></div><ul>' + itens + '</ul><div class="meta">' + tags + '</div>' + (extra ? '<div class="note">' + extra + '</div>' : '') +
      '<div class="actions"><button class="btn btn--sm btn--danger" type="button" data-act="del">Excluir</button><button class="btn btn--sm" type="button" data-act="edit">Editar</button></div></article>';
  }
  var buscaTimer = null;
  $('#busca').addEventListener('input', function () { clearTimeout(buscaTimer); buscaTimer = setTimeout(function () { state.busca = $('#busca').value; render(); }, 150); });

  // Editar / excluir (exclusão em dois toques, sem confirm())
  $('#list').addEventListener('click', function (e) {
    var btn = e.target.closest('button[data-act]'); if (!btn) return;
    var id = btn.closest('.order').dataset.id;
    var p = state.pedidos.find(function (x) { return x.id === id; }); if (!p) return;
    if (btn.dataset.act === 'edit') return openForm(p);
    if (!btn.classList.contains('armed')) {
      btn.classList.add('armed'); btn.textContent = 'Toque de novo para excluir';
      setTimeout(function () { btn.classList.remove('armed'); btn.textContent = 'Excluir'; }, 6000);
      return;
    }
    btn.disabled = true;
    api('DELETE', 'id=' + encodeURIComponent(id)).then(function () { toast('Pedido excluído'); load(); })
      .catch(function (err) { btn.disabled = false; if (err.message !== '401') $('#list-error').textContent = err.message; });
  });

  // ---------- Formulário ----------
  function itemRow(it) {
    var div = document.createElement('div');
    div.className = 'item';
    div.innerHTML = '<input class="field" type="text" list="produtos-list" maxlength="120" placeholder="Produto (ex.: Areia média MT)" aria-label="Produto" data-f="produto">' +
      '<button class="rm" type="button" aria-label="Remover produto">×</button>' +
      '<div class="nums"><input class="field" type="text" inputmode="decimal" placeholder="Qtd" aria-label="Quantidade" data-f="quantidade">' +
      '<input class="field" type="text" inputmode="decimal" placeholder="Valor unit. R$" aria-label="Valor unitário" data-f="valor_unitario"></div>' +
      '<div class="sub"></div>';
    if (it) {
      div.querySelector('[data-f=produto]').value = it.produto;
      if (it.quantidade != null) div.querySelector('[data-f=quantidade]').value = qtd(it.quantidade).replace(/\./g, '');
      if (it.valor_unitario != null) div.querySelector('[data-f=valor_unitario]').value = Number(it.valor_unitario).toFixed(2).replace('.', ',');
    }
    return div;
  }
  function addItem(it) { $('#itens').appendChild(itemRow(it)); atualizarTotal(); }
  $('#add-item').addEventListener('click', function () { addItem(); var rows = $('#itens').querySelectorAll('[data-f=produto]'); rows[rows.length - 1].focus(); });
  $('#itens').addEventListener('click', function (e) {
    if (!e.target.closest('.rm')) return;
    if ($('#itens').children.length > 1) e.target.closest('.item').remove();
    else $('#itens').querySelectorAll('input').forEach(function (i) { i.value = ''; });
    atualizarTotal();
  });
  $('#itens').addEventListener('input', atualizarTotal);
  $('#f-taxa').addEventListener('input', atualizarTotal);
  $('#f-desconto').addEventListener('input', atualizarTotal);

  function entregaAtual() { var r = document.querySelector('input[name=entrega]:checked'); return r ? r.value : 'indefinido'; }
  document.querySelectorAll('input[name=entrega]').forEach(function (r) { r.addEventListener('change', function () { $('#taxa-box').classList.toggle('hidden', entregaAtual() !== 'entrega'); atualizarTotal(); }); });

  function lerItens() {
    return Array.prototype.map.call($('#itens').children, function (row) {
      return { produto: row.querySelector('[data-f=produto]').value, quantidade: row.querySelector('[data-f=quantidade]').value, valor_unitario: row.querySelector('[data-f=valor_unitario]').value };
    }).filter(function (i) { return i.produto.trim() || i.quantidade.trim() || i.valor_unitario.trim(); });
  }
  function atualizarTotal() {
    var total = 0;
    Array.prototype.forEach.call($('#itens').children, function (row) {
      var q = numero(row.querySelector('[data-f=quantidade]').value), v = numero(row.querySelector('[data-f=valor_unitario]').value);
      var sub = q > 0 && v >= 0 ? q * v : 0;
      total += sub;
      row.querySelector('.sub').textContent = sub ? 'Subtotal ' + brl(sub) : '';
    });
    var taxa = entregaAtual() === 'entrega' ? numero($('#f-taxa').value) : 0;
    var desc = numero($('#f-desconto').value);
    total += taxa > 0 ? taxa : 0;
    total -= desc > 0 ? desc : 0;
    $('#f-total').textContent = brl(total);
  }

  // Aviso de cliente que já comprou (busca pelo telefone no histórico inteiro)
  var telTimer = null, telSeq = 0;
  $('#f-tel').addEventListener('input', function () {
    clearTimeout(telTimer);
    var dig = $('#f-tel').value.replace(/\D/g, ''), hint = $('#tel-hint');
    hint.className = 'hint muted'; hint.textContent = '';
    if (dig.length < 10) return;
    telTimer = setTimeout(function () {
      var seq = ++telSeq;
      api('GET', 'telefone=' + encodeURIComponent(dig)).then(function (h) {
        if (seq !== telSeq) return;
        var proprio = state.editando && h.compras && state.editando.cliente_telefone === h.telefone;
        var antes = proprio ? h.compras - 1 : h.compras;
        if (!antes) { hint.textContent = 'Cliente novo'; return; }
        hint.className = 'hint ok';
        hint.textContent = 'Cliente recorrente: ' + antes + (antes > 1 ? ' compras' : ' compra') + ' antes (' + brl(h.total) + ' no total, última em ' + brDate(h.ultima) + ')';
        if (h.nome && !$('#f-nome').value.trim()) $('#f-nome').value = h.nome;
      }).catch(function () {});
    }, 400);
  });

  function openForm(p) {
    state.editando = p || null;
    $('#form-title').textContent = p ? 'Editar pedido' : 'Novo pedido';
    $('#salvar').textContent = p ? 'Salvar alterações' : 'Salvar pedido';
    $('#form-error').textContent = '';
    $('#tel-hint').className = 'hint muted'; $('#tel-hint').textContent = '';
    var importado = !!(p && p.total_planilha != null);
    $('#import-note').classList.toggle('hidden', !importado);
    if (importado) $('#import-note').textContent = 'Pedido importado da planilha. Se não mexer em produtos, entrega, taxa e desconto, o total cobrado (' + brl(p.total) + ') é mantido. Mudando algum valor, o total é recalculado e todo produto precisa de quantidade e preço.';
    $('#f-data').max = hoje();
    $('#f-data').value = p ? p.data : hoje();
    $('#f-origem').value = p ? p.origem : 'google';
    $('#f-tel').value = p && p.cliente_telefone ? fmtTel(p.cliente_telefone) : '';
    $('#f-nome').value = p && p.cliente_nome ? p.cliente_nome : '';
    $('#f-taxa').value = p && Number(p.taxa_entrega) ? Number(p.taxa_entrega).toFixed(2).replace('.', ',') : '';
    $('#f-desconto').value = p && Number(p.desconto) ? Number(p.desconto).toFixed(2).replace('.', ',') : '';
    $('#f-pesquisou').value = p && p.pesquisou ? p.pesquisou : '';
    $('#f-obs').value = p && p.observacao ? p.observacao : '';
    var ent = p ? p.entrega : 'entrega';
    document.querySelectorAll('input[name=entrega]').forEach(function (r) { r.checked = r.value === ent; });
    $('#taxa-box').classList.toggle('hidden', ent !== 'entrega');
    $('#itens').innerHTML = '';
    (p ? p.itens : [null]).forEach(function (it) { addItem(it); });
    $('#sheet').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    $('#sheet').scrollTop = 0;
    (p ? $('#f-data') : $('#f-tel')).focus();
  }
  function closeForm() { $('#sheet').classList.add('hidden'); document.body.style.overflow = ''; state.editando = null; }
  $('#novo').addEventListener('click', function () { openForm(); });
  $('#fechar').addEventListener('click', closeForm);
  $('#cancelar').addEventListener('click', closeForm);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !$('#sheet').classList.contains('hidden')) closeForm(); });

  $('#form').addEventListener('submit', function (e) {
    e.preventDefault();
    var body = {
      data: $('#f-data').value, origem: $('#f-origem').value, cliente_telefone: $('#f-tel').value, cliente_nome: $('#f-nome').value,
      itens: lerItens(), entrega: entregaAtual(), taxa_entrega: $('#f-taxa').value, desconto: $('#f-desconto').value, pesquisou: $('#f-pesquisou').value, observacao: $('#f-obs').value,
    };
    if (!body.itens.length) { $('#form-error').textContent = 'Inclua pelo menos um produto.'; return; }
    var btn = $('#salvar'), editando = state.editando;
    btn.disabled = true; $('#form-error').textContent = '';
    var req = editando ? api('PATCH', 'id=' + encodeURIComponent(editando.id), body) : api('POST', '', body);
    req.then(function (r) {
      closeForm();
      toast(editando ? 'Pedido atualizado' : 'Pedido salvo · ' + brl(r.pedido.total));
      // Se estiver vendo um mês, mostra o mês do pedido salvo
      var mes = r.pedido.data.slice(0, 7);
      if (MES_RE.test(state.periodo) && mes !== state.periodo) { state.periodo = mes; writeUrl(); }
      load();
    }).catch(function (err) { if (err.message !== '401') $('#form-error').textContent = err.message; })
      .then(function () { btn.disabled = false; });
  });

  if (token) showApp();
})();
