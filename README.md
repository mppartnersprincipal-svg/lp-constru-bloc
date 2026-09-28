# LP Construbloc

Landing page da Construbloc — material de construção em Goiânia. Projeto da M|P Assessoria.

## Estrutura

- `site/` — a página publicada: `index.html` (HTML + CSS + JS inline) e `assets/img/` (imagens otimizadas)
- `Copy_LP_Construbloc.md` — copy completa por seção
- `Design System Construbloc/` — tokens, componentes e guias da marca
- `Logos/` — arquivos originais da marca

## Rodar localmente

Abra `site/index.html` no navegador, ou sirva a pasta `site/` com qualquer servidor estático.

## Antes de publicar

- WhatsApp: (62) 3579-1166, em `site/index.html` como `556235791166` (constante `WA` no script e nos `href`). Telefone para ligações: (62) 3091-1091 (`tel:+556230911091`).
- Domínio: `canonical`, `og:url`, `og:image` e o JSON-LD usam `https://lp-construbloc.vercel.app/`. Trocar quando houver domínio próprio.

## Analytics (GA4)

1. No Google Analytics, crie a propriedade e um fluxo de dados Web para o domínio do site. Copie o **ID de métricas** (`G-XXXXXXXXXX`).
2. Em `site/index.html`, no `<head>`, cole o ID em `var GA_ID = '';`. Com o campo vazio, o GA não carrega.
3. Publique. Visualizações de página, rolagem, cliques externos e UTMs de campanha são medidos automaticamente (medição otimizada do GA4).

Eventos de clique enviados pela página (todo link com `data-cta`):

| Evento | Quando | Parâmetros |
|---|---|---|
| `whatsapp_click` | clique em qualquer link do WhatsApp | `cta_location` (ex.: `hero`, `flutuante`, `barra-mobile`), `link_url` |
| `phone_click` | clique em qualquer link de ligação | `cta_location` (ex.: `flutuante-tel`, `barra-mobile-tel`, `topbar-tel`), `link_url` |
| `cta_click` | demais links rastreados (Mercado Livre) | `cta_location`, `link_url` |

No GA4, depois do primeiro clique de teste:
- **Admin → Eventos**: marque `whatsapp_click` e `phone_click` como **evento-chave** (conversão).
- **Admin → Definições personalizadas**: crie a dimensão de evento `cta_location` para ver qual botão gerou cada contato.
- Para Google Ads, importe esses eventos-chave como conversões.

Os mesmos eventos também vão para o `dataLayer` (`{event, cta_location, link_url}`). Se preferir Google Tag Manager, instale o container do GTM, deixe `GA_ID` vazio e configure a tag GA4 por lá, para não contar tudo em dobro.

## Deploy (Vercel)

O `vercel.json` na raiz publica a pasta `site/` como site estático (sem build). Cada push no `main` gera um deploy de produção.
