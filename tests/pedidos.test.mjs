// Regras dos pedidos (api/_lib/pedidos.js): validação, total, telefone, recorrência e resumo de vendas.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  anotarRecorrencia, calcularTotal, filtrarPedidos, historicoCliente, mesesComPedidos, mesmosValores, normalizarTelefone, numero, produtosUsados, resumoVendas, texto,
  validarPedido,
} from '../api/_lib/pedidos.js';

const HOJE = '2026-11-18';
const base = (over = {}) => ({
  data: '2026-11-10', cliente_nome: 'João', cliente_telefone: '(62) 99999-1234', entrega: 'entrega', taxa_entrega: '30',
  itens: [{ produto: 'Areia média MT', quantidade: '2', valor_unitario: '120,00' }, { produto: 'Cimento CP II', quantidade: 5, valor_unitario: 38.9 }],
  ...over,
});

test('numero aceita vírgula decimal, milhar com ponto e R$', () => {
  assert.equal(numero('12,5'), 12.5);
  assert.equal(numero('1.234,56'), 1234.56);
  assert.equal(numero('R$ 38,90'), 38.9);
  assert.equal(numero('12.5'), 12.5);
  assert.equal(numero(7), 7);
  for (const v of ['', 'abc', '1,2,3', null, undefined, NaN, Infinity, {}]) assert.ok(Number.isNaN(numero(v)), String(v));
});

test('numero: ponto com 3 dígitos e sem vírgula é milhar; outros pontos são decimais', () => {
  assert.equal(numero('1.500'), 1500);
  assert.equal(numero('12.345.678'), 12345678);
  assert.equal(numero('0.500'), 0.5);
  assert.equal(numero('1.5'), 1.5);
  assert.equal(numero('2.25'), 2.25);
});

test('texto tira caracteres de controle (o Postgres recusa \\u0000)', () => {
  assert.equal(texto('Ana\u0000 Paula\u0007', 120), 'Ana Paula');
});

test('recusa total acima do que cabe no banco', () => {
  const v = validarPedido(base({ itens: [{ produto: 'Areia', quantidade: 100000, valor_unitario: 1000 }] }), { hoje: HOJE });
  assert.match(v.error, /alto demais/);
});

test('texto transforma "x", "-" e vazio em null e corta no máximo', () => {
  for (const v of ['x', 'X', ' - ', '', '   ', null]) assert.equal(texto(v, 10), null);
  assert.equal(texto('  Maria   da  Silva ', 120), 'Maria da Silva');
  assert.equal(texto('abcdefghijkl', 5), 'abcde');
});

test('normalizarTelefone guarda só dígitos, sem o 55, e recusa números curtos', () => {
  assert.equal(normalizarTelefone('(62) 99999-1234'), '62999991234');
  assert.equal(normalizarTelefone('+55 62 99999-1234'), '62999991234');
  assert.equal(normalizarTelefone('556232221234'), '6232221234');
  assert.equal(normalizarTelefone('99991234'), '99991234');
  assert.equal(normalizarTelefone('1234'), null);
  assert.equal(normalizarTelefone('x'), null);
});

test('calcula o total no servidor: itens + taxa, em centavos', () => {
  const v = validarPedido(base(), { hoje: HOJE });
  assert.equal(v.ok, true);
  assert.equal(v.pedido.total, 2 * 120 + 5 * 38.9 + 30);
  assert.equal(v.pedido.cliente_telefone, '62999991234');
  assert.equal(v.pedido.itens[0].valor_unitario, 120);
  assert.equal(calcularTotal([{ quantidade: 3, valor_unitario: 0.1 }], 0), 0.3);
});

test('desconto entra no total e não pode passar do valor do pedido', () => {
  const v = validarPedido(base({ desconto: '55,48' }), { hoje: HOJE });
  assert.equal(v.ok, true);
  assert.equal(v.pedido.desconto, 55.48);
  assert.equal(v.pedido.total, 2 * 120 + 5 * 38.9 + 30 - 55.48);
  assert.equal(validarPedido(base({ desconto: '' }), { hoje: HOJE }).pedido.desconto, 0);
  assert.match(validarPedido(base({ desconto: '-1' }), { hoje: HOJE }).error, /Desconto/);
  assert.match(validarPedido(base({ desconto: 9999 }), { hoje: HOJE }).error, /maior/);
});

test('itens importados sem quantidade ou preço (null) valem zero nos cálculos', () => {
  assert.equal(calcularTotal([{ quantidade: null, valor_unitario: null }, { quantidade: 2, valor_unitario: 5 }], 10), 20);
  const s = resumoVendas([P('z', '2026-11-01', null, 'X', 1000, [{ produto: 'Alguns itens', quantidade: null, valor_unitario: null }])], { de: '2026-11-01', ate: '2026-11-01' });
  assert.equal(s.kpis.faturamento, 1000);
  assert.deepEqual([s.produtos[0].quantidade, s.produtos[0].valor], [0, 0]);
});

test('ignora total enviado pelo navegador', () => {
  const v = validarPedido(base({ total: 1 }), { hoje: HOJE });
  assert.notEqual(v.pedido.total, 1);
});

test('retirada zera a taxa; entrega desconhecida vira indefinido', () => {
  assert.equal(validarPedido(base({ entrega: 'retirada', taxa_entrega: 50 }), { hoje: HOJE }).pedido.taxa_entrega, 0);
  const v = validarPedido(base({ entrega: 'drone' }), { hoje: HOJE });
  assert.equal(v.pedido.entrega, 'indefinido');
  assert.equal(v.pedido.taxa_entrega, 0);
});

test('recusa pedidos inválidos com mensagem clara', () => {
  const casos = [
    [null, /inválido/], [[], /inválido/],
    [base({ data: '2026-13-01' }), /Data/], [base({ data: '2026-11-25' }), /futuro/], [base({ data: '2020-01-01' }), /Data/],
    [base({ itens: [] }), /pelo menos um/],
    [base({ itens: [{ produto: '', quantidade: 1, valor_unitario: 1 }] }), /nome do produto/],
    [base({ itens: [{ produto: 'Areia', quantidade: 0, valor_unitario: 1 }] }), /quantidade/],
    [base({ itens: [{ produto: 'Areia', quantidade: 1, valor_unitario: '-3' }] }), /valor unitário/],
    [base({ itens: Array.from({ length: 51 }, () => ({ produto: 'a', quantidade: 1, valor_unitario: 1 })) }), /No máximo/],
    [base({ taxa_entrega: 'abc' }), /Taxa/],
    [base({ cliente_telefone: '123' }), /Telefone/],
  ];
  for (const [body, re] of casos) {
    const v = validarPedido(body, { hoje: HOJE });
    assert.equal(v.ok, false, JSON.stringify(body).slice(0, 80));
    assert.match(v.error, re);
  }
});

test('nome e telefone "x" ficam vazios; origem desconhecida vira google', () => {
  const v = validarPedido(base({ cliente_nome: 'x', cliente_telefone: 'X', origem: 'tiktok' }), { hoje: HOJE });
  assert.equal(v.ok, true);
  assert.equal(v.pedido.cliente_nome, null);
  assert.equal(v.pedido.cliente_telefone, null);
  assert.equal(v.pedido.origem, 'google');
});

const P = (id, data, tel, nome, total, itens = [{ produto: 'Areia', quantidade: 1, valor_unitario: total }], extra = {}) =>
  ({ id, data, cliente_telefone: tel, cliente_nome: nome, total, taxa_entrega: 0, entrega: 'entrega', itens, criado_em: `${data}T12:00:00Z`, ...extra });

const HIST = [
  P('a', '2026-10-05', '62999990001', 'Ana', 300),
  P('b', '2026-11-03', '62999990001', 'Ana Paula', 200),
  P('c', '2026-11-04', null, 'Bruno', 100),
  P('d', '2026-11-06', null, 'bruno ', 150),
  P('e', '2026-11-07', null, null, 50, [{ produto: 'Brita 1', quantidade: 2, valor_unitario: 25 }], { entrega: 'retirada' }),
  P('f', '2026-11-08', '62999990002', 'Caio', 400, [{ produto: 'Areia', quantidade: 4, valor_unitario: 90 }], { taxa_entrega: 40 }),
];

test('recorrência pelo telefone e, sem telefone, pelo nome normalizado', () => {
  const r = anotarRecorrencia(HIST);
  assert.deepEqual([r.get('a').ordem, r.get('b').ordem, r.get('b').compras], [1, 2, 2]);
  assert.deepEqual([r.get('c').ordem, r.get('d').ordem], [1, 2]);
  assert.equal(r.get('e').chave, null);
  assert.equal(r.get('f').compras, 1);
});

test('resumo de novembro: faturamento, recompra pelo histórico inteiro, produtos e por dia', () => {
  const s = resumoVendas(HIST, { de: '2026-11-01', ate: '2026-11-30' });
  assert.equal(s.kpis.pedidos, 5);
  assert.equal(s.kpis.faturamento, 900);
  assert.equal(s.kpis.ticket_medio, 180);
  assert.equal(s.kpis.recompras, 2); // b (Ana já comprou em outubro) e d (Bruno)
  assert.equal(s.kpis.receita_recompra, 350);
  assert.equal(s.kpis.pct_receita_recompra, 38.9);
  assert.equal(s.kpis.clientes, 4); // Ana, Bruno, Caio + 1 sem identificação
  assert.equal(s.kpis.sem_identificacao, 1);
  assert.equal(s.kpis.clientes_recorrentes, 2);
  assert.equal(s.kpis.taxas_entrega, 40);
  assert.equal(s.por_dia.length, 30);
  assert.equal(s.por_dia.find((d) => d.data === '2026-11-08').total, 400);
  assert.deepEqual(s.entrega, [{ key: 'entrega', value: 4 }, { key: 'retirada', value: 1 }]);
  assert.equal(s.produtos[0].produto, 'Areia');
  assert.equal(s.produtos[0].quantidade, 1 + 1 + 1 + 4);
  const ana = s.recorrentes.find((c) => c.telefone === '62999990001');
  assert.deepEqual([ana.compras, ana.total, ana.primeira, ana.ultima, ana.nome], [2, 500, '2026-10-05', '2026-11-03', 'Ana Paula']);
});

test('pedidos marcados "outro" ficam fora do vendido e aparecem à parte', () => {
  const s = resumoVendas([...HIST, P('o', '2026-11-09', null, 'Balcão', 1000, undefined, { origem: 'outro' })], { de: '2026-11-01', ate: '2026-11-30' });
  assert.equal(s.kpis.faturamento, 900);
  assert.equal(s.kpis.pedidos, 5);
  assert.deepEqual([s.kpis.fora_google_pedidos, s.kpis.fora_google_valor], [1, 1000]);
});

test('mesmosValores compara o formulário (texto) com o pedido gravado', () => {
  const atual = { entrega: 'entrega', taxa_entrega: 60, desconto: 55.48, itens: [{ produto: 'Areia', quantidade: 0.5, valor_unitario: 112.5 }, { produto: 'Alguns itens', quantidade: null, valor_unitario: null }] };
  const form = (over = {}) => ({ entrega: 'entrega', taxa_entrega: '60,00', desconto: '55,48', itens: [{ produto: 'Areia', quantidade: '0,5', valor_unitario: '112,50' }, { produto: 'Alguns itens', quantidade: '', valor_unitario: '' }], ...over });
  assert.equal(mesmosValores(form(), atual), true);
  assert.equal(mesmosValores(form({ desconto: '50' }), atual), false);
  assert.equal(mesmosValores(form({ entrega: 'retirada' }), atual), false);
  assert.equal(mesmosValores(form({ itens: [form().itens[0]] }), atual), false);
  assert.equal(mesmosValores(form({ itens: [form().itens[0], { produto: 'Alguns itens', quantidade: '1', valor_unitario: '' }] }), atual), false);
});

test('resumo de período sem pedidos não divide por zero', () => {
  const s = resumoVendas(HIST, { de: '2026-09-01', ate: '2026-09-02' });
  assert.deepEqual([s.kpis.pedidos, s.kpis.faturamento, s.kpis.ticket_medio, s.kpis.pct_receita_recompra], [0, 0, 0, 0]);
  assert.equal(s.recorrentes.length, 0);
});

test('histórico do cliente pelo telefone em qualquer formato', () => {
  const h = historicoCliente(HIST, '+55 (62) 99999-0001');
  assert.deepEqual([h.compras, h.total, h.nome, h.ultima], [2, 500, 'Ana Paula', '2026-11-03']);
  assert.equal(historicoCliente(HIST, '62 98888-0000').compras, 0);
  assert.equal(historicoCliente(HIST, '12'), null);
});

test('busca por nome sem acento, telefone parcial e produto', () => {
  const ids = (busca) => filtrarPedidos(HIST, { busca }).map((p) => p.id);
  assert.deepEqual(ids('ana'), ['a', 'b']);
  assert.deepEqual(ids('0002'), ['f']);
  assert.deepEqual(ids('BRITA'), ['e']);
  assert.deepEqual(filtrarPedidos(HIST, { de: '2026-11-05', ate: '2026-11-07' }).map((p) => p.id), ['d', 'e']);
});

test('no resumo, o nome do produto prefere a variação que não está em maiúsculas', () => {
  const s = resumoVendas([
    P('m', '2026-11-02', null, null, 10, [{ produto: 'CIMENTO 50KG', quantidade: 1, valor_unitario: 10 }]),
    P('n', '2026-11-01', null, null, 10, [{ produto: 'Cimento 50kg', quantidade: 1, valor_unitario: 10 }]),
  ], { de: '2026-11-01', ate: '2026-11-30' });
  assert.deepEqual([s.produtos[0].produto, s.produtos[0].pedidos], ['Cimento 50kg', 2]);
});

test('meses com pedidos, do mais recente para o mais antigo, com contagem e total', () => {
  assert.deepEqual(mesesComPedidos(HIST), [{ mes: '2026-11', pedidos: 5, total: 900 }, { mes: '2026-10', pedidos: 1, total: 300 }]);
  assert.deepEqual(mesesComPedidos([]), []);
});

test('produtos usados vêm do mais frequente, sem repetir variações de caixa', () => {
  const lista = produtosUsados([...HIST, P('g', '2026-11-09', null, null, 1, [{ produto: 'AREIA', quantidade: 1, valor_unitario: 1 }])]);
  assert.deepEqual(lista, ['Areia', 'Brita 1']);
});
