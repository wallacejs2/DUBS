# DESIGN SYSTEM — CURATOR (iOS-Inspired)

## Typography Scale (iOS SF Mapping)

| Role         | Tailwind Class                          | Size  | Weight     | Usage                        |
|-------------|----------------------------------------|-------|------------|------------------------------|
| Large Title | `text-[28px] font-bold tracking-tight` | 28px  | Bold       | Page titles (content area)   |
| Title 2     | `text-xl font-bold`                    | 20px  | Bold       | Section headers              |
| Headline    | `text-base font-semibold`              | 16px  | Semibold   | Card names, inline header    |
| Body        | `text-sm`                              | 14px  | Regular    | Default reading text         |
| Subheadline | `text-sm text-slate-500`               | 14px  | Regular    | Secondary/supporting text    |
| Caption     | `text-xs`                              | 12px  | Regular    | Metadata, timestamps, labels |

**Rules**: No arbitrary pixel sizes below 12px. Only these 6 roles exist.

## Spacing Scale (iOS 8pt Grid)

| Token  | Value | Tailwind | Usage                       |
|--------|-------|----------|-----------------------------|
| xs     | 8px   | `gap-2`  | Within components           |
| sm     | 16px  | `gap-4`  | Between list items          |
| md     | 24px  | `gap-6`  | Between sections            |
| lg     | 32px  | `gap-8`  | Between major regions       |

Page padding: `p-4` mobile, `p-6` desktop.

## Border Radius

| Element                   | Tailwind         | Value |
|--------------------------|------------------|-------|
| Buttons / Inputs         | `rounded-xl`     | 12px  |
| Cards / Containers       | `rounded-2xl`    | 16px  |
| Avatars / Pills          | `rounded-full`   | 9999  |
| Brand mark (sidebar tile)| `rounded-[10px]` | 10px  |

## Color Tokens

### Accent
- Interactive: `blue-500` (#3B82F6) — buttons, links, focus, selected states

### Backgrounds
| Surface      | Light            | Dark             |
|-------------|------------------|------------------|
| Page base   | `#F2F2F7`        | `#000000`        |
| Card        | `white/80`       | `#2C2C2E`        |
| Elevated    | `white/90`       | `#3A3A3C`        |
| Sidebar     | `slate-100/90`   | `#1C1C1E/90`     |

### Separators
- Light: `border-slate-200/60`
- Dark: `border-[#38383A]`

### Status Colors (Semantic)
| Status      | Color   | Dot Class            |
|------------|---------|----------------------|
| Live       | Emerald | `bg-emerald-500`     |
| Approved   | Blue    | `bg-blue-500`        |
| Onboarding | Indigo  | `bg-indigo-500`      |
| Hold       | Orange  | `bg-orange-500`      |
| Cancelled  | Red     | `bg-red-500`         |
| Legacy     | Yellow  | `bg-yellow-500`      |
| Pending    | Slate   | `bg-slate-400`       |

## Materials (Translucency)

| Material | Classes                                                          | Usage              |
|----------|------------------------------------------------------------------|--------------------|
| Thick    | `bg-white/90 dark:bg-[#1C1C1E]/95 backdrop-blur-xl backdrop-saturate-150` | Header, sidebar    |
| Regular  | `bg-white/80 dark:bg-[#2C2C2E] backdrop-blur-sm`                 | Cards, containers  |
| Thin     | `bg-white/95 backdrop-blur-[2px]`                                | Overlays, popovers |

## Card Hover

A standard card's default surface is Regular material. On hover, swap the surface tint and shift the border to the accent family — no translate, scale, or shadow change.

```
hover:bg-slate-50/80 hover:border-blue-200
```

## Button Variants

| Variant     | Classes                                                                      |
|------------|-----------------------------------------------------------------------------|
| Primary    | `px-4 py-2.5 bg-blue-500 text-white rounded-xl text-sm font-semibold`      |
| Secondary  | `px-4 py-2.5 bg-blue-500/10 text-blue-600 rounded-xl text-sm font-semibold`|
| Destructive| `px-4 py-2.5 bg-red-500/10 text-red-600 rounded-xl text-sm font-semibold`  |
| Plain/Text | `text-blue-500 text-sm font-medium`                                         |

**Rules**: No shadows on buttons. No translate on hover. Use `hover:bg-blue-600` (primary) or `hover:bg-blue-500/15` (secondary).

## Shadows

- Light mode only: `shadow-sm` for elevated cards
- Dark mode: No shadows — use material elevation (lighter bg) instead
