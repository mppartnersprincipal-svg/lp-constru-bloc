// Agregações do /dashboard (api/_lib/report.js): calculadora, funil e KPIs.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { calculatorReport, funnels, kpis, TRUCK_M3 } from '../api/_lib/report.js';

const ev = (session_id, ts, name, props = {}, page_type = 'areia') => ({ session_id, ts, name, props, page_type });

test('calculator uses only the LAST calculation of each session per product', () => {
  const events = [
    ev('a', '2026-10-01T10:00:00Z', 'calculator_use', { product: 'areia', product_type: 'media', volume_m3: 0.5 }),
    ev('a', '2026-10-01T10:01:00Z', 'calculator_use', { product: 'areia', product_type: 'media', volume_m3: 4 }),
    ev('b', '2026-10-01T11:00:00Z', 'calculator_use', { product: 'brita', product_type: 'um', usage: 'concreto', volume_m3: 0.84 }, 'brita'),
  ];
  const sessions = { a: { id: 'a', channel: 'google_ads', wa_clicks: 1 }, b: { id: 'b', channel: 'direct' } };
  const c = calculatorReport(events, sessions);
  const areia = c.by_product.find((p) => p.product === 'areia');
  const brita = c.by_product.find((p) => p.product === 'brita');
  assert.equal(areia.uses, 2);
  assert.equal(areia.sessions, 1);
  assert.equal(areia.avg_m3, 4);
  assert.equal(areia.truck_sessions, 1);
  assert.equal(areia.converted_sessions, 1);
  assert.equal(brita.truck_sessions, 0);
  assert.equal(areia.buckets.find((b) => b.key === '3_6').value, 1);
  assert.equal(brita.buckets.find((b) => b.key === '0_5_1').value, 1);
  assert.deepEqual(c.by_usage, [{ key: 'concreto', value: 1 }]);
  assert.equal(c.truck.length, 1);
  assert.equal(c.truck[0].volume_m3, 4);
  assert.equal(c.truck[0].channel, 'google_ads');
});

test('truck threshold is inclusive at 3 m³', () => {
  assert.equal(TRUCK_M3, 3);
  const c = calculatorReport([ev('a', 't', 'calculator_use', { product: 'areia', volume_m3: 3 })], {});
  assert.equal(c.by_product[0].truck_sessions, 1);
});

test('funnel counts unique sessions per section over sessions that opened the page', () => {
  const events = [
    ev('a', 't', 'page_view'), ev('b', 't', 'page_view'),
    ev('a', 't', 'section_view', { section: 'precos' }), ev('a', 't', 'section_view', { section: 'precos' }),
    ev('b', 't', 'section_view', { section: 'topo' }),
  ];
  const f = funnels(events).areia;
  assert.equal(f.sessions, 2);
  assert.equal(f.steps.find((s) => s.key === 'precos').value, 1);
  assert.equal(f.steps.find((s) => s.key === 'precos').pct, 50);
  assert.equal(funnels(events).home.sessions, 0);
});

test('conversion counts WhatsApp OR phone, once per session', () => {
  const k = kpis([{ id: 1, wa_clicks: 2 }, { id: 2, phone_clicks: 1 }, { id: 3 }, { id: 4, wa_clicks: 1, phone_clicks: 1 }]);
  assert.equal(k.converting_sessions, 3);
  assert.equal(k.conversion_rate, 75);
  assert.equal(k.contacts, 5);
});

test("click texts containing | keep text, section and page apart", async () => {
  const { clicks } = await import("../api/_lib/report.js");
  const [row] = clicks([{ session_id: "a", name: "click", page_type: "home", props: { text: "Areia | Brita", section: "header" } }]);
  assert.deepEqual(row, { text: "Areia | Brita", section: "header", page: "home", value: 1 });
});
