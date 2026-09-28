# Construbloc Design System

Brand system for **Construbloc — Materiais de Construção e Ferragista**, a building-materials and hardware retailer in Goiânia (GO), Brazil, with two units on Av. Madrid (Jardim Europa). Built to drive a landing page (LP) and other marketing surfaces.

## Sources
- Logos provided by the user: `uploads/LOGO CONSTRUBLOC SEM FUNDO.png` (color) and `uploads/LOGO CONSTRUBLOC SEM FUNDO PRETO.png` (black). All colors below were sampled from the color logo.
- Instagram: https://www.instagram.com/construbloc_/ — **not accessible** from this environment (login wall). Public search snippets of the brand's posts were used for copy tone and store facts. Palette, photography style and post typography from Instagram are NOT yet reflected; see Caveats.
- Public facts found: units at Av. Madrid 275 and 420 (Goiânia); phones (62) 3579-1166 / 98243-0522 / 98331-5040; open every day incl. weekends and holidays; delivery; online sales; up to 12x installments; brands carried include Tigre, Tramontina, Quartzolit, Suvinil, Lorenzetti, Votomassa, Atlas, Blukit.

## Content fundamentals
- Language: Brazilian Portuguese. Second person informal "você"; the store speaks as "nós/a gente" ("Aqui na Construbloc você encontra…").
- Tone: direct, practical, reassuring. Promises are concrete: open every day, delivery, 12x, big brands, fair prices. No jargon, no hype adjectives beyond "qualidade" and "preços acessíveis".
- Casing: headlines UPPERCASE (display font). Body sentence case. Buttons uppercase.
- Instagram posts use emoji as bullets (📍 📱 🚛 💳) and hashtags heavily. On the site/LP, **do not use emoji**; use Lucide icons for the same meaning (pin, phone, truck, credit-card).
- Recurring lines: "Tudo para sua obra"; "Qualidade, grandes marcas e preços acessíveis"; "Fazemos entregas"; "Parcelamos em até 12x (consulte nossas condições)"; "Abertos todos os dias, incluindo sábados, domingos e feriados".

## Visual foundations
- **Colors** (`tokens/colors.css`): Blue 600 `#002080` is primary (wordmark). Deeper navies `#000060` / `#000838` for dark sections. Gold 500 `#E0B000` (hammer) is the single accent, sliding to Yellow 300 `#F8F050` in the brand gradient. Gray 500 `#808080` is the tagline gray, used for eyebrows/muted labels. Blue carries structure (headings, primary buttons, dark bands); gold points at the one action per section; white/very light gray for surfaces. WhatsApp green `#25D366` is allowed only for WhatsApp buttons.
- **Type** (`tokens/typography.css`): Display **Russo One** (uppercase headlines; echoes the squared wordmark). Body **Barlow** 400–700. Labels **Barlow Condensed** 600–700, uppercase, letter-spacing .18em (mirrors the tagline). Scale 12→64px. Headlines are tight (1.05), body 1.5–1.65. *Substitution:* these are Google Fonts stand-ins; the logo's original typefaces were not provided.
- **Spacing**: 4px base; container 1200px; section padding 80px.
- **Corners**: small — 2/4/6/10px. The logo is built from squared bars; avoid big rounding. Pills only for filter Tags.
- **Shadows**: navy-tinted (`rgba(0,8,56,…)`), sm/md/lg. Cards: white, 1px `--border-default` hairline OR md shadow; hover lifts 3px with lg shadow.
- **Backgrounds**: flat fills. Alternate white / Surface 100 / Blue 600 / Blue 900 bands. No photographic full-bleed behind text; photos live in their own frames. Gold gradient appears only as a thin top rule (6–8px) or in the roof motif.
- **Motif**: the roof line. Diagonal clips (`--clip-roof`) on hero images and section transitions; gold-left / blue-right splits; the white symbol as a low-opacity watermark on dark panels.
- **Imagery**: real store/product photography expected (warehouse aisles, cement bags, tools, delivery truck). Until provided, striped placeholders are used. Keep photos bright and neutral; no heavy filters.
- **Motion**: fast (120–200ms) ease-out; color changes on hover, 1px press translate on buttons, 3px lift on hoverable cards. No bounces.
- **States**: hover = darker shade of same color (blue 700 / gold 600) or Blue 50 tint on light; active = one step darker; focus = 3px gold ring (`--focus-ring`); disabled = 45% opacity.
- **Transparency/blur**: none, except white-on-dark links at 80% and watermark at 7%.

## Iconography
- No proprietary icon set exists. Use **Lucide** (2–2.5px stroke, round caps) — matches the clean geometric logo. CDN: `https://unpkg.com/lucide@latest` or inline SVG paths as done in `ui_kits/site/Site.jsx`.
- The brand symbol (roof + hammer) is a logo, not an icon: use it as a watermark or favicon, never inline with text.
- No emoji on web surfaces. Unicode arrows are fine in text links ("→").

## Assets (`assets/`)
logo-color.png · logo-black.png · logo-white.png (derived from black) · symbol-color/black/white.png · wordmark-color/white.png. Clear space ≥ height of the window in the symbol. Minimum height 40px for the full lockup; use symbol alone below that.

## Index
- `styles.css` → imports `tokens/{fonts,colors,typography,spacing,effects}.css`
- `guidelines/` — specimen cards (Colors, Type, Spacing, Brand)
- `components/core/` — Button, IconButton, Input, Select, Checkbox, Badge, Tag, Card, Tabs, Accordion, Dialog, Toast (+ `core.card.html`)
- `ui_kits/site/` — landing page (`index.html`, `Site.jsx`, README)
- `SKILL.md` — agent skill entry point

## Intentional additions
- **Accordion** (FAQ) and **whatsapp** Button variant — the store sells via WhatsApp; both are essential for the LP.

## Caveats
- Instagram content unreachable: palette/typography/photos from posts not incorporated. Upload screenshots or exports of recent posts to calibrate.
- Fonts are Google Fonts substitutes; provide the original logo typefaces if available.
- Store hours in the UI kit ("7h às 18h") are a placeholder — confirm.
