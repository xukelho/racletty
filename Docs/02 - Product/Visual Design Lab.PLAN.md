# Visual Design Lab — Implementation Plan

**Status:** Implemented; verification recorded in delivery  
**Owner:** Product / Frontend  
**Last updated:** 2026-10-15

## 1. Summary

Create a self-contained, clickable design lab in the React frontend to compare four warmer, more joyful visual directions for Racletty. The lab shows the same synthetic login, dashboard, and project overview content in every direction, with **exactly four small style buttons always visible at the top** so a visitor can switch styles immediately on any lab screen. This is an experiment; production pages, saved profile themes, APIs, and the current brand asset remain unchanged.

## 2. Conventions and overrides

### Settled scope and behavior

- The style switcher applies **only inside the design lab**, as confirmed by the user. It must not restyle the live app or modify a user's light/dark/dynamic preference.
- The four directions are **Cozy Atelier**, **Playful Blueprint**, **Soft Studio**, and **Storybook Workspace**. Give each a materially distinct palette, type treatment, geometry, card/navigation treatment, illustration style, 2D mascot variant, and motion vocabulary. Keep project identity, status, revision, and required action easy to read.
- Show three sample views in each direction: login/welcome, dashboard, and project overview. Use the **same Portuguese sample content** across all styles so the comparison is fair. Synthetic data only; no sign-in, API calls, real project files, or durable mutations.
- Every lab view has the same four style buttons in a compact, persistent top bar. Clicking one changes the currently displayed view in place, immediately, with no settings trip or page reload. The active option is visually clear and exposed with `aria-pressed`. Screen navigation within the lab retains the selected style. It is acceptable for the selection to reset when the lab is reloaded; no backend/profile persistence is required.
- The bar stays visible while scrolling on desktop and mobile. It may wrap into two rows on narrow screens, but all four buttons remain visible and tappable without horizontal scrolling. The bar must not cover the mobile menu, content, or an open dialog.
- Mascots and logo explorations are 2D vector/CSS assets. They may animate lightly, but must not convey critical status by animation alone. The current production logo at `Frontend/src/assets/racletty-logo.svg` stays intact.
- Motion gives feedback or personality: subtle entrances, hover/press response, and short state transitions. Honor `prefers-reduced-motion: reduce` by removing nonessential movement. Avoid perpetual motion in working views.
- Desktop, tablet, and mobile layouts must remain usable. Use semantic controls, visible focus, meaningful labels, readable contrast, and status text that does not depend on color alone.

### Repository conventions and relevant prior art

- The frontend is React 19, TypeScript, Vite, and React Router. Routes live in `Frontend/src/App.tsx`; app CSS is imported from `Frontend/src/main.tsx`. Existing UI tests use Vitest and React Testing Library (`Frontend/src/App.test.tsx`).
- Existing `Frontend/src/theme.ts` and `Frontend/src/theme/ThemeContext.tsx` manage saved light/dark/dynamic preferences. **Do not add lab styles to `ThemePreference` or call `previewTheme` for the lab.** Scope lab tokens beneath a lab root element, independent of `html[data-theme]`.
- `Frontend/src/components/PortalShell.tsx` and `Frontend/src/pages/DashboardPage.tsx` show the current navigation and information hierarchy. Use them as content references, not as live components in the lab: they fetch real data and navigate to production routes. `Frontend/src/pages/MockupPages.tsx` contains useful synthetic project language and drawing patterns; reuse only suitable sample content or presentational ideas, avoiding its navigation to real routes.
- The existing styles in `Frontend/src/styles.css` contain broad selectors and dark-theme rules. Keep design-lab styles in a dedicated CSS file with a `.design-lab` root and style-specific `data-lab-style` attribute to prevent leakage. Each style may override shared lab design tokens and a small set of layout treatments; avoid copying four complete page trees.
- Documentation uses British English and records status, owner, and last-updated date. Product UI uses Portuguese where the current authenticated screens do.

### Overrides

- The earlier design suggestion could be interpreted as replacing the live UI. The confirmed requirement is a **contained lab**; no global app redesign or production logo replacement is part of this plan.
- The existing account theme selector changes saved light/dark/dynamic preferences. The four lab buttons are a separate temporary experiment control and never write that preference.

## 3. Ordered steps

### Step 1 — Add an isolated lab route and shared state

**What:** Register one lab entry point and its style/screen selection state.  
**Where:** `Frontend/src/App.tsx`; new `Frontend/src/design-lab/DesignLabPage.tsx` and `Frontend/src/design-lab/designLabModel.ts`.  
**How:** Add `/design-lab` outside `AuthenticatedRoute` so the synthetic login view is accessible without an account. Keep the route opt-in for experiments: available in Vite development mode and in preview/production builds only when `VITE_ENABLE_DESIGN_LAB=true`. A disabled direct visit should follow the existing unknown-route behavior. Model the style as a four-value union and the view as `login | dashboard | project`; initialise to Cozy Atelier and dashboard. Hold both selections at the lab-page level so changing views does not reset the style. No global storage or query parameter is needed. Explain the opt-in variable and URL in the plan's implementation handoff or a short lab README if implementation needs one.  
**Depends on:** None.

### Step 2 — Build the persistent four-button switcher and view navigation

**What:** Add a lab header that remains available while scrolling.  
**Where:** `Frontend/src/design-lab/DesignLabPage.tsx`; new `Frontend/src/design-lab/DesignLabHeader.tsx`; new `Frontend/src/design-lab/design-lab.css`.  
**How:** Put **exactly four compact style buttons** in one labeled group: Cozy Atelier, Playful Blueprint, Soft Studio, and Storybook Workspace. Use full accessible names even if the visible labels are shortened at mobile width; expose active state through `aria-pressed`, a visible active treatment, and keyboard focus. Place sample-view navigation separately from those four buttons. Use a sticky or fixed top bar with appropriate content offset and stacking so it remains visible on long pages and does not obscure content. On narrow widths, wrap the four buttons rather than hiding any behind a menu or horizontal scroller. A click only updates `data-lab-style` on the lab root and preserves the current sample view and scroll position.  
**Depends on:** Step 1.

### Step 3 — Create one comparable set of sample screens

**What:** Build synthetic login, dashboard, and project overview views with a shared dataset and real interactions for demonstration.  
**Where:** New files beneath `Frontend/src/design-lab/` such as `LabLoginView.tsx`, `LabDashboardView.tsx`, `LabProjectView.tsx`, and `labSampleData.ts`.  
**How:** Use the same named practice, user, projects, revision codes, status labels, notifications, and project milestones in all four styles. The login view should demonstrate the brand and sign-in form appearance; its primary button navigates to the lab dashboard without authentication. The dashboard should include an attention area, project cards, and search/filter interaction. The project overview should show a current revision, phase/milestone sequence, a preview-like 2D drawing panel, and a clear next action. Navigation among these views stays inside `/design-lab`. Do not import fetching components such as production `DashboardPage`, `CompanyProjectPage`, or `PortalShell`.  
**Depends on:** Step 1.

### Step 4 — Implement four genuinely different style systems

**What:** Give each direction its own coherent appearance without duplicating the screen markup.  
**Where:** `Frontend/src/design-lab/design-lab.css` and, if it improves maintainability, small additional CSS files imported only by the lab page.  
**How:** Define shared semantic tokens (page, surface, text, muted text, accent, border, success/warning, radius, shadow, font) under `.design-lab`, then four `data-lab-style` token sets and distinctive component treatments. Cozy Atelier: cream paper, terracotta, sketch accents, tactile cards. Playful Blueprint: pastel cyan/blue, grid and annotation motifs, rounded technical labels. Soft Studio: lavender/peach/mint, plush geometry, airy spacing. Storybook Workspace: warm illustrated color fields, milestone journey, editorial headings. Vary hierarchy and details enough that a user can compare experiences, while preserving identical information and task order. Provide layout rules at narrow mobile, tablet, and desktop widths; ensure contrast and focus states in every palette.  
**Depends on:** Steps 2 and 3.

### Step 5 — Create four 2D mascot/logo explorations

**What:** Add a variant mascot to each visual direction and place it consistently in welcome/empty/illustrative moments.  
**Where:** New SVG assets or React SVG components beneath `Frontend/src/design-lab/assets/` or `Frontend/src/design-lab/`; lab views/styles from Steps 3–4.  
**How:** Start from the recognisable silhouette or architectural drawing language of the current spatula mark, then explore four 2D interpretations: friendly spatula for Cozy Atelier; drawing buddy for Playful Blueprint; fluffy abstract helper with a pencil for Soft Studio; guide character for Storybook Workspace. Keep all artwork original and vector-based. Supply static poses that work without animation and ensure decorative instances are hidden from assistive technology. Keep the wordmark legible and avoid replacing the production `BrandLogoMark` asset or favicon.  
**Depends on:** Steps 3 and 4.

### Step 6 — Add restrained motion and a reduced-motion mode

**What:** Animate meaningful lab interactions and mascot moments.  
**Where:** `Frontend/src/design-lab/design-lab.css` and lab components only.  
**How:** Use short CSS transitions/keyframes for style switching, card entrance, button response, drawing accents, and brief mascot reactions. Avoid large parallax, flashing, or looping movement while users read project information. Add `@media (prefers-reduced-motion: reduce)` rules that remove movement and preserve every state change through instant layout/color/text changes. Ensure switching styles does not replay distracting entrance animations on every component if the user is comparing rapidly.  
**Depends on:** Steps 4 and 5.

### Step 7 — Verify the experiment and document how to review it

**What:** Confirm the switcher, isolation, responsiveness, and interaction quality.  
**Where:** New focused tests under `Frontend/src/design-lab/`; `Frontend/src/App.test.tsx` only if route coverage fits there; a short lab usage note in `Docs/02 - Product/` or the lab folder.  
**How:** Add focused tests for four visible buttons, active `aria-pressed`, switching styles without changing view or saved theme, navigation among three sample views, and route gating. Run `npm run test:run` and `npm run build` from `Frontend`. Review each of the 12 style/view combinations in a real browser at desktop and narrow mobile widths, including scroll persistence, keyboard navigation, focus visibility, contrast, no horizontal overflow, and reduced-motion emulation. Record any presentation caveats in the usage note.  
**Depends on:** Steps 1–6.

## 4. Acceptance criteria

- [x] **AC-1 → Steps 1–3:** `/design-lab` opens an isolated, synthetic experience with login, dashboard, and project overview views; it does not require a real account or call project/auth APIs.
- [x] **AC-2 → Steps 1, 2, 4:** Exactly four compact style buttons are always visible at the top of every lab view, including while scrolling and at narrow mobile width.
- [x] **AC-3 → Steps 1, 2, 4:** Each button applies its corresponding style immediately to the current view without a settings visit, page reload, route change, or loss of the selected sample view.
- [x] **AC-4 → Steps 3–5:** All four styles use equivalent content and each has a distinct visual system and original 2D mascot/logo exploration.
- [x] **AC-5 → Steps 5–6:** Animations are present, brief, and relevant; reduced-motion mode removes nonessential movement while keeping actions understandable.
- [x] **AC-6 → Steps 1, 4, 7:** Production screens, the existing logo, and saved light/dark/dynamic theme preferences are unchanged by lab interaction.
- [x] **AC-7 → Steps 2, 4, 7:** The lab is usable by keyboard and on desktop, tablet, and mobile; all four buttons have visible focus and active states, readable names, and no content-obscuring overlap.
- [x] **AC-8 → Step 7:** Frontend build and focused tests pass; all twelve style/view combinations receive browser review. Manual browser review is required for visual quality, layout, and motion.

## 5. Decisions log

When a settled decision deviates from or extends this plan, append one line — the decision and its why — to `Docs/02 - Product/Visual Design Lab.DECISIONS.md` beside this plan, the moment it is settled.
