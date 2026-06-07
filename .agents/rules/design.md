---
trigger: always_on
---

# Design System: DTUVIVU Minimalist Luxury

This document outlines the visual identity and design guidelines for the **DTUVIVU** booking website.

---

## 1. Brand Philosophy
DTUVIVU is a high-end luxury resort booking platform. The visual aesthetic should feel modern, clean, premium, and trustworthy.

## 2. Color Palette
- **Primary Color**: `#1594D8` (DTUVIVU Sky Blue)
- **Secondary Color**: `#F5C26B` (Warm Accent Gold)
- **Background**: `#FFFFFF` (Primary Base)
- **Surface Dim**: `#F8FAFC` (Secondary Base / Light grey)
- **On-Surface (Text)**: `#0F172A` (Slate/Dark text)
- **On-Surface-Variant (Muted Text)**: `#64748B` (Muted grey)
- **Outline (Borders)**: `#E2E8F0`

## 3. Typography
- **Headlines**: `Poppins` (Semi-bold, elegant, and modern)
- **Body / Labels**: `Inter` (Clean, geometric, highly readable)

## 4. Spacing & Shape
- **Spacing Unit**: 8px baseline grid
- **Gutter**: 24px
- **Max Width**: 1280px
- **Roundness**: `ROUND_EIGHT` (0.5rem or 8px) for buttons, inputs, and cards.

---

## 6. Design System Notes for Stitch Generation (REQUIRED FOR PROMPTS)

```yaml
---
name: DTUBooking Design System
colors:
  surface: '#FFFFFF'
  surface-dim: '#F8FAFC'
  surface-bright: '#FFFFFF'
  on-surface: '#0F172A'
  on-surface-variant: '#64748B'
  outline: '#E2E8F0'
  primary: '#1594D8'
  on-primary: '#FFFFFF'
  primary-container: '#BCE4FC'
  on-primary-container: '#00253B'
  secondary: '#F5C26B'
  on-secondary: '#0F172A'
  error: '#EF4444'
  background: '#FFFFFF'
  on-background: '#0F172A'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f7'
  surface-container: '#ededf2'
  surface-container-high: '#e7e8ec'
  surface-container-highest: '#e2e2e6'
  inverse-surface: '#2e3034'
  inverse-on-surface: '#f0f0f4'
  outline-variant: '#c2c7cf'
  surface-tint: '#1594D8'
  inverse-primary: '#9ccbfb'
  secondary-container: '#fdc972'
  on-secondary-container: '#785300'
  tertiary: '#421f00'
  on-tertiary: '#ffffff'
  tertiary-container: '#623101'
  on-tertiary-container: '#e19962'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#cfe5ff'
  primary-fixed-dim: '#9ccbfb'
  on-primary-fixed: '#001d33'
  on-primary-fixed-variant: '#114a73'
  secondary-fixed: '#ffdeab'
  secondary-fixed-dim: '#f1be68'
  on-secondary-fixed: '#271900'
  on-secondary-fixed-variant: '#5f4100'
  tertiary-fixed: '#ffdcc4'
  tertiary-fixed-dim: '#ffb781'
  on-tertiary-fixed: '#2f1400'
  on-tertiary-fixed-variant: '#6d3909'
  surface-variant: '#e2e2e6'
typography:
  display-lg:
    fontFamily: Poppins
    fontSize: 64px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Poppins
    fontSize: 36px
    fontWeight: '600'
    lineHeight: '1.3'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.0'
    letterSpacing: 0.05em
  display-lg-mobile:
    fontFamily: Outfit
    fontSize: 40px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Outfit
    fontSize: 28px
    fontWeight: '600'
    lineHeight: '1.3'
  headline-sm:
    fontFamily: Outfit
    fontSize: 22px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  gutter: 24px
  margin-desktop: 64px
  margin-mobile: 20px
  container-max-width: 1280px
---
```
