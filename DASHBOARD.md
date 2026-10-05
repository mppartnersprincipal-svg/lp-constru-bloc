# Dashboard first-party da LP Construbloc

Painel de comportamento dos visitantes em **/dashboard**, no modelo da LP Gaspar Lopes:
coleta **própria, anônima e sempre ativa**, gravada no Supabase, **sem tocar** no
GTM/GA4/Ads (que seguem o `README.md` e o `tracking/gtm-construbloc.json`). O coletor
roda em paralelo ao GTM e só lê o que as páginas já mandam para o `dataLayer`.

Inclui a seção **Google Ads** do site da Sólida (investimento, cliques, conversões e
campanhas lidos da API oficial, só leitura).

## Como funciona

| Peça | Arquivo | O quê |
|---|---|---|
| Coletor | `site/js/tracker.js` | Sessão anônima em `sessionStorage` (renova após 30 min parado), id de visitante em `localStorage` por 13 meses (apagado/omitido se `cb-consent = essential`), fila com envio a cada 10 eventos / 5 s / aba oculta / `pagehide` / clique em link interno (`sendBeacon`). Sem IP, sem cookies. Não roda para bots nem no /dashboard. Lê o `page_type` do `dataLayer`. |
| Eventos | `tracker.js` + 1 linha no `track()` de cada página | Próprios: `page_view`, `page_leave` (tempo visível + rolagem máx.), `click` (texto, seção, posição), `section_view` (funil, só no coletor). Espelhados do `dataLayer` por `window.cbCollect`: `whatsapp_click`, `phone_click`, `cta_click` (`cta_location`), `calculator_use` (`product`, `product_type`, `usage`, `volume_m3`), `faq_open` (`faq_question`). O payload do `dataLayer` não muda. |
| Ingestão | `api/collect.js` + `api/_lib/payload.js` | Valida o lote, descarta bots, deriva dispositivo/navegador/SO do user-agent e cidade/UF dos cabeçalhos de geolocalização da Vercel. Grava via RPC + insert (service role). |
| Banco | `supabase/migrations/0001_construbloc_analytics.sql` | `construbloc_sessions` / `construbloc_events` + RPC `construbloc_upsert_session`. RLS ligado sem policies (só a service role acessa). |
| Atribuição | `api/_lib/classify.js` | `gclid` → Google Ads; UTM/referrer → orgânico, Instagram, Meta, Facebook, direto, indicação. Link aberto do painel do Ads ou UTM com `{keyword}` cru → direto. Mesmas regras da Gaspar/Sólida. |
| Login | `api/login.js` + `api/_lib/auth.js` | Senha única (`DASHBOARD_PASSWORD`) → token HMAC de 30 dias (`DASHBOARD_SECRET`). |
| Consulta | `api/dashboard.js` + `api/_lib/report.js` | KPIs com comparação de período, série diária, origens, página de entrada, dispositivos, WhatsApp e ligação por `cta_location` + pivô por canal, funil de leitura por página, FAQ, calculadora, campanhas UTM, jornadas, heatmap 7×24, geografia, cliques, consentimento, novo × recorrente, feed ao vivo. |
| Google Ads | `api/google-ads.js` + `api/_lib/google-ads.js` | Consulta separada: se o Ads demorar ou falhar, o resto do painel não espera nem zera. |
| UI | `site/dashboard/index.html` + `app.js` | Chart.js via CDN, filtros na URL, identidade do `Design System Construbloc/`. `noindex` + `robots.txt`. |

### Filtros

- **Período**: Hoje, 7, 30, 90 dias ou datas livres (fuso de Goiânia). Compara com o período anterior de mesmo tamanho.
- **Origem**: canal da sessão.
- **Página de entrada**: Home, /areia ou /brita (a página em que a sessão começou; é o que casa com os grupos de anúncio).
- Os gráficos "Origem" e "Página de entrada" ignoram o próprio filtro, de propósito.

### Calculadora

`calculator_use` dispara a cada edição concluída. O painel usa o **último cálculo de cada
sessão por produto** (o que a pessoa levou para o WhatsApp), não a média das tentativas.
"Usos" conta todas as edições.

**Volume de caminhão = 3 m³ ou mais** (≈ 210 sacos de areia / 225 de brita), constante
`TRUCK_M3` em `api/_lib/report.js`. A partir daí o cliente costuma pensar em caçamba a
granel; como a LP vende ensacado (melhor margem), a tabela "Quem calculou volume de
caminhão" mostra quem calculou, de onde veio e se chamou, para o comercial agir.

## Google Ads

Mostra investimento, impressões, cliques, CTR, CPC médio, conversões, custo por conversão
e uma tabela por campanha (inclusive pausadas/removidas com resultados no período), com
nome da conta, moeda e fuso. Usa o mesmo login do painel. **Só consulta relatórios; nunca
altera campanhas.**

### Configurar a conexão

1. No [Centro de API do Google Ads](https://developers.google.com/google-ads/api/docs/get-started/dev-token), obtenha um **developer token** com acesso de produção.
2. Configure um cliente OAuth no Google Cloud ([guia](https://developers.google.com/google-ads/api/docs/oauth/overview)). Autorize uma conta Google com acesso à conta anunciante, escopo `https://www.googleapis.com/auth/adwords` e acesso offline para obter um **refresh token** ([OAuth Playground](https://developers.google.com/google-ads/api/docs/oauth/playground)).
3. Cadastre as variáveis (tabela abaixo) na Vercel e faça **Redeploy**.
4. Abra /dashboard → **Google Ads** e confira nome da conta, moeda, datas e uma campanha contra o painel do Google Ads.

Sem credenciais, a seção mostra **"Conexão com o Google Ads pendente"**. Se a autorização
falhar ou o serviço estiver fora, mostra o erro **sem trocar os números por zeros**; as
outras seções continuam funcionando. Mensagens de erro do Google não são repassadas (podem
conter dados da conta).

### Como interpretar

- O período do painel vale para o Ads. As datas são inclusivas e o Google aplica o fuso da conta (exibido na seção). Os filtros de origem e de página valem só para as visitas do site.
- Totais vêm do relatório da conta (`FROM customer`); a tabela vem de `FROM campaign`. Todos os lotes do SearchStream são lidos.
- Investimento = `cost_micros / 1.000.000`. CTR = cliques / impressões; CPC = custo / cliques; custo por conversão = custo / conversões. Razão sem denominador aparece como `—`.
- **Conversões** = `metrics.conversions` (ações incluídas na coluna "Conversões" da conta: Contato WhatsApp e Clique para Ligar vindos do GTM). Podem ser fracionárias pela atribuição e mudar dias depois. Não são o mesmo número que os cliques no WhatsApp medidos pelo site.
- "Campanhas no site" usa o coletor próprio (gclid/UTM) e pode divergir do Ads por atribuição, consentimento e processamento.
- Se a conta conectada for a MCC (e não a anunciante), a seção avisa e não mostra métricas.

## Variáveis de ambiente (Vercel → Settings → Environment Variables)

Nenhuma chave vai no código nem no front. Nunca use prefixo público.

| Variável | Valor |
|---|---|
| `SUPABASE_URL` | `https://khipnjfbxjgvmjvyxero.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | supabase.com → projeto → Project Settings → API keys → `service_role` (**secreta**) |
| `DASHBOARD_PASSWORD` | você define (mín. 8 caracteres), senha da tela de login |
| `DASHBOARD_SECRET` | string aleatória longa (mín. 16), ex.: `openssl rand -hex 24` |
| `GOOGLE_ADS_CUSTOMER_ID` | `251-949-1994` (conta Construbloc; com ou sem hífens) |
| `GOOGLE_ADS_LOGIN_CUSTOMER_ID` | `603-989-2603` (MCC pela qual a conta é acessada) |
| `GOOGLE_ADS_DEVELOPER_TOKEN` | Centro de API do Google Ads |
| `GOOGLE_ADS_CLIENT_ID` / `GOOGLE_ADS_CLIENT_SECRET` | cliente OAuth do Google Cloud |
| `GOOGLE_ADS_REFRESH_TOKEN` | refresh token gerado com esse cliente |
| `GOOGLE_ADS_API_VERSION` | opcional; padrão `v25`. Atualizar conforme o [calendário de versões](https://developers.google.com/google-ads/api/docs/sunset-dates) |

Sem as duas do Supabase, a coleta descarta em silêncio (a LP nunca quebra por causa de
analytics). Sem senha/segredo, o login responde 503.

## Desenvolvimento local

```
cp .env.example .env.local   # e preencha
npm run dev                  # http://localhost:4173 (site + /api + /dashboard)
npm test                     # classify, validação do collect, agregações e Google Ads (respostas simuladas)
```

## Deploy

- O `vercel.json` continua publicando `site/` (`outputDirectory: "site"`, `cleanUrls`), então `/`, `/areia` e `/brita` não mudam. A pasta `api/` na raiz vira Vercel Functions automaticamente.
- `/dashboard` e `/api/*` saem com `X-Robots-Tag: noindex` e `Cache-Control: no-store`; o `robots.txt` bloqueia os dois.
- `.vercelignore` tira do deploy `supabase/`, `tracking/`, `tests/`, `scripts/`, fotos e logos brutos, design system e documentos.

## QA depois do deploy

- Abrir a LP, navegar, usar a calculadora, clicar em WhatsApp/ligação e conferir em /dashboard (período "Hoje", seção "Ao vivo").
- Sessões de teste podem ser apagadas com `delete from construbloc_sessions where utm_content = 'qa-seed';` (os eventos caem em cascata).

## LGPD

- Coleta anônima e agregada: sem IP, sem cookies, sem dados pessoais.
- A LP ainda não tem banner de cookies, então todo visitante aparece como "não respondeu" e recebe o id de visitante (mesma regra da Gaspar para quem não respondeu). Se um banner entrar, basta gravar `localStorage['cb-consent'] = 'accepted' | 'essential'`: "Só o essencial" apaga e omite o id persistente.
- Base: legítimo interesse para medição anônima. Recomenda-se publicar uma Política de Privacidade/Cookies simples (pendência).

## Mudar para um projeto Supabase próprio

Hoje as tabelas vivem no projeto `khipnjfbxjgvmjvyxero`, **compartilhado com a Sólida e a
Gaspar** (o plano free permite 2 projetos). A separação é por prefixo: tudo daqui começa com
`construbloc_` e nada toca em `gaspar_*`, `analytics_*`, `posts` ou `categories`. Cada site
usa a própria API e as próprias credenciais.

A troca para um projeto exclusivo não exige mudar código:

1. Crie o projeto novo (região São Paulo) e abra o **SQL Editor**.
2. Rode `supabase/migrations/0001_construbloc_analytics.sql` inteiro (idempotente).
3. **Mantenha o prefixo `construbloc_`**: os nomes estão em `api/collect.js` e `api/dashboard.js`.
4. Histórico (opcional): no projeto antigo, exporte `select * from public.construbloc_sessions` e `public.construbloc_events` em CSV; importe no novo pelo Table Editor, **sessions antes de events** (chave estrangeira), e acerte a sequência:
   ```sql
   select setval(pg_get_serial_sequence('public.construbloc_events','id'),
                 coalesce(max(id), 1)) from public.construbloc_events;
   ```
5. Na Vercel, troque `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` e faça **Redeploy**. As demais variáveis continuam iguais.
6. Confira o /dashboard no período "Hoje".
7. **Só depois de confirmar**, limpe o projeto compartilhado:
   ```sql
   drop function if exists public.construbloc_upsert_session(jsonb);
   drop table if exists public.construbloc_events;
   drop table if exists public.construbloc_sessions;
   ```
   Nunca rode um `drop` sem o prefixo `construbloc_` nesse projeto.
