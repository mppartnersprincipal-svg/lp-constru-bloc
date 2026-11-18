// Endpoint /api/pedidos (api/pedidos.js) com banco e login falsos.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { criarHandler } from '../api/pedidos.js';

const ID = '3f2b8c1e-9a4d-4e6f-8b2a-1c3d5e7f9a0b';
const hoje = new Date(Date.now() - 3 * 3600000).toISOString().slice(0, 10);

function fakeDb(linhas = []) {
  const calls = [];
  return {
    calls,
    configured: () => true,
    selectAll: async (table, query) => {
      calls.push(['select', table, query]);
      const id = (query.match(/id=eq\.([0-9a-f-]+)/) || [])[1];
      return id ? linhas.filter((l) => l.id === id) : linhas;
    },
    insertReturning: async (table, rows) => { calls.push(['insert', table, rows]); return rows.map((r) => ({ id: ID, ...r })); },
    update: async (table, filter, body) => { calls.push(['update', table, filter, body]); return linhas.some((l) => filter.includes(l.id)) ? [{ id: ID, ...body }] : []; },
  };
}

async function chamar(handler, { method = 'GET', query = {}, body } = {}) {
  const res = { statusCode: 200, body: null, headers: {} };
  res.status = (c) => { res.statusCode = c; return res; };
  res.json = (o) => { res.body = o; return res; };
  res.end = () => res;
  res.setHeader = (k, v) => { res.headers[k] = v; };
  await handler({ method, query, body, headers: {} }, res);
  return res;
}

const pedidoOk = { data: hoje, cliente_nome: 'Ana', cliente_telefone: '62 99999-0001', entrega: 'retirada', itens: [{ produto: 'Areia', quantidade: 2, valor_unitario: '100' }] };

test('sem login responde 401 e não toca no banco', async () => {
  const db = fakeDb();
  const h = criarHandler({ db, autenticado: () => false });
  for (const method of ['GET', 'POST', 'PATCH', 'DELETE']) assert.equal((await chamar(h, { method })).statusCode, 401);
  assert.equal(db.calls.length, 0);
});

test('método não suportado responde 405', async () => {
  assert.equal((await chamar(criarHandler({ db: fakeDb(), autenticado: () => true }), { method: 'PUT' })).statusCode, 405);
});

test('POST valida, calcula o total e grava', async () => {
  const db = fakeDb();
  const h = criarHandler({ db, autenticado: () => true });
  const r = await chamar(h, { method: 'POST', body: JSON.stringify({ ...pedidoOk, total: 999999 }) });
  assert.equal(r.statusCode, 201);
  const [, table, rows] = db.calls.find((c) => c[0] === 'insert');
  assert.equal(table, 'construbloc_pedidos');
  assert.equal(rows[0].total, 200);
  assert.equal(rows[0].cliente_telefone, '62999990001');
});

test('POST inválido responde 400 sem gravar', async () => {
  const db = fakeDb();
  const r = await chamar(criarHandler({ db, autenticado: () => true }), { method: 'POST', body: { ...pedidoOk, itens: [] } });
  assert.equal(r.statusCode, 400);
  assert.match(r.body.error, /produto/);
  assert.equal(db.calls.length, 0);
});

test('PATCH e DELETE exigem id uuid; o filtro nunca recebe texto livre', async () => {
  const db = fakeDb([{ id: ID }]);
  const h = criarHandler({ db, autenticado: () => true });
  for (const id of [undefined, 'abc', `${ID}&excluido_em=is.null`, `${ID},x`, [ID, ID]]) {
    assert.equal((await chamar(h, { method: 'DELETE', query: { id } })).statusCode, 400, String(id));
    assert.equal((await chamar(h, { method: 'PATCH', query: { id }, body: pedidoOk })).statusCode, 400, String(id));
  }
  assert.equal(db.calls.length, 0);
  const edit = await chamar(h, { method: 'PATCH', query: { id: ID }, body: pedidoOk });
  assert.equal(edit.statusCode, 200);
  assert.equal(db.calls.at(-1)[3].total, 200);
  const del = await chamar(h, { method: 'DELETE', query: { id: ID.toUpperCase() } });
  assert.equal(del.statusCode, 200);
  const [, , filter, body] = db.calls.at(-1);
  assert.equal(filter, `id=eq.${ID}&excluido_em=is.null`);
  assert.ok(body.excluido_em);
});

const importado = {
  id: ID, data: hoje, cliente_nome: 'Construtora Teste', cliente_telefone: null, entrega: 'entrega', taxa_entrega: 150, desconto: 0,
  total: 1461.6, total_planilha: 1461.6, ref_planilha: 'OUTUBRO!102',
  itens: [{ produto: 'Canaleta concreto 14x19x39', quantidade: 190, valor_unitario: null }, { produto: 'Tijolo furado', quantidade: null, valor_unitario: null }],
};
const formImportado = (over = {}) => ({
  data: hoje, cliente_nome: 'Construtora Teste', cliente_telefone: '62 90000-0003', entrega: 'entrega', taxa_entrega: '150,00', desconto: '', observacao: 'ligar antes',
  itens: [{ produto: 'Canaleta concreto 14x19x39', quantidade: '190', valor_unitario: '' }, { produto: 'Tijolo furado', quantidade: '', valor_unitario: '' }],
  ...over,
});

test('PATCH de pedido importado sem mudar valores mantém o total cobrado e só atualiza o cadastro', async () => {
  const db = fakeDb([importado]);
  const r = await chamar(criarHandler({ db, autenticado: () => true }), { method: 'PATCH', query: { id: ID }, body: formImportado() });
  assert.equal(r.statusCode, 200);
  const body = db.calls.at(-1)[3];
  assert.deepEqual(Object.keys(body).sort(), ['atualizado_em', 'cliente_nome', 'cliente_telefone', 'data', 'observacao', 'origem', 'pesquisou']);
  assert.equal(body.cliente_telefone, '62900000003');
});

test('PATCH de pedido importado mudando valores exige preço em todos os itens e recalcula', async () => {
  const db = fakeDb([importado]);
  const h = criarHandler({ db, autenticado: () => true });
  const semPreco = await chamar(h, { method: 'PATCH', query: { id: ID }, body: formImportado({ taxa_entrega: '100' }) });
  assert.equal(semPreco.statusCode, 400);
  const itens = [{ produto: 'Canaleta concreto 14x19x39', quantidade: '190', valor_unitario: '5,87' }, { produto: 'Tijolo furado', quantidade: '50', valor_unitario: '1,80' }];
  const ok = await chamar(h, { method: 'PATCH', query: { id: ID }, body: formImportado({ itens }) });
  assert.equal(ok.statusCode, 200);
  assert.equal(db.calls.at(-1)[3].total, Math.round((190 * 5.87 + 50 * 1.8 + 150) * 100) / 100);
});

test('PATCH/DELETE de pedido inexistente responde 404', async () => {
  const h = criarHandler({ db: fakeDb([]), autenticado: () => true });
  assert.equal((await chamar(h, { method: 'DELETE', query: { id: ID } })).statusCode, 404);
  assert.equal((await chamar(h, { method: 'PATCH', query: { id: ID }, body: pedidoOk })).statusCode, 404);
});

test('GET lista com recorrência, resumo e histórico por telefone', async () => {
  const linhas = [
    { id: 'a', data: hoje, cliente_telefone: '62999990001', cliente_nome: 'Ana', total: 100, taxa_entrega: 0, entrega: 'retirada', itens: [{ produto: 'Areia', quantidade: 1, valor_unitario: 100 }], criado_em: `${hoje}T10:00:00Z` },
    { id: 'b', data: hoje, cliente_telefone: '62999990001', cliente_nome: 'Ana', total: 50, taxa_entrega: 0, entrega: 'retirada', itens: [{ produto: 'Brita', quantidade: 1, valor_unitario: 50 }], criado_em: `${hoje}T11:00:00Z` },
  ];
  const db = fakeDb(linhas);
  const h = criarHandler({ db, autenticado: () => true });
  const lista = await chamar(h, { query: { de: hoje, ate: hoje } });
  assert.equal(lista.statusCode, 200);
  assert.deepEqual(lista.body.pedidos.map((p) => [p.id, p.compra_n, p.compras_cliente]), [['a', 1, 2], ['b', 2, 2]]);
  assert.deepEqual(lista.body.produtos, ['Areia', 'Brita']);
  assert.match(db.calls[0][2], /excluido_em=is\.null/);
  const resumo = await chamar(h, { query: { resumo: '1', de: hoje, ate: hoje } });
  assert.equal(resumo.body.kpis.faturamento, 150);
  const hist = await chamar(h, { query: { telefone: '(62) 99999-0001' } });
  assert.equal(hist.body.compras, 2);
});

test('falha do banco vira 500 com mensagem genérica', async () => {
  const db = { ...fakeDb(), selectAll: async () => { throw new Error('Supabase GET → 500 segredo'); } };
  const orig = console.error; console.error = () => {};
  try {
    const r = await chamar(criarHandler({ db, autenticado: () => true }));
    assert.equal(r.statusCode, 500);
    assert.doesNotMatch(r.body.error, /segredo/);
  } finally { console.error = orig; }
});
