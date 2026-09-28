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

## Deploy (Vercel)

O `vercel.json` na raiz publica a pasta `site/` como site estático (sem build). Cada push no `main` gera um deploy de produção.
