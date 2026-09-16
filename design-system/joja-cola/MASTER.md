# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** Joja Cola
**Generated:** 2026-09-15 19:46:03
**Updated:** 2026-09-16 (genjutsu:paint — página inicial, consumer-first pass)
**Category:** Luxury/Premium Brand
**Design Dials:** Variance 6/10 (Balanced / Modern) | Motion 8/10 (Complex) | Density 5/10 (Standard)
**Audience:** Consumidor final primeiro (lifestyle/emocional). A camada B2B (produção/logística/marketing) é secundária na mesma página — tom continua premium, evita densidade corporativa.

---

## Global Rules

### Color Palette

Corrigido para bater com os tokens realmente implementados em `src/styles.css` (o MASTER.md original divergia do código — esta é agora a fonte de verdade real). **Travado pelo usuário — não alterar sem pedido explícito.**

| Role | Hex | CSS Variable |
|------|-----|--------------|
| Background | `#081329` | `--bg` |
| Panel | `#0a162e` | `--panel` |
| Card | `#0e1e3d` | `--card` |
| Line/Border | `#1e3a64` | `--line` |
| Primary/Navy | `#033c91` | `--navy` |
| Accent/Cyan | `#00e5ff` | `--cyan` |
| Sky | `#38bdf8` | `--sky` |
| Text | `#f8fafc` | `--text` |
| Body | `#cbd5e1` | `--body` |
| Muted | `#94a3b8` | `--muted` |
| Destructive | `#fb7185` | `--danger` |
| Success | `#34d399` | `--ok` |

**Color Notes:** Navy profundo + glow cyan. Nada de preto puro (`#000`) — sempre `--bg`/`--panel`/`--card` como degradê de profundidade.

### Typography

- **Heading Font:** Inter
- **Body Font:** Inter
- **Mood:** dark, cinematic, technical, precision, clean, premium, developer, professional, high-end utility
- **Google Fonts:** [Inter + Inter](https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap)

**CSS Import:**
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
```

### Spacing Variables

*Density: 5/10 — Standard*

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | `4px` / `0.25rem` | Tight gaps |
| `--space-sm` | `8px` / `0.5rem` | Icon gaps, inline spacing |
| `--space-md` | `16px` / `1rem` | Standard padding |
| `--space-lg` | `24px` / `1.5rem` | Section padding |
| `--space-xl` | `32px` / `2rem` | Large gaps |
| `--space-2xl` | `48px` / `3rem` | Section margins |
| `--space-3xl` | `64px` / `4rem` | Hero padding |

### Shadow Depths

| Level | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle lift |
| `--shadow-md` | `0 4px 6px rgba(0,0,0,0.1)` | Cards, buttons |
| `--shadow-lg` | `0 10px 15px rgba(0,0,0,0.1)` | Modals, dropdowns |
| `--shadow-xl` | `0 20px 25px rgba(0,0,0,0.15)` | Hero images, featured cards |

---

## Component Specs

**Estilo (validado 2026-09-16):** glassmorphism suave — cantos arredondados, borda fina `var(--line)`, glow cyan difuso no hover/foco. Nunca anguloso/HUD — essa opção foi avaliada e rejeitada em favor da linguagem já usada no hero.

### Buttons

```css
/* Primary Button */
.btn-primary {
  background: var(--navy);
  border: 1px solid var(--sky);
  color: var(--text);
  padding: 12px 24px;
  border-radius: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
  transition: border-color 120ms ease-out, box-shadow 200ms ease-out, transform 120ms ease-out;
  cursor: pointer;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 0 24px rgba(0, 229, 255, 0.25);
}

/* Secondary / Ghost Button */
.btn-ghost {
  background: transparent;
  border: 1px solid var(--line);
  color: var(--text);
  padding: 12px 24px;
  border-radius: 10px;
  font-weight: 700;
  transition: border-color 120ms ease-out, color 120ms ease-out;
  cursor: pointer;
}
.btn-ghost:hover { border-color: var(--sky); color: var(--cyan); }
```

### Cards (glow)

```css
.card-glow {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 0 0 rgba(0, 229, 255, 0);
  transition: box-shadow 240ms ease-out, border-color 240ms ease-out, transform 240ms ease-out;
}

.card-glow:hover {
  border-color: rgba(0, 229, 255, 0.4);
  box-shadow: 0 0 40px rgba(0, 229, 255, 0.12);
  transform: translateY(-2px);
}
```

### Inputs

```css
.input {
  padding: 12px 16px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: #06101f;
  color: var(--text);
  font-size: 16px;
  transition: border-color 200ms ease;
}

.input:focus {
  border-color: var(--cyan);
  outline: none;
  box-shadow: 0 0 0 3px rgba(0, 229, 255, 0.15);
}
```

### Modals

```css
.modal-overlay {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.modal {
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: var(--shadow-xl);
  max-width: 500px;
  width: 90%;
}
```

---

## Style Guidelines

**Style:** Modern Dark (Cinema Mobile)

**Keywords:** dark mode, cinematic, ambient light, glassmorphism, deep black, indigo, glow, blur, atmospheric, reanimated, haptic, premium, layered, frosted glass, linear gradient

**Best For:** Developer tools, pro productivity apps, fintech/trading dashboards, media/streaming platforms, AI tool interfaces, high-end gaming companion apps

**Key Effects:** Expo.out Bezier(0.16,1,0.3,1) easing; spring modals (damping:20 stiffness:90); haptic-linked press (Impact Light/Medium); animated ambient light blobs (Reanimated translateX/Y slow oscillation); BlurView glassmorphism headers/nav (intensity 20); scale press 0.97 → 1.0; avoid pure #000000 (OLED smear)

### Page Pattern

**Pattern Name:** Storytelling + Feature-Rich

- **CTA Placement:** Above fold
- **Section Order:** Hero > Features > CTA

---

## Motion

Implementado com GSAP + ScrollTrigger (`src/pages/Landing.tsx`, tokens em `src/lib/motion.ts`). Duas escalas de tempo, nunca misturadas:

| Escala | Quando | Duração | Easing | Stagger |
|---|---|---|---|---|
| **Cinema** (única, hero) | Entrada da página, uma vez só | `DURATION_CINEMA` 700ms | `expo.out` (Bezier 0.16,1,0.3,1) | `STAGGER_CINEMA` 150ms |
| **UI** (recorrente) | Hover, reveal ao rolar, tudo depois do hero | `DURATION` 420ms | `power2.out` / `EASE_OUT` (Bezier 0.22,1,0.32,1) | `STAGGER` 80ms |

**Reveal ao rolar (todas as seções, não só "Três sistemas"):**

```js
gsap.from(sectionItems, {
  autoAlpha: 0,
  y: RISE, // 16px
  duration: DURATION,
  stagger: STAGGER,
  ease: "power2.out",
  scrollTrigger: { trigger: section, start: "top 85%", toggleActions: "play none none none" },
});
```

- ✅ Todo `gsap.from`/`gsap.to` scroll-driven passa por `scrollTrigger`, nunca por `useEffect` + IntersectionObserver manual
- ✅ Hover usa `scale: 1.02` + intensifica o glow cyan (`box-shadow`), nunca `scale` sozinho sem o glow
- ❌ Nada de elastic/bounce em nenhuma easing do projeto
- ❌ Nada abaixo de 150ms em elemento interativo (corte seco = quebra a sensação premium)
- ❌ Nunca misturar a escala Cinema num elemento de UI recorrente (fica lento/pesado)

---

## Anti-Patterns (Do NOT Use)

- ❌ Cheap visuals
- ❌ Fast animations (below 150ms on anything interactive)
- ❌ Elastic/bounce easing anywhere in the project
- ❌ Angular/HUD card style (evaluated, rejected — stays soft/glow)
- ❌ Pure black `#000000` backgrounds — always the navy scale

### Additional Forbidden Patterns

- ❌ **Emojis as icons** — Use SVG icons (Heroicons, Lucide, Simple Icons)
- ❌ **Missing cursor:pointer** — All clickable elements must have cursor:pointer
- ❌ **Layout-shifting hovers** — Avoid scale transforms that shift layout
- ❌ **Low contrast text** — Maintain 4.5:1 minimum contrast ratio
- ❌ **Instant state changes** — Always use transitions (150-300ms)
- ❌ **Invisible focus states** — Focus states must be visible for a11y

---

## Pre-Delivery Checklist

Before delivering any UI code, verify:

- [ ] No emojis used as icons (use SVG instead)
- [ ] All icons from consistent icon set (Heroicons/Lucide)
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover states with smooth transitions (150-300ms)
- [ ] Light mode: text contrast 4.5:1 minimum
- [ ] Focus states visible for keyboard navigation
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px
- [ ] No content hidden behind fixed navbars
- [ ] No horizontal scroll on mobile
