# LP Construbloc

Landing page da Construbloc — material de construção em Goiânia. Projeto da M|P Assessoria.

## Estrutura

- `site/` — a página publicada: `index.html` (HTML + CSS + JS inline) e `assets/img/` (imagens otimizadas)
- `site/areia.html` → `/areia` e `site/brita.html` → `/brita` — páginas de produto para os grupos de anúncio do Google Ads (areia e brita). Preços vêm de `Areias e Britas.txt`; ao mudar um preço, atualize o hero, os cards, o FAQ visível, o JSON-LD (`Product`/`FAQPage`), as constantes da calculadora no script e o `site/llms.txt`. O CSS das duas é idêntico — altere nas duas.
- `site/sitemap.xml`, `site/robots.txt`, `site/llms.txt` — SEO e busca por IA. Atualize `lastmod` no sitemap quando uma página mudar.
- `site/assets/img/produtos/*-640.webp` / `*-960.webp` — fotos ilustrativas dos produtos (recorte 16:7), todas do Wikimedia Commons em domínio público ou CC0 (uso comercial livre, sem crédito obrigatório): areia fina [Sand.jpg](https://commons.wikimedia.org/wiki/File:Sand.jpg), areia média [Sand_Properties.jpg](https://commons.wikimedia.org/wiki/File:Sand_Properties.jpg), areia grossa [Coarse_yellow_sand.jpg](https://commons.wikimedia.org/wiki/File:Coarse_yellow_sand.jpg), brita 0 [Gravel035_16K_Color.png](https://commons.wikimedia.org/wiki/File:Gravel035_16K_Color.png), brita 1 [Gravel_Stones.jpg](https://commons.wikimedia.org/wiki/File:Gravel_Stones.jpg). Para trocar por fotos próprias, mantenha os mesmos nomes e o formato 16:7.
- `Copy_LP_Construbloc.md` — copy completa por seção
- `Design System Construbloc/` — tokens, componentes e guias da marca
- `Logos/` — arquivos originais da marca

## Rodar localmente

Abra `site/index.html` no navegador, ou sirva a pasta `site/` com qualquer servidor estático.

## Antes de publicar

- WhatsApp: (62) 3579-1166, em `site/index.html` como `556235791166` (constante `WA` no script e nos `href`). Telefone para ligações: (62) 3091-1091 (`tel:+556230911091`).
- Domínio: `canonical`, `og:url`, `og:image` e o JSON-LD usam `https://lp-constru-bloc.vercel.app/`. Trocar quando houver domínio próprio.

## Analytics (GTM + GA4 + Google Ads)

As 3 páginas carregam só o **Google Tag Manager** (`GTM-WXVXVZSF`) e enviam eventos ao `dataLayer`. GA4 (`G-0J96MVPZ7W`) e as conversões do Google Ads (`AW-11368504142`) são configurados no contêiner, nunca direto na página: não adicione `gtag.js` no HTML, senão tudo conta em dobro.

Cada página define `page_type` (`home`, `areia`, `brita`) antes do GTM carregar.

| Evento (dataLayer) | Quando | Parâmetros |
|---|---|---|
| `whatsapp_click` | clique em qualquer link do WhatsApp (`data-cta` + `wa.me`) | `cta_location` (ex.: `hero`, `areia-calculadora`), `link_url` |
| `phone_click` | clique em qualquer link de ligação (`data-cta` + `tel:`) | `cta_location` (ex.: `flutuante-tel`, `topbar-tel`), `link_url` |
| `cta_click` | demais links com `data-cta` (Mercado Livre, links entre páginas) | `cta_location`, `link_url` |
| `calculator_use` | usuário termina de editar a calculadora (areia/brita), sem repetir os mesmos valores | `product`, `product_type`, `usage` (só brita), `volume_m3` |
| `faq_open` | usuário abre uma pergunta do FAQ | `faq_question` |
| `scroll_depth` | gerado pelo GTM (acionador de rolagem 25/50/75/90%) | `percent_scrolled` |

### Contêiner GTM

`tracking/gtm-construbloc.json` tem o contêiner completo. Para instalar: GTM → **Administrador → Importar contêiner** → escolher o arquivo → espaço de trabalho existente → **Mesclar** (renomear conflitos) → **Enviar/Publicar**.

Conteúdo: tag do Google (GA4), uma tag de evento GA4 para cada evento acima, **Vinculador de conversões** e duas tags de conversão do Google Ads:
- **Contato WhatsApp** (`37BUCND_0YodEM629qwq`) dispara em `whatsapp_click`
- **Clique para Ligar** (`rPYMCPaj14odEM629qwq`) dispara em `phone_click`

### Depois de publicar

- **GA4 → Admin → Eventos**: marque `whatsapp_click` e `phone_click` como **evento-chave**.
- **GA4 → Admin → Definições personalizadas**: crie dimensões de evento para `cta_location`, `page_type`, `product`, `product_type`, `faq_question` e a métrica `volume_m3`.
- **Google Ads**: as conversões vêm das tags do GTM. **Não importe** os eventos-chave do GA4 como conversão primária, senão cada contato conta duas vezes. Em cada ação, use contagem **"Uma"** por clique no anúncio.
- **Testar**: GTM → **Visualizar** (Tag Assistant) no site publicado, clique num botão de WhatsApp e confira se as tags GA4 e Ads dispararam.

## Deploy (Vercel)

O `vercel.json` na raiz publica a pasta `site/` como site estático (sem build). Cada push no `main` gera um deploy de produção.
