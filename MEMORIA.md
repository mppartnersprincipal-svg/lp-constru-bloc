# Memória do projeto — LP Construbloc

Histórico resumido para dar contexto em novas conversas. Mantido pelo Claude (ver regras no `CLAUDE.md`).

## Decisões vigentes

- Domínio: www.construbloc.site (sem www redireciona). Repo: github.com/mppartnersprincipal-svg/lp-constru-bloc
- Tracking só via GTM `GTM-WXVXVZSF` (GA4 `G-0J96MVPZ7W`, Ads `AW-11368504142`). Conversões Ads vêm das tags GTM, não importar eventos-chave do GA4.
- Foco em ensacados 20 kg (areia R$ 10, brita R$ 10, desde 12/10/2026). Granel/m³ removido do posicionamento (margem melhor no ensacado).
- Calculadora: areia 70 sacos/m³, brita 75 sacos/m³.
- Cookies: Google mede até a pessoa clicar "Só o essencial"; remarketing só com "Aceitar" (decisão do Pedro, para não derrubar conversões do Ads). Coletor mede 100%.
- WhatsApp (62) 3579-1166; ligação (62) 3091-1091.
- Página /ferragens (hidráulica, elétrica, fechaduras, ferramentas) **sem preço**, só consulta no WhatsApp (decisão do Pedro, 19/10). Usa as fotos reais da loja até o cliente mandar fotos novas.
- Fotos de produto: Wikimedia Commons (domínio público/CC0), formato 16:7, WebP 640/960.
- Dashboard /dashboard: tabelas `construbloc_*` no Supabase compartilhado (Sólida/Gaspar). Volume de caminhão = 3 m³ ou mais (`TRUCK_M3`). Filtro de página = página de entrada. GA4 via conta de serviço da agência `dashboard-ga4@mp-dashboard-501816` (Leitor; propriedade 556611801). UTMs do Ads no sufixo do URL final de cada grupo.

## Pendências

- Confirmar no GA4: `whatsapp_click` e `phone_click` como evento-chave + dimensões personalizadas (ver README).
- Testar tags no GTM Preview no site publicado.
- Dashboard: confirmar que os próximos cliques do Ads chegam com UTM (sufixo por grupo: areia-brita-goiania/areia|brita, material-construcao-perto-de-mim/material-construcao).
- Ferragens: cliente ainda vai mandar fotos novas de chuveiros/hidráulica/elétrica (salvar em `Fotos Loja/`); confirmar com ele os itens listados em cada categoria (tubos, disjuntores etc. foram inferidos).

## Histórico

### 2026-09-28
- chore: versão original da LP importada como base.
- feat: botão flutuante de ligação + eventos GA4.
- perf: otimização mobile (LCP, CLS, peso inicial). Lighthouse varia entre execuções (86–100); CLS zerado.
- fix: domínio provisório lp-constru-bloc.vercel.app.
- feat: páginas `/areia` e `/brita` para grupos do Google Ads, com calculadora, FAQ, JSON-LD, sitemap, robots, llms.txt.

### 2026-09-29
- feat: fotos reais de areia/brita; travessões removidos da copy.
- feat: tracking migrado para GTM (GA4 + conversões Ads), contêiner em `tracking/`.
- fix: domínio oficial www.construbloc.site em canonical, OG, JSON-LD, sitemap, robots, llms.txt.

### 2026-09-30
- feat: links Areia/Brita no header da home; remoção de venda a granel/m³ das páginas e do llms.txt.
- fix: fatores da calculadora corrigidos (estavam invertidos) para areia 70 / brita 75.
- docs: criados `CLAUDE.md` e `MEMORIA.md` para manter contexto entre conversas.

### 2026-10-05
- feat: dashboard first-party em /dashboard (coletor `site/js/tracker.js`, `api/`, migration, Google Ads só leitura, testes; ver `DASHBOARD.md`). Coletor espelha o dataLayer sem alterar GTM.

### 2026-10-06
- feat: seção GA4 no /dashboard via Data API, só leitura com conta de serviço (`api/ga4.js`, `api/_lib/ga4.js`, testes) — mostra o que o GA4 mediu ao lado do coletor próprio, sem mudar o GTM.
- chore: migration `0001_construbloc_analytics.sql` aplicada no Supabase (khipnjfbxjgvmjvyxero) — painel vazio porque as tabelas não existiam e a Vercel está sem as variáveis do Supabase (coletor descarta em silêncio).
- chore: variáveis da Vercel completas (Supabase, senha, Google Ads, GA4); as 3 fontes do /dashboard conferidas em produção.

### 2026-10-07
- chore: Search Console verificado (propriedade de domínio construbloc.site via TXT), sitemap enviado e indexação pedida para /, /areia e /brita.

### 2026-10-12
- fix: reajuste dos ensacados pedido pelo cliente, areia R$ 8 → R$ 10 e brita R$ 9 → R$ 10 (areia.html, brita.html, llms.txt, sitemap, Areias e Britas.txt).
- feat: aviso de cookies com Consent Mode v2 + /politica-de-privacidade (`js/consent.js`, head das 3 páginas, tracker, migration 0002 aplicada) — escolha vai ao dashboard; "Só o essencial" apaga id de visitante.

### 2026-10-19
- feat: página /ferragens (`site/ferragens.html`, ducha Zagonel em `ducha-zagonel-*.webp`), links no header/rodapé da home, areia e brita; card "Ferragens em Geral" da home agora leva a /ferragens; `ferragens` aceito como page_type no coletor/dashboard (payload, report, filtros) + testes; sitemap e llms.txt — pedido do cliente por página de itens internos da loja.
