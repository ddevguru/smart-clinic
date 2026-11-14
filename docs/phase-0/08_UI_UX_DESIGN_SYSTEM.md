# Smart Clinic OS — UI/UX Design System Specification

**Document ID:** SCO-P0-DOC-008  
**Design Theme:** Mint & Teal Healthcare Identity  
**Primary Reference:** Soft Mint / Healthcare Teal Aesthetic  
**CSS Architecture:** Pure CSS Variables & CSS Modules (Strictly No Tailwind CSS)  
**Iconography:** Lucide Icons (Minimal outline style)  

---

## 1. Visual Brand Philosophy

The **Smart Clinic OS** design language is engineered to communicate:
- **Calm & Reassurance:** Alleviating patient anxiety during health crises and waiting room fatigue.
- **Clinical Rigor & Trust:** Presenting medical records, prescription data, and doctor credentials with crisp clarity.
- **Human-Centric Friendliness:** Soft, welcoming mint surfaces that feel approachable rather than cold or institutional.
- **High Operational Readability:** High-contrast dark teal typography against pure white cards, readable under outdoor Indian sunlight and bright clinic fluorescent lighting.

---

## 2. Design Tokens & Color Palette

```
  Primary Mint       Soft Mint      Healthcare Teal     Deep Teal
    #BFEDE5           #E5F7F3           #18A99A          #087F79
  ┌───────────┐     ┌───────────┐     ┌───────────┐    ┌───────────┐
  │           │     │           │     │           │    │           │
  └───────────┘     └───────────┘     └───────────┘    └───────────┘

   Light Teal        Background        Card Surface     Primary Text
    #D9F3EF           #F5FAF9           #FFFFFF          #183B3A
  ┌───────────┐     ┌───────────┐     ┌───────────┐    ┌───────────┐
  │           │     │           │     │           │    │           │
  └───────────┘     └───────────┘     └───────────┘    └───────────┘
```

### 2.1 CSS Custom Properties (Tokens)

```css
:root {
  /* Brand Mint & Teal Tokens */
  --color-primary-mint: #BFEDE5;
  --color-soft-mint: #E5F7F3;
  --color-healthcare-teal: #18A99A;
  --color-deep-teal: #087F79;
  --color-light-teal: #D9F3EF;

  /* Surfaces & Backgrounds */
  --color-bg-base: #F5FAF9;
  --color-card-bg: #FFFFFF;
  --color-border: #E3EEEB;
  --color-border-subtle: #EDF5F3;

  /* Typography Colors */
  --color-text-primary: #183B3A;
  --color-text-secondary: #708583;
  --color-text-muted: #95A9A7;
  --color-text-inverted: #FFFFFF;

  /* Semantic Feedback */
  --color-success: #20966F;
  --color-success-bg: #E7F6F1;
  --color-warning: #E5A64A;
  --color-warning-bg: #FDF6EC;
  --color-error: #D9534F;
  --color-error-bg: #FDF2F2;

  /* Border Radii */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-card: 16px;
  --radius-pill: 9999px;

  /* Shadows (Subtle, Soft Healthcare Depth) */
  --shadow-subtle: 0 2px 6px rgba(24, 59, 58, 0.04);
  --shadow-card: 0 4px 14px rgba(24, 59, 58, 0.06);
  --shadow-popover: 0 10px 30px rgba(8, 127, 121, 0.12);

  /* Typography Scale */
  --font-family-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-size-xs: 0.75rem;     /* 12px */
  --font-size-sm: 0.875rem;    /* 14px */
  --font-size-base: 1rem;      /* 16px */
  --font-size-lg: 1.125rem;    /* 18px */
  --font-size-xl: 1.25rem;     /* 20px */
  --font-size-2xl: 1.5rem;     /* 24px */
  --font-size-3xl: 1.875rem;   /* 30px */

  /* Spacing Units */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
}
```

---

## 3. Component Architecture & Style Guidelines

### 3.1 Buttons
- **Primary Action (Dark Teal):** `background: var(--color-deep-teal); color: #fff; border-radius: var(--radius-pill); font-weight: 500;` Used for "Join Queue", "Publish Prescription", "Confirm Booking".
- **Secondary Action (Soft Mint):** `background: var(--color-soft-mint); color: var(--color-deep-teal); border: 1px solid var(--color-primary-mint);` Used for "View Details", "Filter".
- **Outline / Ghost:** Clean border `var(--color-border)` with text `var(--color-text-primary)`.

### 3.2 Cards
- **Card Containers:** Always pure white background (`var(--color-card-bg)`), `14px-16px` border radius, soft border `1px solid var(--color-border)`, and subtle shadow `var(--shadow-card)`.
- **Card Padding:** 16px for mobile patient cards; 20px–24px for desktop clinic metrics.

### 3.3 Inputs & Forms
- Rounded corners (`10px-12px`), placeholder text in muted teal (`var(--color-text-muted)`).
- On focus: crisp border highlight in `var(--color-healthcare-teal)` with `0 0 0 3px rgba(24, 169, 154, 0.15)` focus ring.

### 3.4 Data Tables (Clinic & Super Admin Web)
- Clean, uncluttered rows with light divider lines (`var(--color-border)`).
- Table headers in uppercase 12px semi-bold, color `var(--color-text-secondary)`.
- Status pills: Green pill (`var(--color-success-bg)` + text `var(--color-success)`) for Completed/Checked-in, Amber pill for Waiting, Teal for In-Consultation.

### 3.5 Navigation Systems
- **Patient Mobile App:** 
  - Fixed bottom navigation bar with 5 destinations: Home, Appointments, Book (Central highlighted Teal button), Records, Profile.
  - Safe area padding for Android gesture navigation.
- **Clinic Web Application:**
  - Desktop-first left sidebar with clean vertical navigation.
  - Collapsible on tablet screens.
  - Top header containing Branch Selector, Clinic Search, Quick Action (+ Walk-in), Notifications, and User Profile.
- **Super Admin Web:**
  - Dark-tinted deep teal side rail with enterprise-grade hierarchy (Clinics, Doctors, Verification Queue, Subscriptions, MRR, Audit Logs).

---

## 4. Accessibility & Contrast Compliance (WCAG 2.1 AA)

- Primary Text (`#183B3A`) on Background (`#F5FAF9`) delivers contrast ratio **9.8:1** (Exceeds WCAG AAA requirement of 7:1).
- Deep Teal (`#087F79`) on White Card delivers contrast ratio **5.2:1** (Passes WCAG AA for normal text, AAA for large text).
- Primary Mint (`#BFEDE5`) is used strictly as a surface accent and badge background, never as text on light surfaces.
- All touch targets in Flutter mobile app and web responsive layouts have a minimum physical boundary of **48x48 dp/px**.
