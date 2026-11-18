// Pedidos dos leads do Google (tela /pedidos e seção Vendas do /dashboard). Mesmo login do painel.
// GET  /api/pedidos?de&ate&busca      → { pedidos (com recorrência), produtos (sugestões) }
// GET  /api/pedidos?resumo=1&de&ate   → resumo de vendas do período (api/_lib/pedidos.js → resumoVendas)
// GET  /api/pedidos?telefone=...      → histórico do cliente (aviso "já comprou antes")
// POST /api/pedidos                   → cria;  PATCH ?id=<uuid> → edita;  DELETE ?id=<uuid> → exclusão suave
// Autenticação: Authorization: Bearer <token de /api/login>
import * as realDb from './_lib/db.js';
import { verifyToken, bearer } from './_lib/auth.js';
import { range } from './_lib/period.js';
import {
  anotarRecorrencia, filtrarPedidos, historicoCliente, isUuid, mesesComPedidos, mesmosValores, produtosUsados, resumoVendas,
  validarCabecalho, validarPedido,
} from './_lib/pedidos.js';

const TABELA = 'construbloc_pedidos';
const MAX_BUSCA = 60;

function lerCorpo(req) {
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = null; } }
  return body;
}

/** Fábrica para os testes trocarem banco e autenticação. */
export function criarHandler({ db = realDb, autenticado = (req) => verifyToken(bearer(req)) } = {}) {
  const carregarTodos = () => db.selectAll(TABELA, 'select=*&excluido_em=is.null&order=data.desc,criado_em.desc');

  async function listar(q) {
    const todos = await carregarTodos();
    const r = range({ de: q.de, ate: q.ate });
    const rec = anotarRecorrencia(todos);
    const busca = typeof q.busca === 'string' ? q.busca.slice(0, MAX_BUSCA) : '';
    const pedidos = filtrarPedidos(todos, { de: r.de, ate: r.ate, busca })
      .map((p) => ({ ...p, compra_n: rec.get(p.id).ordem, compras_cliente: rec.get(p.id).compras }));
    return { range: { de: r.de, ate: r.ate }, pedidos, produtos: produtosUsados(todos), meses: mesesComPedidos(todos) };
  }

  async function get(q) {
    if (q.telefone) return historicoCliente(await carregarTodos(), String(q.telefone).slice(0, 40)) || { compras: 0 };
    if (q.resumo) {
      const r = range({ de: q.de, ate: q.ate });
      return resumoVendas(await carregarTodos(), { de: r.de, ate: r.ate });
    }
    return listar(q);
  }

  async function criar(body) {
    const v = validarPedido(body);
    if (!v.ok) return [400, { error: v.error }];
    const [pedido] = await db.insertReturning(TABELA, [v.pedido]);
    return [201, { pedido }];
  }

  async function editar(id, body) {
    const filtro = `id=eq.${id}&excluido_em=is.null`;
    const [atual] = await db.selectAll(TABELA, `select=*&${filtro}`, 1, 1);
    if (!atual) return [404, { error: 'Pedido não encontrado.' }];
    let campos;
    if (atual.total_planilha != null && mesmosValores(body, atual)) {
      // Importado da planilha e sem mudança de valores: só atualiza o cadastro e mantém o total cobrado
      const cab = validarCabecalho(body);
      if (!cab.ok) return [400, { error: cab.error }];
      campos = cab.campos;
    } else {
      const v = validarPedido(body);
      if (!v.ok) return [400, { error: v.error }];
      campos = v.pedido;
    }
    const rows = await db.update(TABELA, filtro, { ...campos, atualizado_em: new Date().toISOString() });
    return rows && rows.length ? [200, { pedido: rows[0] }] : [404, { error: 'Pedido não encontrado.' }];
  }

  async function excluir(id) {
    const rows = await db.update(TABELA, `id=eq.${id}&excluido_em=is.null`, { excluido_em: new Date().toISOString() });
    return rows && rows.length ? [200, { ok: true }] : [404, { error: 'Pedido não encontrado.' }];
  }

  return async function handler(req, res) {
    if (!['GET', 'POST', 'PATCH', 'DELETE'].includes(req.method)) return res.status(405).end();
    if (!autenticado(req)) return res.status(401).json({ error: 'Sessão expirada. Entre novamente.' });
    if (!db.configured()) return res.status(503).json({ error: 'Supabase não configurado (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).' });
    res.setHeader('Cache-Control', 'no-store');
    const q = req.query || {};
    try {
      if (req.method === 'GET') return res.status(200).json(await get(q));
      if (req.method === 'POST') { const [s, j] = await criar(lerCorpo(req)); return res.status(s).json(j); }
      if (!isUuid(q.id)) return res.status(400).json({ error: 'Pedido não informado.' });
      const id = q.id.toLowerCase();
      const [s, j] = req.method === 'PATCH' ? await editar(id, lerCorpo(req)) : await excluir(id);
      return res.status(s).json(j);
    } catch (err) {
      console.error('[pedidos]', err.message);
      return res.status(500).json({ error: 'Falha ao acessar o banco. Tente de novo em instantes.' });
    }
  };
}

export default criarHandler();
