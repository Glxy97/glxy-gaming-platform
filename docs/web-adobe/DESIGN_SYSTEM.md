# Web-Adobe Properties Panel - Design System

Ein umfassendes Design-System für das Advanced Form Field Editor Properties Panel.

---

## Design Principles

### 1. Clarity (Klarheit)
Jede Funktion ist sofort verständlich und eindeutig beschriftet.

### 2. Consistency (Konsistenz)
Einheitliches Design über alle Komponenten und Sections hinweg.

### 3. Feedback (Rückmeldung)
Sofortiges visuelles Feedback bei jeder Benutzeraktion.

### 4. Efficiency (Effizienz)
Minimale Anzahl von Klicks für häufige Aufgaben.

### 5. Aesthetics (Ästhetik)
Schön und professionell, ohne überladen zu wirken.

---

## Color System

### Brand Colors

```css
--primary: 217 91% 60%        /* #3b82f6 - Primary Blue */
--primary-foreground: 0 0% 98% /* #fafafa */

--secondary: 214 32% 91%       /* #e0e7ff - Light Blue */
--secondary-foreground: 217 91% 20%

--accent: 262 83% 58%          /* #a855f7 - Purple */
--accent-foreground: 0 0% 98%
```

### Semantic Colors

```css
/* Success */
--success: 142 76% 36%         /* #22c55e */
--success-foreground: 0 0% 100%

/* Warning */
--warning: 38 92% 50%          /* #f59e0b */
--warning-foreground: 0 0% 100%

/* Error/Destructive */
--destructive: 0 84% 60%       /* #ef4444 */
--destructive-foreground: 0 0% 98%

/* Info */
--info: 199 89% 48%            /* #0ea5e9 */
--info-foreground: 0 0% 100%
```

### Neutral Colors

```css
--background: 0 0% 100%        /* Light Mode: White */
--foreground: 222 47% 11%      /* Dark Text */

--muted: 214 32% 91%
--muted-foreground: 215 16% 47%

--border: 214 32% 91%
--input: 214 32% 91%
--ring: 217 91% 60%
```

### Dark Mode

```css
--background: 222 47% 11%      /* Dark Background */
--foreground: 210 40% 98%      /* Light Text */

--muted: 217 33% 17%
--muted-foreground: 215 20% 65%

--border: 217 33% 17%
```

---

## Typography

### Font Family

```css
font-family:
  'Inter',
  -apple-system,
  BlinkMacSystemFont,
  'Segoe UI',
  Roboto,
  sans-serif;

/* Code/Monospace */
font-family-mono:
  'JetBrains Mono',
  'Fira Code',
  'Courier New',
  monospace;
```

### Font Sizes

| Name | Size | Usage |
|------|------|-------|
| **xs** | 12px (0.75rem) | Helper text, badges |
| **sm** | 14px (0.875rem) | Body text, inputs |
| **base** | 16px (1rem) | Default, headers |
| **lg** | 18px (1.125rem) | Section titles |
| **xl** | 20px (1.25rem) | Panel title |
| **2xl** | 24px (1.5rem) | Page headers |

### Font Weights

- **Normal:** 400
- **Medium:** 500
- **Semibold:** 600
- **Bold:** 700

### Line Heights

- **Tight:** 1.25
- **Normal:** 1.5
- **Relaxed:** 1.75

---

## Spacing Scale

Basierend auf 4px Grid:

```css
--spacing-1: 0.25rem  /* 4px */
--spacing-2: 0.5rem   /* 8px */
--spacing-3: 0.75rem  /* 12px */
--spacing-4: 1rem     /* 16px */
--spacing-5: 1.25rem  /* 20px */
--spacing-6: 1.5rem   /* 24px */
--spacing-8: 2rem     /* 32px */
--spacing-10: 2.5rem  /* 40px */
--spacing-12: 3rem    /* 48px */
--spacing-16: 4rem    /* 64px */
```

### Common Usage

- **Padding (Inputs):** 12px (spacing-3)
- **Gap (Form Fields):** 12px (spacing-3)
- **Section Padding:** 16px (spacing-4)
- **Panel Padding:** 16px (spacing-4)
- **Margin (Sections):** 12px (spacing-3)

---

## Border Radius

```css
--radius-sm: 0.25rem   /* 4px - Small elements */
--radius-md: 0.375rem  /* 6px - Inputs, buttons */
--radius-lg: 0.5rem    /* 8px - Cards, panels */
--radius-xl: 0.75rem   /* 12px - Large cards */
--radius-full: 9999px  /* Pill shapes */
```

---

## Shadows

### Elevation System

```css
/* Level 1 - Subtle */
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);

/* Level 2 - Default */
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);

/* Level 3 - Elevated */
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);

/* Level 4 - Floating */
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);

/* Level 5 - Modal */
--shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.25);
```

### Usage

- **Inputs:** shadow-sm
- **Buttons:** shadow-sm (hover: shadow-md)
- **Cards:** shadow-md
- **Dropdowns:** shadow-lg
- **Modals:** shadow-2xl

---

## Components

### Buttons

#### Primary Button
```tsx
<Button className="bg-primary text-primary-foreground">
  Speichern
</Button>
```

**Specs:**
- Height: 36px (sm), 40px (default), 44px (lg)
- Padding: 12px 24px
- Border Radius: 6px (--radius-md)
- Font Size: 14px (sm), 16px (default)
- Font Weight: 500 (medium)

#### Icon Button
```tsx
<Button size="icon" variant="ghost">
  <Icon className="h-4 w-4" />
</Button>
```

**Specs:**
- Size: 32x32px (sm), 36x36px (default), 44x44px (lg)
- Border Radius: 6px
- Icon Size: 16px (sm), 20px (default)

### Inputs

#### Text Input
```tsx
<Input className="h-9" />
```

**Specs:**
- Height: 36px
- Padding: 8px 12px
- Border: 1px solid hsl(var(--border))
- Border Radius: 6px
- Font Size: 14px
- Transition: border-color 150ms

**States:**
- Focus: Ring (2px primary color)
- Error: Border destructive + ring destructive
- Disabled: Opacity 50%

### Labels

```tsx
<Label className="text-sm font-medium">
  Feldname
</Label>
```

**Specs:**
- Font Size: 14px
- Font Weight: 500
- Margin Bottom: 6px
- Color: foreground

### Sections

#### Collapsible Section
```tsx
<FieldPropertySection title="Basis" icon={<Icon />}>
  {children}
</FieldPropertySection>
```

**Specs:**
- Border Bottom: 1px solid border
- Header Padding: 12px 16px
- Content Padding: 12px 16px
- Gap: 12px

### Badges

```tsx
<Badge variant="secondary">Pflichtfeld</Badge>
```

**Variants:**
- **default:** primary background
- **secondary:** secondary background
- **outline:** border only
- **destructive:** destructive background

**Specs:**
- Padding: 4px 8px
- Font Size: 12px
- Border Radius: 4px
- Font Weight: 500

### Tooltips

```tsx
<Tooltip>
  <TooltipTrigger>Hover me</TooltipTrigger>
  <TooltipContent>Info text</TooltipContent>
</Tooltip>
```

**Specs:**
- Background: hsl(var(--popover))
- Padding: 8px 12px
- Font Size: 12px
- Border Radius: 6px
- Shadow: shadow-lg
- Max Width: 200px

---

## Animations

### Duration

```css
--duration-fast: 150ms
--duration-normal: 200ms
--duration-slow: 300ms
```

### Easing

```css
--ease-in: cubic-bezier(0.4, 0, 1, 1)
--ease-out: cubic-bezier(0, 0, 0.2, 1)
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1)
```

### Framer Motion Variants

#### Panel Slide-In
```tsx
const panelVariants = {
  initial: { x: 400, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: 400, opacity: 0 },
  transition: {
    type: 'spring',
    damping: 25,
    stiffness: 200
  }
}
```

#### Accordion
```tsx
const accordionVariants = {
  collapsed: { height: 0, opacity: 0 },
  expanded: { height: 'auto', opacity: 1 },
  transition: { duration: 0.2, ease: 'easeOut' }
}
```

#### Fade In
```tsx
const fadeInVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.15 }
}
```

---

## Iconography

### Icon Library
**Lucide React** - Konsistent, modern, gut lesbar

### Icon Sizes
- **Extra Small:** 14px (0.875rem)
- **Small:** 16px (1rem)
- **Medium:** 20px (1.25rem)
- **Large:** 24px (1.5rem)

### Icon Colors
- **Primary:** text-foreground
- **Secondary:** text-muted-foreground
- **Interactive:** text-primary (hover)
- **Destructive:** text-destructive

### Common Icons

| Icon | Usage | Component |
|------|-------|-----------|
| `FileText` | Document/Field | General |
| `CheckSquare` | Validation | Validation |
| `Palette` | Appearance | Style |
| `Zap` | Behavior | Actions |
| `Link2` | Integration | DataPad |
| `Copy` | Copy | Clipboard |
| `ClipboardPaste` | Paste | Clipboard |
| `Pin` | Pin Panel | Panel |
| `X` | Close | Panel |
| `ChevronDown` | Expand | Accordion |
| `Plus` | Add | CRUD |
| `Minus` | Remove/Decrease | CRUD |

---

## Layout

### Panel Dimensions

```css
/* Desktop */
.properties-panel {
  width: 400px;
  height: 100vh;
  position: fixed;
  right: 0;
  top: 0;
}

/* Tablet */
@media (max-width: 1024px) {
  .properties-panel {
    width: 100%;
    max-width: 400px;
  }
}

/* Mobile */
@media (max-width: 768px) {
  .properties-panel {
    width: 100%;
    max-width: none;
  }
}
```

### Grid System

```tsx
/* Two Column */
<div className="grid grid-cols-2 gap-3">
  <PropertyRow>...</PropertyRow>
  <PropertyRow>...</PropertyRow>
</div>

/* Auto-fit */
<div className="grid grid-cols-[auto_1fr] gap-2 items-center">
  <Label>...</Label>
  <Input>...</Input>
</div>
```

---

## Responsive Breakpoints

```css
/* Mobile First */
sm: 640px   /* Small devices */
md: 768px   /* Tablets */
lg: 1024px  /* Laptops */
xl: 1280px  /* Desktops */
2xl: 1536px /* Large screens */
```

### Panel Behavior

- **< 768px:** Full-screen modal
- **768px - 1024px:** Overlay with backdrop
- **> 1024px:** Fixed sidebar

---

## States & Interactions

### Hover States
```css
/* Subtle lift */
.hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

/* Background change */
.hover-bg:hover {
  background-color: hsl(var(--muted));
}
```

### Focus States
```css
/* Focus Ring */
.focus-ring:focus-visible {
  outline: 2px solid hsl(var(--ring));
  outline-offset: 2px;
}
```

### Active States
```css
/* Pressed */
.active-scale:active {
  transform: scale(0.98);
}
```

### Disabled States
```css
.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}
```

---

## Error Handling

### Error Message Pattern
```tsx
<div className="flex items-center gap-2 text-destructive">
  <AlertCircle className="h-4 w-4" />
  <span className="text-sm">{errorMessage}</span>
</div>
```

### Warning Pattern
```tsx
<div className="flex items-center gap-2 text-warning">
  <AlertTriangle className="h-4 w-4" />
  <span className="text-sm">{warningMessage}</span>
</div>
```

### Success Pattern
```tsx
<div className="flex items-center gap-2 text-success">
  <CheckCircle2 className="h-4 w-4" />
  <span className="text-sm">{successMessage}</span>
</div>
```

---

## Performance Guidelines

### Component Optimization
- Lazy load heavy components (PDF Renderer)
- Memoize expensive calculations
- Use Zustand selectors to prevent re-renders
- Virtual scrolling for long lists

### Animation Performance
- Use `transform` and `opacity` only
- Avoid animating `width`, `height`, `top`, `left`
- Use `will-change` sparingly
- Respect `prefers-reduced-motion`

---

## Accessibility Guidelines

### Minimum Target Sizes
- Touch Targets: 44x44px minimum
- Desktop Buttons: 36x36px minimum
- Icon Buttons: 36x36px minimum

### Color Contrast
- Normal Text: 4.5:1 (AA)
- Large Text: 3:1 (AA)
- UI Components: 3:1 (AA)

### Focus Management
- Visible focus indicators
- Logical tab order
- Focus trap in modals
- Return focus on close

---

## Code Style Guidelines

### Component Structure
```tsx
// 1. Imports
import { useState } from 'react'
import { Button } from '@/components/ui/button'

// 2. Types
interface MyComponentProps {
  prop: string
}

// 3. Component
export function MyComponent({ prop }: MyComponentProps) {
  // 4. Hooks
  const [state, setState] = useState()

  // 5. Handlers
  const handleClick = () => {}

  // 6. Render
  return <div>...</div>
}
```

### Naming Conventions
- **Components:** PascalCase (`PropertiesPanel`)
- **Files:** kebab-case (`properties-panel.tsx`)
- **Functions:** camelCase (`handleFieldUpdate`)
- **Constants:** UPPER_SNAKE_CASE (`FIELD_TYPES`)

---

**Design System Version:** 1.0.0
**Last Updated:** 2025-10-07
**Maintainer:** UX Design Team
