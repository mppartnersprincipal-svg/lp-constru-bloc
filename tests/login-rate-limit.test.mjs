// Limite de tentativas do login do /dashboard (api/_lib/rate-limit.js). Sem SUPABASE_*: só a camada em memória.
import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import {
  MAX_FAILURES, WINDOW_MS, checkLoginLimit, clientIp, hashIp, recordLoginAttempt, resetLoginLimitMemory, tooManyAttemptsMessage,
} from '../api/_lib/rate-limit.js';

delete process.env.SUPABASE_URL;
delete process.env.SUPABASE_SERVICE_ROLE_KEY;

const NOW = Date.parse('2026-10-23T15:00:00Z');
const headers = (h) => (name) => h[name];

beforeEach(() => resetLoginLimitMemory());

test('IP vem do 1º valor de x-forwarded-for, senão de x-real-ip', () => {
  assert.equal(clientIp(headers({ 'x-forwarded-for': '200.1.2.3, 10.0.0.1', 'x-real-ip': '9.9.9.9' })), '200.1.2.3');
  assert.equal(clientIp(headers({ 'x-real-ip': ' 9.9.9.9 ' })), '9.9.9.9');
  assert.equal(clientIp(headers({ 'x-forwarded-for': ['1.1.1.1, 2.2.2.2'] })), '1.1.1.1');
  assert.equal(clientIp(headers({})), 'desconhecido');
});

test('hash do IP é sha256 hex e não contém o IP', () => {
  const h = hashIp('200.1.2.3');
  assert.match(h, /^[0-9a-f]{64}$/);
  assert.equal(h, hashIp('200.1.2.3'));
  assert.notEqual(h, hashIp('200.1.2.4'));
});

test(`bloqueia depois de ${MAX_FAILURES} falhas na janela e informa o Retry-After`, async () => {
  const ip = hashIp('200.1.2.3');
  for (let i = 0; i < MAX_FAILURES; i++) {
    assert.equal(await checkLoginLimit(ip, NOW + i * 1000), 0, `tentativa ${i + 1} ainda liberada`);
    await recordLoginAttempt(ip, false, NOW + i * 1000);
  }
  const wait = await checkLoginLimit(ip, NOW + MAX_FAILURES * 1000);
  assert.equal(wait, (WINDOW_MS - MAX_FAILURES * 1000) / 1000);
  assert.equal(await checkLoginLimit(hashIp('200.1.2.4'), NOW), 0, 'outro IP segue liberado');
});

test('libera quando a falha mais antiga sai da janela de 15 min', async () => {
  const ip = hashIp('200.1.2.3');
  for (let i = 0; i < MAX_FAILURES; i++) await recordLoginAttempt(ip, false, NOW + i * 1000);
  assert.ok((await checkLoginLimit(ip, NOW + WINDOW_MS - 1)) > 0);
  assert.equal(await checkLoginLimit(ip, NOW + WINDOW_MS), 0);
});

test('sucesso não conta como falha', async () => {
  const ip = hashIp('200.1.2.3');
  for (let i = 0; i < MAX_FAILURES; i++) await recordLoginAttempt(ip, true, NOW + i);
  assert.equal(await checkLoginLimit(ip, NOW + MAX_FAILURES), 0);
});

test('mensagem do 429 em minutos, sem revelar nada da senha', () => {
  assert.equal(tooManyAttemptsMessage(900), 'Muitas tentativas. Tente de novo em 15 min.');
  assert.equal(tooManyAttemptsMessage(5), 'Muitas tentativas. Tente de novo em 1 min.');
});
