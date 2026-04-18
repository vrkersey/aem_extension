# Paylocity AEM Developer Tools — UI Style Guide

## 1. Color Palette

### Brand / Primary

| Role | Hex | Usage |
|---|---|---|
| Brand Orange | `#ED5807` | Tool button hover border and text, options page accent |
| Brand Orange Dark | `#c44806` | Tool button active state border and text, options page hover |

### Neutrals (Popup)

| Role | Hex | Usage |
|---|---|---|
| Header BG | `#323E48` | Popup header background, default tool button background |
| Body BG | `#F3F0EB` | Popup body background |
| Context Bar BG | `#e8e4dc` | Default context bar background |
| Context Bar Border | `#d0ccc4` | Context bar bottom border, column dividers, button borders |
| Disabled Button BG | `#edeae5` | Greyed-out tool button background |
| Column Header Text | `#9a9590` | Section header labels (PAGE, ADVANCED, LINKS) |
| Muted Text | `#6b7580` | Context label text (non-AEM state), env badge text |
| Body Text | `#323E48` | Primary text |

### Neutrals (Options Page)

| Role | Hex | Usage |
|---|---|---|
| Page BG | `#f0f4f8` | Options page body background |
| Section BG | `#fff` | Form section card background |
| Section Border | `#dde6ee` | Section card border |
| Input BG | `#fafcff` | Text/number/url input default background |
| Input BG Focus | `#fff` | Text input background when focused |
| Input Border | `#c8d8e8` | Default input border |
| Toggle Row BG | `#f8fbff` | Mode toggle row background |
| Toggle Row Hover | `#eaf3fc` | Mode toggle row hover background |
| Body Text | `#2c3e50` | Primary text |
| Subtle Text | `#666` | Subtitle, section hint text |
| Hint Text | `#999` | Field hints, optional label |
| Label Text | `#445` | Form field labels |

### Semantic Colors

| Role | Hex | Usage |
|---|---|---|
| Blue (Primary) | `#1a4f7a` | Options heading color, save button, input focus ring, checkbox accent, section h2 |
| Blue Dark | `#15406a` | Save button hover |
| Blue Darker | `#103560` | Save button active |
| Error Red | `#c0392b` | Invalid field border, required asterisk, error status text, clear button text |
| Error Red BG | `rgba(192,57,43,0.10)` | Invalid field focus ring |
| Success Green | `#27ae60` | "Saved!" status text |

### Context Bar States

| State | Background | Text | Border |
|---|---|---|---|
| Default (non-AEM) | `#e8e4dc` | `#6b7580` | `#d0ccc4` |
| AEM (generic) | `#e6eaed` | `#323E48` | `#b8c4cc` |
| Author | `#fdf0e8` | `#8c3d00` | `#f0c4a0` |
| Publish | `#edf9ef` | `#1e6e2e` | `#b0ddb8` |

### Environment Badges

| Environment | Background | Text | Border |
|---|---|---|---|
| `local` | `#e0ddd8` | `#6b7580` | `#c0bdb8` |
| `dev` | `#ddeeff` | `#1a5fa0` | `#aaccee` |
| `stage` | `#fff3dc` | `#8a5c00` | `#f0d080` |
| `prod` | `#e6f9ec` | `#1a6e30` | `#90d8a8` |

### Mode Chips (Header)

| Mode | Background | Text | Border |
|---|---|---|---|
| Developer | `rgba(100,180,255,0.15)` | `#7ec8ff` | `rgba(100,180,255,0.30)` |
| Admin | `rgba(255,170,60,0.15)` | `#ffb84d` | `rgba(255,170,60,0.30)` |

---

## 2. Typography

### Font Stack

```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
```

Applied to both popup and options page. Monospace (code blocks in options hints):
```css
font-family: 'SF Mono', 'Fira Mono', 'Cascadia Code', monospace;
```

### Type Scale

| Element | Size | Weight | Notes |
|---|---|---|---|
| Popup header title | 13px | 600 | Letter-spacing 0.4px |
| Mode chips | 9px | 700 | Letter-spacing 0.6px, uppercase |
| Column headers | 9px | 700 | Letter-spacing 0.6px, uppercase |
| Context label | 10px | 400 | |
| Environment badge | 8px | 700 | Letter-spacing 0.7px, uppercase |
| Tool buttons | 14px | 500 | |
| No-config notice | 11px | 400 | |
| Options page h1 | 20px | 700 | |
| Options section h2 | 14px | 600 | |
| Options section hint | 12px | 400 | line-height 1.6 |
| Options field label | 12px | 600 | |
| Options input text | 13px | 400 | |
| Options field hint | 11px | 400 | |
| Options save button | 13px | 600 | |
| Options status message | 12px | 500 | |

---

## 3. Spacing & Layout

### Popup

- **Width:** 540px fixed
- **Min-height:** 80px
- **Header padding:** 7px 10px
- **Context bar padding:** 3px 10px
- **Toolbar padding:** 8px
- **Column padding:** 0 8px (first child: left 0, last child: right 0)
- **Column gap:** 0 (dividers via border-right)
- **Button row gap:** 3px
- **Tool button padding:** 7px 9px

### Options Page

- **Max-width:** 700px, centered
- **Body padding:** 24px 16px 48px
- **Section padding:** 20px 22px
- **Section border-radius:** 8px
- **Section margin-bottom:** 16px
- **Field grid gap:** 12px
- **Input padding:** 7px 10px
- **Input border-radius:** 5px

---

## 4. Component Styles

### Tool Buttons (Popup)

Buttons use a consistent state machine:

| State | Background | Border | Text | Transform |
|---|---|---|---|---|
| Default | `#323E48` | `#d0ccc4` | `#fff` | none |
| Hover | `#fde8dc` | `#ED5807` | `#ED5807` | `translateY(-1px)` |
| Active | `#fad4c0` | `#c44806` | `#c44806` | `translateY(0)` |
| Disabled | `#edeae5` | `#d0ccc4` | `#8a8680` | none |

Hover state also adds `box-shadow: 0 3px 8px rgba(0, 0, 0, 0.12)`.

Transitions: `background 0.1s, border-color 0.1s, color 0.1s, opacity 0.1s, transform 0.1s, box-shadow 0.1s`

Border-radius: 4px. Disabled opacity: 0.38.

### Column Dividers

Columns use `border-right: 1px solid #d0ccc4` on all but the last child rather than a gap, so the divider lines span the full column height.

### Context Bar

Transitions on `background 0.2s, color 0.2s, border-color 0.2s` when the body class changes between AEM context states. Overflow is hidden with `text-overflow: ellipsis` on the context label.

### Environment Badge

Pill-shaped (`border-radius: 8px`), `flex-shrink: 0` so it never wraps. Hidden (`hidden` attribute) when no environment is detected. Color determined by `data-env` attribute value.

### Mode Chips

Hidden by default (`display: none`). Shown via body class:
- `.chip-developer` shown when `body.-mode-developer`
- `.chip-admin` shown when `body.-mode-admin`

Pill-shaped (`border-radius: 10px`), `line-height: 1.6`, small uppercase label.

### Mode-Gated Buttons

Buttons requiring a mode (Developer / Admin) use `.needs-developer` or `.needs-admin` helper classes:
- Hidden (`display: none`) by default
- Revealed by `body.-mode-developer .needs-developer { display: block }` and equivalent for admin

### Options Form Inputs

Inputs transition `border-color 0.15s, box-shadow 0.15s` on focus. Focus ring: `box-shadow: 0 0 0 2px rgba(26, 79, 122, 0.12)`. Invalid ring: `box-shadow: 0 0 0 2px rgba(192, 57, 43, 0.10)`.

### Options Toggle Rows

Toggle rows (`label.toggle-field`) use `transition: background 0.1s` on hover, shifting from `#f8fbff` to `#eaf3fc`. Checkbox uses `accent-color: #1a4f7a` to apply the brand blue to the native checkbox.

### Save / Clear Buttons (Options)

Save button uses the blue primary (`#1a4f7a`) with hover/active darkening steps. Clear button is ghost-style: white background, red text and border, with a light red fill on hover.

---

## 5. State-Driven Body Classes

The popup body receives CSS classes at runtime that drive all conditional styling declaratively:

| Class | Set when |
|---|---|
| `-aem` | Active tab is any AEM instance |
| `-author` | Active tab is an Author instance |
| `-publish` | Active tab is a Publish/Preview instance |
| `-page` | Active tab is a content page |
| `-mode-admin` | Admin Mode is enabled |
| `-mode-developer` | Developer Mode is enabled |
| `-configured` | Extension has a saved program configuration; toolbar hidden when absent |
| `-has-cookies` | Cookie permission is granted |
| `-env-local` | Active environment is local |
| `-env-dev` | Active environment is dev |
| `-env-stage` | Active environment is stage |
| `-env-prod` | Active environment is prod |
