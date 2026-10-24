// Limite de tentativas do login do /dashboard: no máximo 5 falhas por IP a cada 15 min → 429 + Retry-After.
// Duas camadas, vale a mais restritiva:
//  1) Tabela construbloc_login_attempts no Supabase (service role): compartilhada entre as instâncias da Vercel.
//  2) Map em memória: vale só para a instância da função que atendeu (a Vercel pode subir várias e
//     reciclá-las a qualquer hora). Segura o limite se o banco não estiver configurado ou se a migration
//     supabase/migrations/0003_construbloc_login_attempts.sql ainda não tiver sido aplicada.
// O IP nunca é gravado: só sha256(salt fixo do projeto + IP).
import { createHash } from 'node:crypto';
import { configured, insert, selectAll } from './db.js';

export const MAX_FAILURES = 5;
export const WINDOW_MS = 15 * 60 * 1000;
const TABLE = 'construbloc_login_attempts';
const SALT = 'construbloc-dashboard-login-v1';
const MAX_TRACKED_IPS = 10000; // teto do Map: rajada de IPs diferentes não estoura a memória

/** ipHash → instantes (ms) das falhas ainda dentro da janela. */
const failures = new Map();
let warned = false;

const firstValue = (v) => (Array.isArray(v) ? v[0] : v);

/** IP do cliente: 1º valor de x-forwarded-for, senão x-real-ip. `getHeader(nome)` serve para Node e Fetch API. */
export function clientIp(getHeader) {
  const forwarded = String(firstValue(getHeader('x-forwarded-for')) || '').split(',')[0].trim();
  return forwarded || String(firstValue(getHeader('x-real-ip')) || '').trim() || 'desconhecido';
}

export const hashIp = (ip) => createHash('sha256').update(`${SALT}:${ip}`).digest('hex');

export const tooManyAttemptsMessage = (seconds) =>
  `Muitas tentativas. Tente de novo em ${Math.max(1, Math.ceil(seconds / 60))} min.`;

/** Segundos até a falha mais antiga que ainda conta sair da janela (0 = liberado). */
function retryAfterSeconds(failureTimesDesc, now) {
  if (failureTimesDesc.length < MAX_FAILURES) return 0;
  const releaseAt = failureTimesDesc[MAX_FAILURES - 1] + WINDOW_MS;
  return Math.max(1, Math.ceil((releaseAt - now) / 1000));
}

/** Remove do Map as falhas fora da janela e os IPs que ficaram sem nenhuma. */
function pruneExpired(now) {
  for (const [key, times] of failures) {
    const recent = times.filter((t) => now - t < WINDOW_MS);
    if (recent.length) failures.set(key, recent);
    else failures.delete(key);
  }
}

function warnOnce(err) {
  if (warned) return;
  warned = true;
  console.error('[login] limite só em memória (por instância); Supabase indisponível:', err.message);
}

function memoryRetryAfter(ipHash, now) {
  pruneExpired(now);
  const times = [...(failures.get(ipHash) || [])].sort((a, b) => b - a);
  return retryAfterSeconds(times, now);
}

async function databaseRetryAfter(ipHash, now) {
  if (!configured()) return 0;
  const since = encodeURIComponent(new Date(now - WINDOW_MS).toISOString());
  const query = `select=created_at&ip_hash=eq.${ipHash}&success=eq.false&created_at=gte.${since}&order=created_at.desc`;
  const rows = await selectAll(TABLE, query, MAX_FAILURES, MAX_FAILURES);
  return retryAfterSeconds(rows.map((r) => Date.parse(r.created_at)), now);
}

/** Segundos que o IP ainda precisa esperar (0 = pode tentar). Nunca lança. */
export async function checkLoginLimit(ipHash, now = Date.now()) {
  const fromMemory = memoryRetryAfter(ipHash, now);
  let fromDatabase = 0;
  try {
    fromDatabase = await databaseRetryAfter(ipHash, now);
  } catch (err) {
    warnOnce(err);
  }
  return Math.max(fromMemory, fromDatabase);
}

/** Registra a tentativa (falha conta para o limite; sucesso fica só no histórico do banco). Nunca lança. */
export async function recordLoginAttempt(ipHash, success, now = Date.now()) {
  if (!success) {
    if (!failures.has(ipHash) && failures.size >= MAX_TRACKED_IPS) failures.delete(failures.keys().next().value);
    failures.set(ipHash, [...(failures.get(ipHash) || []), now]);
  }
  if (!configured()) return;
  try {
    await insert(TABLE, [{ ip_hash: ipHash, success }]);
  } catch (err) {
    warnOnce(err);
  }
}

/** Só para testes. */
export function resetLoginLimitMemory() {
  failures.clear();
  warned = false;
}
