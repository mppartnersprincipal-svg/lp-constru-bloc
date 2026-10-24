// POST /api/login { password } → { token } (30 dias). Senha única em DASHBOARD_PASSWORD.
// Máx. 5 falhas por IP a cada 15 min; depois 429 + Retry-After (api/_lib/rate-limit.js).
import { authConfigured, checkPassword, issueToken } from './_lib/auth.js';
import { checkLoginLimit, clientIp, hashIp, recordLoginAttempt, tooManyAttemptsMessage } from './_lib/rate-limit.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  if (!authConfigured()) return res.status(503).json({ error: 'Dashboard não configurado: defina DASHBOARD_PASSWORD (≥ 8) e DASHBOARD_SECRET (≥ 16) na Vercel.' });
  const ipHash = hashIp(clientIp((name) => req.headers[name]));
  const retryAfter = await checkLoginLimit(ipHash);
  if (retryAfter > 0) {
    res.setHeader('Retry-After', String(retryAfter));
    return res.status(429).json({ error: tooManyAttemptsMessage(retryAfter) });
  }
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = null; } }
  // Atraso fixo contra força bruta trivial
  await new Promise((r) => setTimeout(r, 400));
  if (!body || !checkPassword(body.password)) {
    await recordLoginAttempt(ipHash, false);
    return res.status(401).json({ error: 'Senha incorreta.' });
  }
  await recordLoginAttempt(ipHash, true);
  return res.status(200).json({ token: issueToken() });
}
