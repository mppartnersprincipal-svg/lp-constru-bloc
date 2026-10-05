// Agregações do /dashboard a partir das linhas cruas (sessões + eventos). Funções puras, sem rede.
// Usado por api/dashboard.js.
import { TZ_OFFSET_MS, localDate } from './period.js';

// Seções de cada página, na ordem de leitura. A chave vem do tracker: id da <section> ou aria-labelledby sem "-title".
export const SECTIONS = {
  home: ['topo', 'porque', 'loja', 'produtos', 'servicos', 'publico', 'numeros', 'pagamento', 'como-comprar', 'duvidas', 'cta-final'],
  areia: ['topo', 'resumo', 'precos', 'por-que-ensacada', 'qual-areia', 'comprar', 'duvidas', 'xsell', 'cta-final'],
  brita: ['topo', 'resumo', 'precos', 'por-que-ensacada', 'qual-brita', 'comprar', 'duvidas', 'xsell', 'cta-final'],
};
export const SECTION_LABEL = {
  topo: 'Hero', porque: 'Por que a Construbloc', loja: 'A loja', produtos: 'Produtos', servicos: 'Serviços',
  publico: 'Para quem', numeros: 'Números', pagamento: 'Pagamento', 'como-comprar': 'Como comprar',
  duvidas: 'FAQ', 'cta-final': 'CTA final', resumo: 'Resumo', precos: 'Preços', 'por-que-ensacada': 'Por que ensacada',
  'qual-areia': 'Qual areia usar', 'qual-brita': 'Qual brita usar', comprar: 'Como comprar', xsell: 'Outros produtos',
};

// Calculadora: a partir de 3 m³ (≈ 210 sacos de areia / 225 de brita) o cliente costuma pensar em
// caçamba a granel. A LP vende ensacado (melhor margem), então esse público merece atenção do comercial.
export const TRUCK_M3 = 3;
export const VOLUME_BUCKETS = [
  { key: 'ate_0_5', label: 'até 0,5 m³', min: 0, max: 0.5 },
  { key: '0_5_1', label: '0,5 a 1 m³', min: 0.5, max: 1 },
  { key: '1_3', label: '1 a 3 m³', min: 1, max: TRUCK_M3 },
  { key: '3_6', label: '3 a 6 m³ (caminhão)', min: TRUCK_M3, max: 6 },
  { key: '6_mais', label: '6 m³ ou mais (caminhão)', min: 6, max: Infinity },
];

const MAX_JOURNEYS = 60;
const MAX_TRAIL = 40;
const MAX_CLICKS = 40;
const MAX_CITIES = 15;
const MAX_TRUCK_ROWS = 30;

const pct1 = (a, b) => (b ? +(a / b * 100).toFixed(1) : 0);
const sum = (o) => Object.values(o).reduce((a, b) => a + b, 0);
const contacts = (s) => (s.wa_clicks || 0) + (s.phone_clicks || 0);
const converted = (s) => contacts(s) > 0;

export function count(arr, fn) {
  const m = {};
  arr.forEach((x) => { const k = fn(x); if (k == null || k === '') return; m[k] = (m[k] || 0) + 1; });
  return Object.entries(m).map(([key, value]) => ({ key, value })).sort((a, b) => b.value - a.value);
}

export function pivot(arr, rowFn, colFn) {
  const rows = {};
  arr.forEach((x) => { const rk = rowFn(x), ck = colFn(x); rows[rk] ||= {}; rows[rk][ck] = (rows[rk][ck] || 0) + 1; });
  return Object.entries(rows).map(([row, cols]) => ({ row, cols })).sort((a, b) => sum(b.cols) - sum(a.cols));
}

export function kpis(ss) {
  const dur = ss.filter((s) => s.duration_ms > 0);
  const scrolls = ss.filter((s) => s.max_scroll_pct != null);
  const conv = ss.filter(converted).length;
  const wa = ss.reduce((a, s) => a + (s.wa_clicks || 0), 0);
  const phone = ss.reduce((a, s) => a + (s.phone_clicks || 0), 0);
  return {
    sessions: ss.length,
    visitors: new Set(ss.map((s) => s.visitor_id || `anon-${s.id}`)).size,
    wa_clicks: wa, phone_clicks: phone, contacts: wa + phone,
    converting_sessions: conv,
    conversion_rate: pct1(conv, ss.length),
    avg_duration_s: dur.length ? Math.round(dur.reduce((a, s) => a + s.duration_ms, 0) / dur.length / 1000) : 0,
    avg_scroll_pct: scrolls.length ? Math.round(scrolls.reduce((a, s) => a + s.max_scroll_pct, 0) / scrolls.length) : 0,
    google_ads_share: pct1(ss.filter((s) => s.channel === 'google_ads').length, ss.length),
  };
}

export function daily(sessions, from, to) {
  const out = {};
  for (let d = new Date(from); d < to; d = new Date(d.getTime() + 86400000)) out[localDate(d)] = { date: localDate(d), sessions: 0, wa_clicks: 0, phone_clicks: 0 };
  sessions.forEach((s) => {
    const row = out[localDate(new Date(s.started_at))];
    if (!row) return;
    row.sessions++; row.wa_clicks += s.wa_clicks || 0; row.phone_clicks += s.phone_clicks || 0;
  });
  return Object.values(out);
}

/** Contatos (WhatsApp + ligação) por cta_location, com pivô por canal do visitante. */
export function contactReport(events, channelOf) {
  const wa = events.filter((e) => e.name === 'whatsapp_click');
  const phone = events.filter((e) => e.name === 'phone_click');
  const loc = (e) => e.props.cta_location || '(sem cta_location)';
  const both = wa.concat(phone);
  return {
    wa_by_location: count(wa, loc),
    phone_by_location: count(phone, loc),
    contact_by_page: count(both, (e) => `${e.page_type || '?'}|${e.name === 'phone_click' ? 'phone' : 'wa'}`),
    contact_location_x_channel: pivot(both, (e) => `${e.name === 'phone_click' ? 'phone' : 'wa'}|${loc(e)}`, (e) => channelOf(e.session_id)),
    cta_by_location: count(events.filter((e) => e.name === 'cta_click'), loc),
  };
}

/** Funil de leitura por página: % das sessões que abriram a página e viram cada seção. */
export function funnels(events) {
  const viewers = {}, seen = {};
  events.forEach((e) => {
    if (!e.page_type) return;
    if (e.name === 'page_view') (viewers[e.page_type] ||= new Set()).add(e.session_id);
    if (e.name === 'section_view' && e.props.section) (seen[`${e.page_type}|${e.props.section}`] ||= new Set()).add(e.session_id);
  });
  const out = {};
  Object.entries(SECTIONS).forEach(([page, keys]) => {
    const base = viewers[page]?.size || 0;
    out[page] = {
      sessions: base,
      steps: keys.map((k) => {
        const value = seen[`${page}|${k}`]?.size || 0;
        return { key: k, label: SECTION_LABEL[k] || k, value, pct: base ? Math.round(value / base * 100) : 0 };
      }),
    };
  });
  return out;
}

const bucketOf = (v) => VOLUME_BUCKETS.find((b) => v >= b.min && v < b.max)?.key;

/**
 * Calculadora. calculator_use dispara a cada edição concluída, então o volume que vale
 * é o ÚLTIMO de cada sessão por produto (o cálculo final), não a média das tentativas.
 */
export function calculatorReport(events, sessionsById) {
  const calcs = events.filter((e) => e.name === 'calculator_use' && ['areia', 'brita'].includes(e.props.product));
  const finals = {};
  calcs.forEach((e) => { finals[`${e.session_id}|${e.props.product}`] = e; }); // eventos vêm em ordem de ts
  const last = Object.values(finals).filter((e) => Number(e.props.volume_m3) > 0);
  const vol = (e) => Number(e.props.volume_m3);

  const byProduct = ['areia', 'brita'].map((product) => {
    const rows = last.filter((e) => e.props.product === product);
    const sessions = rows.map((e) => sessionsById[e.session_id]).filter(Boolean);
    const vols = rows.map(vol).sort((a, b) => a - b);
    return {
      product,
      uses: calcs.filter((e) => e.props.product === product).length,
      sessions: rows.length,
      avg_m3: vols.length ? +(vols.reduce((a, b) => a + b, 0) / vols.length).toFixed(2) : 0,
      median_m3: vols.length ? vols[Math.floor((vols.length - 1) / 2)] : 0,
      truck_sessions: rows.filter((e) => vol(e) >= TRUCK_M3).length,
      converted_sessions: sessions.filter(converted).length,
      buckets: VOLUME_BUCKETS.map((b) => ({ key: b.key, label: b.label, value: rows.filter((e) => bucketOf(vol(e)) === b.key).length })),
    };
  });

  const truck = last.filter((e) => vol(e) >= TRUCK_M3)
    .sort((a, b) => (a.ts < b.ts ? 1 : -1))
    .slice(0, MAX_TRUCK_ROWS)
    .map((e) => {
      const s = sessionsById[e.session_id] || {};
      return {
        ts: e.ts, product: e.props.product, product_type: e.props.product_type || null, usage: e.props.usage || null,
        volume_m3: vol(e), channel: s.channel || null, city: s.city || null, device: s.device || null,
        wa_clicks: s.wa_clicks || 0, phone_clicks: s.phone_clicks || 0,
      };
    });

  return {
    truck_m3: TRUCK_M3,
    by_product: byProduct,
    by_type: count(last, (e) => `${e.props.product}|${e.props.product_type || '?'}`),
    by_usage: count(last.filter((e) => e.props.product === 'brita'), (e) => e.props.usage || '?'),
    truck,
  };
}

export function campaigns(sessions) {
  const map = {};
  sessions.filter((s) => s.channel === 'google_ads' || s.utm_campaign).forEach((s) => {
    const k = [s.utm_campaign || '(sem utm_campaign)', s.utm_content || '', s.utm_term || ''].join('|');
    map[k] ||= { campaign: s.utm_campaign || '(sem utm_campaign)', content: s.utm_content || '', term: s.utm_term || '', channel: s.channel, page: s.landing_page_type, sessions: 0, wa_clicks: 0, phone_clicks: 0, converting: 0 };
    const c = map[k];
    c.sessions++; c.wa_clicks += s.wa_clicks || 0; c.phone_clicks += s.phone_clicks || 0; if (converted(s)) c.converting++;
  });
  return Object.values(map).sort((a, b) => b.sessions - a.sessions);
}

export function heatmap(sessions) {
  const m = Array.from({ length: 7 }, () => Array(24).fill(0));
  sessions.forEach((s) => { const d = new Date(new Date(s.started_at).getTime() + TZ_OFFSET_MS); m[d.getUTCDay()][d.getUTCHours()]++; });
  return m;
}

export function clicks(events) {
  return count(events.filter((e) => e.name === 'click'), (e) => JSON.stringify([e.props.text || '(sem texto)', e.props.section || '', e.page_type || '']))
    .slice(0, MAX_CLICKS)
    .map((c) => { const [text, section, page] = JSON.parse(c.key); return { text, section, page, value: c.value }; });
}

const PAGE_NAME = { home: 'Home', areia: 'Areia', brita: 'Brita' };
export function trail(evs) {
  const steps = [];
  evs.forEach((e) => {
    const p = e.props;
    if (e.name === 'page_view') steps.push({ t: e.ts, kind: 'page', text: `Abriu ${PAGE_NAME[e.page_type] || 'a página'}` });
    else if (e.name === 'section_view') steps.push({ t: e.ts, kind: 'section', text: SECTION_LABEL[p.section] || p.section });
    else if (e.name === 'whatsapp_click') steps.push({ t: e.ts, kind: 'wa', text: `WhatsApp (${p.cta_location || ''})` });
    else if (e.name === 'phone_click') steps.push({ t: e.ts, kind: 'wa', text: `Ligação (${p.cta_location || ''})` });
    else if (e.name === 'cta_click') steps.push({ t: e.ts, kind: 'action', text: `Link: ${p.cta_location || ''}` });
    else if (e.name === 'calculator_use') steps.push({ t: e.ts, kind: 'calc', text: `Calculou ${p.product} ${p.product_type || ''}${p.usage ? ' / ' + p.usage : ''}: ${String(p.volume_m3).replace('.', ',')} m³` });
    else if (e.name === 'faq_open') steps.push({ t: e.ts, kind: 'action', text: `FAQ: ${p.faq_question}` });
    else if (e.name === 'click' && p.text && !/wa\.me|tel:/.test(p.href || '')) steps.push({ t: e.ts, kind: 'click', text: `${p.text}${p.section ? ' · ' + p.section : ''}` });
    else if (e.name === 'page_leave') steps.push({ t: e.ts, kind: 'leave', text: `Saiu (${Math.round((p.duration_ms || 0) / 1000)} s, ${p.max_scroll_pct || 0}% da página)` });
  });
  return steps.slice(0, MAX_TRAIL);
}

/** jornadas = conv (WhatsApp ou ligação) | calc (usou a calculadora) | todas */
export function journeys(sessions, evBySession, mode) {
  const usedCalc = (s) => (evBySession[s.id] || []).some((e) => e.name === 'calculator_use');
  const keep = mode === 'todas' ? () => true : mode === 'calc' ? usedCalc : converted;
  return sessions.filter(keep).slice(0, MAX_JOURNEYS).map((s) => ({
    id: s.id, started_at: s.started_at, channel: s.channel, campaign: s.utm_campaign, content: s.utm_content, term: s.utm_term,
    page: s.landing_page_type, device: s.device, browser: s.browser, os: s.os, city: s.city, region: s.region, returning: s.is_returning,
    duration_s: Math.round((s.duration_ms || 0) / 1000), max_scroll_pct: s.max_scroll_pct,
    wa_clicks: s.wa_clicks, phone_clicks: s.phone_clicks,
    trail: trail(evBySession[s.id] || []),
  }));
}

/** Monta o relatório completo. sessionsAll/prevAll já vêm do período; filtros aplicados aqui. */
export function buildReport({ r, sessionsAll, prevAll, eventsAll, origem, pagina, jornadas }) {
  const pass = (s) => (!origem || s.channel === origem) && (!pagina || s.landing_page_type === pagina);
  const sessions = sessionsAll.filter(pass);
  const sid = new Set(sessions.map((s) => s.id));
  const events = eventsAll.filter((e) => sid.has(e.session_id));
  const byIdAll = Object.fromEntries(sessionsAll.map((s) => [s.id, s]));
  const channelOf = (id) => byIdAll[id]?.channel || 'other';
  const evBySession = {};
  events.forEach((e) => (evBySession[e.session_id] ||= []).push(e));

  return {
    kpis: { current: kpis(sessions), previous: kpis(prevAll.filter(pass)) },
    daily: daily(sessions, r.from, r.to),
    // Origem e página de entrada mostram o período inteiro de propósito (ignoram o próprio filtro)
    channels: count(sessionsAll.filter((s) => !pagina || s.landing_page_type === pagina), (s) => s.channel || 'other'),
    pages: count(sessionsAll.filter((s) => !origem || s.channel === origem), (s) => s.landing_page_type || '?'),
    devices: count(sessions, (s) => s.device),
    browsers: count(sessions, (s) => s.browser),
    os: count(sessions, (s) => s.os),
    cities: count(sessions, (s) => (s.city ? `${s.city}${s.region ? ' · ' + s.region : ''}` : null)).slice(0, MAX_CITIES),
    regions: count(sessions, (s) => s.region),
    consent: count(sessions, (s) => s.consent || 'nao_respondeu'),
    audience: count(sessions, (s) => (s.is_returning ? 'recorrente' : 'novo')),
    ...contactReport(events, channelOf),
    funnels: funnels(events),
    faq: count(events.filter((e) => e.name === 'faq_open'), (e) => `${e.page_type || '?'}|${e.props.faq_question || '?'}`),
    calculator: calculatorReport(events, byIdAll),
    campaigns: campaigns(sessions),
    clicks: clicks(events),
    heatmap: heatmap(sessions),
    journeys: journeys(sessions, evBySession, jornadas),
  };
}
