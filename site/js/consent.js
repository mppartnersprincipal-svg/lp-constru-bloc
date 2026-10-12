/* ============================================================================
 * Aviso de cookies (LGPD + Google Consent Mode v2) da LP Construbloc
 * - O padrão do Consent Mode fica no <head> de cada página, ANTES do GTM:
 *   sem resposta → GA4 e conversões do Ads medem; anúncios personalizados negados.
 * - "Aceitar"        → libera tudo, inclusive anúncios personalizados (remarketing).
 * - "Só o essencial" → nega análise e publicidade (Google sem cookies) e o coletor
 *   do /dashboard deixa de usar o id de visitante (js/tracker.js).
 * - A escolha fica em localStorage (cb-consent) e vai para o dataLayer como
 *   cookie_consent { consent_choice } e para o coletor via window.cbCollect.
 * - window.cbConsent.reset() apaga a escolha e reabre o aviso (política de privacidade).
 * ========================================================================== */
(function () {
  'use strict';
  if (/\/dashboard/.test(location.pathname)) return;

  var CONSENT_KEY = 'cb-consent';
  var VISITOR_KEY = 'cb-v';
  var POLICY_URL = '/politica-de-privacidade';

  function get() { try { return localStorage.getItem(CONSENT_KEY); } catch (e) { return null; } }
  function save(v) { try { localStorage.setItem(CONSENT_KEY, v); } catch (e) {} }

  var CSS =
    '.cb-consent{position:fixed;left:12px;right:12px;bottom:calc(12px + env(safe-area-inset-bottom));z-index:60;' +
    'background:#fff;color:var(--cb-ink-700,#2A3042);border-radius:var(--radius-lg,10px);border-top:4px solid var(--cb-gold-500,#E0B000);' +
    'box-shadow:0 12px 32px rgba(0,8,56,.22);padding:12px 14px;font:400 13.5px/1.45 var(--font-body,Arial,sans-serif);' +
    'transition:bottom var(--dur-base,.25s) var(--ease-out,ease-out)}' +
    'body:has(.mbar.show) .cb-consent{bottom:calc(88px + env(safe-area-inset-bottom))}' +
    '.cb-consent p{margin:0 0 10px}' +
    '.cb-consent a{color:var(--cb-blue-600,#002080);font-weight:600;text-decoration:underline;text-underline-offset:2px}' +
    '.cb-consent .cb-actions{display:flex;gap:8px}' +
    '.cb-consent button{flex:1;min-height:44px;padding:0 12px;border-radius:999px;border:2px solid var(--cb-blue-600,#002080);' +
    'font:700 13px/1 var(--font-body,Arial,sans-serif);letter-spacing:.04em;text-transform:uppercase;cursor:pointer;-webkit-tap-highlight-color:transparent}' +
    '.cb-consent .cb-yes{background:var(--cb-blue-600,#002080);color:#fff}' +
    '.cb-consent .cb-yes:hover{background:var(--cb-blue-700,#001060)}' +
    '.cb-consent .cb-no{background:#fff;color:var(--cb-blue-600,#002080)}' +
    '.cb-consent .cb-no:hover{background:var(--cb-blue-50,#F1F3FA)}' +
    '.cb-consent button:focus-visible{outline:3px solid var(--cb-gold-500,#E0B000);outline-offset:2px}' +
    // Desktop: faixa baixa de uma linha, à esquerda dos botões flutuantes (não cobre o CTA do topo)
    '@media (min-width:1024px){.cb-consent{left:24px;right:108px;bottom:24px;max-width:1100px;display:flex;align-items:center;gap:20px;padding:12px 16px 12px 20px;font-size:14px}' +
    '.cb-consent p{margin:0;flex:1}.cb-consent .cb-actions{flex:none}.cb-consent button{flex:none;padding:0 22px}}' +
    '@media (prefers-reduced-motion:reduce){.cb-consent{transition:none}}';

  var bar = null;

  function apply(choice) {
    var s = choice === 'accepted' ? 'granted' : 'denied';
    window.dataLayer = window.dataLayer || [];
    if (typeof window.gtag === 'function') {
      window.gtag('consent', 'update', {
        analytics_storage: s, ad_storage: s, ad_user_data: s, ad_personalization: s
      });
    }
    window.dataLayer.push({ event: 'cookie_consent', consent_choice: choice });
    if (window.cbCollect) window.cbCollect('cookie_consent', { consent_choice: choice });
  }

  function choose(choice) {
    save(choice);
    apply(choice);
    if (bar) { bar.remove(); bar = null; }
  }

  function show() {
    if (bar) return;
    if (!document.getElementById('cb-consent-css')) {
      var st = document.createElement('style');
      st.id = 'cb-consent-css';
      st.textContent = CSS;
      document.head.appendChild(st);
    }
    bar = document.createElement('div');
    bar.className = 'cb-consent';
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-label', 'Aviso de cookies');
    bar.innerHTML =
      '<p>Usamos cookies do Google para medir as visitas e o resultado dos nossos anúncios. ' +
      'Você pode aceitar ou ficar só com o essencial. <a href="' + POLICY_URL + '">Política de privacidade</a></p>' +
      '<div class="cb-actions">' +
      '<button type="button" class="cb-no" data-consent="essential">Só o essencial</button>' +
      '<button type="button" class="cb-yes" data-consent="accepted">Aceitar</button>' +
      '</div>';
    bar.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('[data-consent]');
      if (b) choose(b.getAttribute('data-consent'));
    });
    document.body.appendChild(bar);
  }

  window.cbConsent = {
    get: get,
    reset: function () {
      try { localStorage.removeItem(CONSENT_KEY); localStorage.removeItem(VISITOR_KEY); } catch (e) {}
      show();
    }
  };

  if (!get()) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', show); else show();
  }
})();
