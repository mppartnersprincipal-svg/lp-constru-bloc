// Regras dos pedidos (/pedidos e seção Vendas do /dashboard). Funções puras, sem banco: testadas em tests/pedidos.test.mjs.
// O total nunca vem do navegador: é sempre soma dos itens + taxa de entrega, calculada aqui.
import { addDays, localDate } from './period.js';

export const ENTREGAS = new Set(['entrega', 'retirada', 'indefinido']);
export const ORIGENS = new Set(['google', 'outro']);
export const MAX_ITENS = 50;
const MAX_QTD = 100_000;
const MAX_VALOR = 1_000_000;
const MAX_TOTAL = 9_999_999.99; // cabe em numeric(10,2) e numeric(12,2)
const DATA_MIN = '2023-01-01';
const YMD = /^\d{4}-\d{2}-\d{2}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// Preenchimentos de "não sei" que apareciam na planilha
const VAZIOS = new Set(['x', '-', '.', '?', 'n/a', 'na', 'sem', 'nao', 'não']);

export const isUuid = (v) => typeof v === 'string' && UUID.test(v);
export const centavos = (n) => Math.round(n * 100) / 100;

/**
 * Número vindo do formulário (padrão brasileiro): 12,5 · 1.234,56 · 1.500 (mil e quinhentos) · 12.5 · 12.
 * Ponto seguido de exatamente 3 dígitos e sem vírgula é milhar. Devolve NaN se não for número.
 */
export function numero(v) {
  if (typeof v === 'number') return Number.isFinite(v) ? v : NaN;
  if (typeof v !== 'string') return NaN;
  let s = v.trim().replace(/^R\$\s*/i, '');
  if (!s) return NaN;
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  else if (/^-?[1-9]\d{0,2}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
  return /^-?\d+(\.\d+)?$/.test(s) ? Number(s) : NaN;
}

/** Texto opcional: apara, tira caracteres de controle, corta no máximo e transforma "x", "-" e vazio em null. */
export function texto(v, max) {
  if (v == null) return null;
  // eslint-disable-next-line no-control-regex
  const s = String(v).replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!s || VAZIOS.has(s.toLowerCase())) return null;
  return s.slice(0, max);
}

/** Telefone só com dígitos e sem o 55 do país. null se não parecer telefone (menos de 8 dígitos). */
export function normalizarTelefone(v) {
  if (v == null) return null;
  let d = String(v).replace(/\D/g, '');
  if (d.startsWith('55') && (d.length === 12 || d.length === 13)) d = d.slice(2);
  if (d.length > 11) d = d.slice(-11);
  return d.length >= 8 ? d : null;
}

/** Chave para comparar textos: minúsculas, sem acento, espaços simples. */
export function normalizarChave(v) {
  return String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
}

/** Quem é o cliente: telefone (preferência) ou nome normalizado. null se não há nenhum dos dois. */
export function chaveCliente(p) {
  if (p.cliente_telefone) return `t:${p.cliente_telefone}`;
  const nome = normalizarChave(p.cliente_nome);
  return nome ? `n:${nome}` : null;
}

/** quantidade × valor de um item; itens importados sem qtd/preço (null) valem 0. */
export const valorItem = (i) => (Number(i.quantidade) || 0) * (Number(i.valor_unitario) || 0);

export function calcularTotal(itens, taxa = 0, desconto = 0) {
  return centavos(itens.reduce((s, i) => s + valorItem(i), 0) + (taxa || 0) - (desconto || 0));
}

function dataValida(v, hoje) {
  if (!YMD.test(v || '')) return false;
  const d = new Date(`${v}T00:00:00Z`);
  if (Number.isNaN(d.getTime()) || !d.toISOString().startsWith(v)) return false;
  return v >= DATA_MIN && v <= addDays(hoje, 1);
}

function validarItens(lista) {
  if (!Array.isArray(lista) || !lista.length) return { error: 'Inclua pelo menos um produto.' };
  if (lista.length > MAX_ITENS) return { error: `No máximo ${MAX_ITENS} produtos por pedido.` };
  const itens = [];
  for (let i = 0; i < lista.length; i++) {
    const it = lista[i] || {}, n = i + 1;
    const produto = texto(it.produto, 120);
    const quantidade = numero(it.quantidade);
    const valor = numero(it.valor_unitario);
    if (!produto) return { error: `Produto ${n}: informe o nome do produto.` };
    if (!(quantidade > 0) || quantidade > MAX_QTD) return { error: `Produto ${n} (${produto}): quantidade inválida.` };
    if (!(valor >= 0) || valor > MAX_VALOR) return { error: `Produto ${n} (${produto}): valor unitário inválido.` };
    itens.push({ produto, quantidade: Math.round(quantidade * 1000) / 1000, valor_unitario: centavos(valor) });
  }
  return { itens };
}

/**
 * Campos do pedido que não mexem em dinheiro: data, cliente, origem, pesquisa e observação.
 * @returns {{ ok: true, campos: object } | { ok: false, error: string }}
 */
export function validarCabecalho(body, { hoje = localDate(new Date()) } = {}) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { ok: false, error: 'Pedido inválido.' };
  if (!dataValida(body.data, hoje)) return { ok: false, error: 'Data inválida (não pode ser no futuro).' };
  const telefoneBruto = texto(body.cliente_telefone, 40);
  const telefone = normalizarTelefone(telefoneBruto);
  if (telefoneBruto && !telefone) return { ok: false, error: 'Telefone inválido: use DDD + número.' };
  return {
    ok: true,
    campos: {
      data: body.data,
      cliente_nome: texto(body.cliente_nome, 120),
      cliente_telefone: telefone,
      pesquisou: texto(body.pesquisou, 200),
      observacao: texto(body.observacao, 1000),
      origem: ORIGENS.has(body.origem) ? body.origem : 'google',
    },
  };
}

const valorOuNull = (v) => (v == null || v === '' ? null : numero(v));
const mesmoNumero = (a, b) => (a == null || Number.isNaN(a) ? null : centavos(a)) === (b == null ? null : centavos(Number(b)));

/**
 * O formulário mandou os mesmos produtos, quantidades, preços, entrega, taxa e desconto que já estão gravados?
 * Usado para editar pedidos importados da planilha (itens sem preço, total cobrado) sem recalcular o total.
 */
export function mesmosValores(body, atual) {
  if (!body || !Array.isArray(body.itens) || !Array.isArray(atual.itens) || body.itens.length !== atual.itens.length) return false;
  const entrega = ENTREGAS.has(body.entrega) ? body.entrega : 'indefinido';
  if (entrega !== atual.entrega) return false;
  const taxa = entrega === 'entrega' ? valorOuNull(body.taxa_entrega) ?? 0 : 0;
  if (!mesmoNumero(taxa, atual.taxa_entrega ?? 0) || !mesmoNumero(valorOuNull(body.desconto) ?? 0, atual.desconto ?? 0)) return false;
  return body.itens.every((it, i) => {
    const old = atual.itens[i] || {};
    return texto(it?.produto, 120) === old.produto
      && mesmoNumero(valorOuNull(it?.quantidade), old.quantidade)
      && mesmoNumero(valorOuNull(it?.valor_unitario), old.valor_unitario);
  });
}

/**
 * Valida o corpo de POST/PATCH e devolve a linha pronta para gravar (sem id e sem datas de controle).
 * @returns {{ ok: true, pedido: object } | { ok: false, error: string }}
 */
export function validarPedido(body, { hoje = localDate(new Date()) } = {}) {
  const cab = validarCabecalho(body, { hoje });
  if (!cab.ok) return cab;
  const { itens, error } = validarItens(body.itens);
  if (error) return { ok: false, error };
  const entrega = ENTREGAS.has(body.entrega) ? body.entrega : 'indefinido';
  let taxa = 0;
  if (entrega === 'entrega' && body.taxa_entrega != null && body.taxa_entrega !== '') {
    taxa = numero(body.taxa_entrega);
    if (!(taxa >= 0) || taxa > MAX_VALOR) return { ok: false, error: 'Taxa de entrega inválida.' };
    taxa = centavos(taxa);
  }
  let desconto = 0;
  if (body.desconto != null && body.desconto !== '') {
    desconto = numero(body.desconto);
    if (!(desconto >= 0) || desconto > MAX_VALOR) return { ok: false, error: 'Desconto inválido.' };
    desconto = centavos(desconto);
    if (desconto > calcularTotal(itens, taxa)) return { ok: false, error: 'O desconto é maior que o valor do pedido.' };
  }
  const total = calcularTotal(itens, taxa, desconto);
  if (total > MAX_TOTAL) return { ok: false, error: 'Valor total alto demais: confira quantidades e preços.' };
  return {
    ok: true,
    pedido: { ...cab.campos, itens, entrega, taxa_entrega: taxa, desconto, total },
  };
}

// Mesmo dia: ordem de cadastro; importados (mesmo criado_em) seguem a linha da planilha.
const linhaPlanilha = (p) => Number(String(p.ref_planilha || '').split('!')[1]) || 0;
const cronologico = (a, b) => (a.data < b.data ? -1 : a.data > b.data ? 1
  : String(a.criado_em || '').localeCompare(String(b.criado_em || '')) || linhaPlanilha(a) - linhaPlanilha(b) || String(a.id).localeCompare(String(b.id)));

/**
 * Para cada pedido: em qual compra do cliente ele está (1 = primeira) e quantas compras o cliente tem no total.
 * @returns {Map<string, { ordem: number, compras: number, chave: string|null }>}
 */
export function anotarRecorrencia(pedidos) {
  const porCliente = new Map();
  const out = new Map();
  for (const p of [...pedidos].sort(cronologico)) {
    const chave = chaveCliente(p);
    if (!chave) { out.set(p.id, { ordem: 1, compras: 1, chave: null }); continue; }
    const lista = porCliente.get(chave) || [];
    porCliente.set(chave, [...lista, p.id]);
    out.set(p.id, { ordem: lista.length + 1, compras: 0, chave });
  }
  for (const ids of porCliente.values()) for (const id of ids) out.set(id, { ...out.get(id), compras: ids.length });
  return out;
}

/** Resumo de um cliente pelo telefone (aviso de "já comprou antes" no formulário). */
export function historicoCliente(pedidos, telefone) {
  const tel = normalizarTelefone(telefone);
  if (!tel) return null;
  const doCliente = pedidos.filter((p) => p.cliente_telefone === tel).sort(cronologico);
  if (!doCliente.length) return { telefone: tel, compras: 0 };
  const ultimo = doCliente[doCliente.length - 1];
  const nome = [...doCliente].reverse().find((p) => p.cliente_nome)?.cliente_nome || null;
  return {
    telefone: tel, nome, compras: doCliente.length,
    total: centavos(doCliente.reduce((s, p) => s + Number(p.total), 0)),
    primeira: doCliente[0].data, ultima: ultimo.data,
  };
}

/** Nomes de produto já usados (para o datalist), do mais frequente para o menos. */
export function produtosUsados(pedidos, max = 150) {
  const cont = new Map();
  for (const p of pedidos) for (const it of p.itens || []) {
    const k = normalizarChave(it.produto);
    const atual = cont.get(k) || { nome: it.produto, n: 0 };
    cont.set(k, { nome: atual.nome, n: atual.n + 1 });
  }
  return [...cont.values()].sort((a, b) => b.n - a.n).slice(0, max).map((x) => x.nome);
}

const somar = (m, k, delta) => m.set(k, (m.get(k) || 0) + delta);
const caixaAlta = (s) => /[A-ZÀ-Ý]/.test(s) && s === s.toUpperCase();
/** Entre variações do mesmo produto, mostra a que não está toda em maiúsculas. */
const nomeExibicao = (atual, novo) => (caixaAlta(atual) && !caixaAlta(novo) ? novo : atual);

/**
 * Números da seção Vendas. `todos` = todos os pedidos (não excluídos) para a recorrência valer o histórico inteiro;
 * os totais consideram só os pedidos com data em [de, ate].
 */
export function resumoVendas(todos, { de, ate }) {
  const rec = anotarRecorrencia(todos);
  const noPeriodo = todos.filter((p) => p.data >= de && p.data <= ate);
  // A seção é de leads do Google (o ROAS divide pelo investimento do Ads): "outro" fica à parte
  const periodo = noPeriodo.filter((p) => p.origem !== 'outro');
  const fora = noPeriodo.filter((p) => p.origem === 'outro');
  const faturamento = centavos(periodo.reduce((s, p) => s + Number(p.total), 0));
  const recompras = periodo.filter((p) => rec.get(p.id).ordem > 1);
  const receitaRecompra = centavos(recompras.reduce((s, p) => s + Number(p.total), 0));

  const clientes = new Set(), semId = periodo.filter((p) => !rec.get(p.id).chave).length;
  for (const p of periodo) if (rec.get(p.id).chave) clientes.add(rec.get(p.id).chave);

  const dia = new Map(), diaN = new Map(), mes = new Map(), mesN = new Map();
  const entrega = new Map(), produtos = new Map();
  let taxas = 0;
  for (const p of periodo) {
    const t = Number(p.total);
    somar(dia, p.data, t); somar(diaN, p.data, 1);
    somar(mes, p.data.slice(0, 7), t); somar(mesN, p.data.slice(0, 7), 1);
    somar(entrega, p.entrega, 1);
    taxas += Number(p.taxa_entrega) || 0;
    for (const it of p.itens || []) {
      const k = normalizarChave(it.produto);
      const atual = produtos.get(k) || { produto: it.produto, quantidade: 0, valor: 0, pedidos: 0 };
      produtos.set(k, { ...atual, produto: nomeExibicao(atual.produto, it.produto), quantidade: atual.quantidade + (Number(it.quantidade) || 0), valor: atual.valor + valorItem(it), pedidos: atual.pedidos + 1 });
    }
  }
  const porDia = [];
  for (let d = de; d <= ate; d = addDays(d, 1)) porDia.push({ data: d, total: centavos(dia.get(d) || 0), pedidos: diaN.get(d) || 0 });

  // Clientes com 2+ compras no histórico e pelo menos uma no período
  const porChave = new Map();
  for (const p of todos) {
    const r = rec.get(p.id);
    if (!r.chave || r.compras < 2) continue;
    const atual = porChave.get(r.chave) || { nome: null, telefone: p.cliente_telefone, compras: r.compras, total: 0, primeira: p.data, ultima: p.data, noPeriodo: false };
    porChave.set(r.chave, {
      ...atual,
      nome: p.cliente_nome || atual.nome,
      total: atual.total + Number(p.total),
      primeira: p.data < atual.primeira ? p.data : atual.primeira,
      ultima: p.data > atual.ultima ? p.data : atual.ultima,
      noPeriodo: atual.noPeriodo || (p.data >= de && p.data <= ate),
    });
  }
  const recorrentes = [...porChave.values()].filter((c) => c.noPeriodo)
    .map(({ noPeriodo, ...c }) => ({ ...c, total: centavos(c.total) }))
    .sort((a, b) => b.compras - a.compras || b.total - a.total);

  return {
    range: { de, ate },
    kpis: {
      faturamento,
      pedidos: periodo.length,
      ticket_medio: periodo.length ? centavos(faturamento / periodo.length) : 0,
      clientes: clientes.size + semId,
      sem_identificacao: semId,
      recompras: recompras.length,
      receita_recompra: receitaRecompra,
      pct_receita_recompra: faturamento ? Math.round((receitaRecompra / faturamento) * 1000) / 10 : 0,
      clientes_recorrentes: recorrentes.length,
      taxas_entrega: centavos(taxas),
      fora_google_pedidos: fora.length,
      fora_google_valor: centavos(fora.reduce((s, p) => s + Number(p.total), 0)),
    },
    por_dia: porDia,
    por_mes: [...mes.keys()].sort().map((m) => ({ mes: m, total: centavos(mes.get(m)), pedidos: mesN.get(m) })),
    entrega: ['entrega', 'retirada', 'indefinido'].map((k) => ({ key: k, value: entrega.get(k) || 0 })).filter((x) => x.value),
    produtos: [...produtos.values()].map((p) => ({ ...p, quantidade: Math.round(p.quantidade * 1000) / 1000, valor: centavos(p.valor) }))
      .sort((a, b) => b.valor - a.valor).slice(0, 15),
    recorrentes: recorrentes.slice(0, 30),
  };
}

/** Filtro da lista por período e busca (nome, telefone ou produto). Em JS: nada da busca entra na URL do banco. */
export function filtrarPedidos(pedidos, { de, ate, busca }) {
  const q = normalizarChave(busca);
  const digitos = String(busca || '').replace(/\D/g, '');
  return pedidos.filter((p) => {
    if (de && p.data < de) return false;
    if (ate && p.data > ate) return false;
    if (!q) return true;
    if (digitos.length >= 4 && (p.cliente_telefone || '').includes(digitos)) return true;
    return normalizarChave(p.cliente_nome).includes(q) || (p.itens || []).some((i) => normalizarChave(i.produto).includes(q));
  });
}
