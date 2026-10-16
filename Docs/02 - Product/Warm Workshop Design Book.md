# Warm Workshop — Design Book

**Status:** Adopted as the default UI, based on the design lab  
**Owner:** Product / Frontend  
**Last updated:** 2026-10-16

## Purpose

Warm Workshop is the fourth option in the [Visual Design Lab](Visual%20Design%20Lab.md). It combines the selected qualities of the earlier explorations: Atelier's dotted paper and 2D spatula mascot, Blueprint's drawing grid, structured cards and offset shadows, and Studio's Nunito type and rounded controls. This book turns that comparison into rules for a production redesign. The lab remains a reference; its synthetic screens and actions are not production components.

The intended feeling is welcoming, calm, and capable. Project information must remain easier to read than the decoration. The mascot should make moments warmer without replacing labels, status, or help text.

## Foundations

These are starting values from `Frontend/src/design-lab/design-lab.css` under `data-lab-style="storybook"`, with a proposed contrast correction for muted text. They are **candidate tokens**, not a wholesale CSS copy.

| Role | Candidate value | Use |
| --- | --- | --- |
| Page | `#f4f3e9` | Main canvas, warm off-white |
| Panel | `#fffdf7` | Primary cards, dialogs, fields |
| Raised / inset surface | `#f9f7ec` | Nested content and comments |
| Soft surface | `#e9ecdf` | Hero and selected information regions |
| Primary ink | `#27433c` | Headings and main text |
| Muted ink | `#5d7067` | Secondary text; darker than the lab's `#62766d` to clear 4.5:1 on the page |
| Border | `#cddacf` | Card and field separation |
| Action | `#3d7164` | Primary buttons, links, focus cues |
| Action text | `#ffffff` | Text on primary action |
| Action soft | `#dcebe2` | Selected controls and low emphasis actions |
| Warm accent | `#d88b69` | Limited highlights, mascot detail, milestones |
| Warm status | `#f6e1cb` / `#855537` | Pending or attention state with text label |
| Calm status | `#e4eee2` / `#436d53` | Completed or positive state with text label |

For reference, calculated contrast is about 9.6:1 for primary ink on the page, 5.6:1 for white on the action color, and 4.7:1 for the proposed muted ink on the page. Check every actual text/background pairing in the rendered app, including disabled and dark theme states. Color never carries status alone.

### Type and spacing

- Use **Nunito** for headings and body text, with Arial and system sans-serif fallbacks. Keep the font optional: a failed font request must not break layout.
- Use a clear hierarchy: page title about 32–38 px, section title about 22–26 px, card title about 17–20 px, body copy at least 14 px in production, and metadata at least 12 px where space permits. The lab uses smaller labels in places; do not carry those sizes into dense working screens unchanged.
- Use an 8 px spacing rhythm (8, 16, 24, 32), with 4 and 12 px for tight relationships. Group a label with its value more closely than adjacent groups.
- Favor comfortable line height (roughly 1.45–1.6 for prose) and avoid truncating important names, addresses, document titles, or errors when space is available.

### Geometry and depth

- Main cards: roughly 24 px radius. Inputs and buttons: roughly 16–18 px radius. Small status chips may use a pill shape.
- Use a thin, visible border plus a restrained offset shadow for grouped work surfaces. The lab's reference is `5px 6px 0 rgb(62 109 91 / 10%), 0 16px 30px rgb(48 79 64 / 6%)`.
- Dots belong on welcoming or summary surfaces. Square grids belong in drawing or plan contexts. Avoid a patterned background behind long body text, forms, the document viewer, or chat messages.
- Keep a strong distinction between the page canvas, working cards, and nested data. Decoration must not make controls look inactive.

## Components and content rules

| Component | Rule |
| --- | --- |
| Primary action | Solid sage, explicit verb, visible hover/press/focus and disabled states. One clear primary action per local task area. |
| Secondary action | Tinted or outlined, still recognizable as interactive. Destructive actions retain their own warning treatment and confirmation. |
| Inputs | Rounded, labeled, readable at narrow widths; show required, error, disabled, and saving states without relying on border color alone. |
| Cards | Clear title and metadata hierarchy; the whole card can be a link/button only when its complete purpose is accessible. |
| Status | Pair color with text, icon only where helpful. Preserve distinct pending, error, success, archived, and read-only meanings. |
| Empty, loading, error | Use concise explanation and available next action; do not show the mascot in place of a needed error or retry. |
| Navigation | Retain the production routes, role visibility, unread counts, mobile drawer, and collapsed sidebar. The four style buttons stay in the lab only. |
| Data-heavy workspace | Give the current revision and related conversation a visual relationship, but keep timeline, viewer, document management, and chats separately operable. |

### Mascot and brand

Use the original 2D spatula silhouette from the Atelier lab direction as the candidate character. It can welcome users, mark an empty state, or accompany a next step. It must be decorative to assistive technology when adjacent text already explains the context. Do not place it over document content, form errors, or interactive controls. Keep `BrandLogoMark` and the current production logo until a separate brand decision approves replacement; the mascot is not yet the product logo.

### Motion

- Short entrance or response animation may guide attention (approximately 150–450 ms). The mascot may make one brief reaction on arrival or a successful action.
- Avoid perpetual motion while a user reads a drawing, edits a timeline, or writes a message. Do not replay large entrance animations on every state update.
- Provide hover, press, and focus feedback without shifting layout. Respect `prefers-reduced-motion: reduce` by removing nonessential animation and transition duration.
- Status changes must be clear when animation is off.

## Screen direction

1. **Welcome / login:** dotted welcome panel, a small square-grid plan illustration, rounded Nunito form controls, and the 2D mascot. Keep real authentication, validation, error handling, password reveal, and responsive mobile form behavior.
2. **Dashboard:** use Workshop's palette with Blueprint's clear card structure and depth. Preserve the user's current organization toggle, notification actions, project filtering, role-aware project details, and all loading/error/empty states.
3. **Project:** make the real current phase or document, related conversation, and next action easier to scan. The lab's revision-and-discussion pairing is a composition reference only. Real projects may have no document, multiple phases, unsupported previews, archived restrictions, or several conversations; the design must represent those states truthfully.

## Production boundaries

- Keep the existing React routes, API calls, permissions, theme preference, and data semantics. Production UI changes should adapt the existing components, not mount the lab's synthetic views.
- Preserve light, dark, and dynamic theme preferences. Workshop currently has a light palette only. Design and verify a dark counterpart before applying these tokens globally; until then, a pilot must be scoped so existing dark mode remains legible.
- Do not add a global Workshop preference or expose the four lab style controls in production as part of the visual migration.
- Review Portuguese production copy separately from the current English login copy; a visual redesign must not silently change product language or workflow meaning.

## Implementation gate

Before changing a production screen, use the [Feature Preservation Inventory](UI%20Redesign%20Feature%20Preservation%20Inventory.md) to list its current actions, roles, states, and tests. Afterward, compare the same items in a real browser at desktop and mobile widths and in light and dark themes. If a behavior is absent from the lab, keep the production behavior and design its presentation explicitly.

The first implementation pilot should be the **real project page**, because it has the largest gap between the lab concept and production behavior. The pilot is complete only when the inventory's project checks pass; then the design can move to the dashboard and welcome page.
