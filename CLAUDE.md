# LP Construbloc — instruções para o Claude

Landing page da Construbloc (material de construção, Goiânia). Cliente da M|P Assessoria. Site estático (HTML/CSS/JS inline), sem build, deploy automático na Vercel a cada push no `main`.

@MEMORIA.md

## Onde está cada coisa

Detalhes completos no `README.md` (estrutura, tracking, deploy). Resumo:
- `site/index.html` (home), `site/areia.html`, `site/brita.html` (páginas de Google Ads). CSS de areia/brita é idêntico: alterar nas duas.
- `site/sitemap.xml`, `robots.txt`, `llms.txt`: atualizar `lastmod` e `llms.txt` quando o conteúdo mudar.
- `tracking/gtm-construbloc.json`: contêiner GTM. Nunca colocar `gtag.js` direto no HTML (conta em dobro).
- `Areias e Britas.txt`: fonte dos preços. `Copy_LP_Construbloc.md`: copy. `Design System Construbloc/`: tokens e guias da marca.

## Regras do projeto

- Domínio oficial: `https://www.construbloc.site/`.
- Foco em produtos **ensacados** (20 kg). Não posicionar venda a granel / m³.
- Conversão na calculadora: areia 70 sacos/m³, brita 75 sacos/m³.
- Ao mudar preço: hero, cards, FAQ visível, JSON-LD (`Product`/`FAQPage`), constantes da calculadora e `llms.txt`.
- Copy sem travessões (—).
- Commits em português, formato `tipo: descrição` (feat, fix, perf, chore, docs...).

## Memória do projeto (OBRIGATÓRIO)

Ao terminar qualquer tarefa que altere o projeto ou registre uma decisão, adicione **uma linha** em `MEMORIA.md`, na data de hoje:
- Formato: `- tipo: o que foi feito (arquivos principais) — motivo/decisão, se houver`
- Seja curto. Não repita o que o README já documenta nem o diff do git.
- Decisões e preferências do cliente que valem para o futuro vão na seção "Decisões vigentes" (substitua a antiga se mudar).
- Pendências vão em "Pendências"; remova quando resolver.
- Se o arquivo passar de ~150 linhas, compacte as entradas antigas em um resumo por mês.
