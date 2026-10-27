# Frontend UX Improvements

**Status:** Frontend changes implemented and visually reviewed
**Owner:** Product / Frontend
**Last updated:** 2026-10-18

## Scope

These are proposed improvements to frontend behaviour and layout. They do not require backend or database changes. Dimensions below are starting points for a browser mockup, not approved specifications.

## Implementation snapshot — 2026-10-17

The frontend now shows the viewed phase and selected document beside the viewer, identifies when a different phase is open, provides a return to the current phase, and preserves a valid viewed phase when project details reload. Project creation identifies field errors, focuses the field needing correction, retains entered values after a failed request, and prevents repeat submissions while saving. The dashboard date uses the user's local date.

The project header is more compact, the map opens on request, the timeline precedes the viewer, and the drawing and conversation panel share the main desktop row. At narrower widths, the document tray and conversation panel follow the drawing. The dimensions remain subject to visual review with real project content.

Before and after screenshots are stored under `.artifacts/ux-comparison/`. They use the real frontend with identical browser-only sample API responses, so they do not change backend or database data.

## Agreed improvements to explore

### 1. Make the review context clear on the project page

Show the **viewed phase and document** together near the drawing. Distinguish the viewed phase from the project's **current phase**, especially when someone selects an older phase. Keep the user's document selection while they use the project workspace; do not silently replace it with the newest document after unrelated UI changes. Provide a clear way to return to the current phase.

**Why:** `CompanyProjectPage.tsx` tracks current and viewed phases separately and automatically chooses the newest available document for a selected phase. The interface should make that state obvious.

**Check:** A person can always answer “Which phase and document am I looking at?” and “Is this the current phase?” without leaving the viewer.

### 2. Help people recover during project creation

Prevent repeat submissions while a project is being created. Keep entered values and selected participants after a failed submission. Put actionable error text next to the relevant field or section, with an error summary for failures that cannot be tied to one field. Move focus to the first error so it can be corrected without searching through the long form.

**Why:** The current create form reports a submission error above several sections and does not show a saving state on its final button.

**Check:** A failed submission does not lose work or create an accidental duplicate, and the user can find and fix the problem quickly.

### 3. Show the actual dashboard date

Replace the hard-coded dashboard date with a date calculated at runtime using the existing Portuguese locale. Update it when the day changes while the dashboard is open.

**Why:** The current greeting displays “Segunda-feira, 27 de julho” regardless of today's date.

**Check:** The displayed weekday and date match the user's local day.

## Project page layout proposal

The drawing review task should be the centre of the page. Keep project identity visible, then place phase selection, document selection, drawing, and related conversation in the order they are used.

| Area | Proposed placement and starting dimensions | Reason |
| --- | --- | --- |
| Project header | Compact 120–160 px band with title, code, current phase, archived state and Edit action. Move the map behind a “View location” action. | The current hero includes a map with a 220 px minimum height, delaying the review workspace. |
| Timeline | Selectable strip immediately above the drawing, about 72–100 px high in its compact state. | Establishes which phase is being viewed before the document content. |
| Document selection | Beside the drawing title or just below the timeline. Keep the selected document name visible. | Switching documents should happen close to the viewer. |
| Drawing | Main desktop column, roughly two thirds of the workspace. Start with a 520 px minimum height, grow with the viewport, and cap around 720 px. | The current fixed 430 px canvas can feel small for detailed plans. |
| Conversations | Right desktop column around 340–380 px wide; height tracks the drawing. | Related discussion remains visible without claiming excess vertical space. |
| Document management | Expandable tray near the drawing for upload, download, visibility and deletion actions. | Avoids making the full-width document section a separate destination. |

Suggested desktop reading order:

```text
Project title · code · current phase                         Edit
Timeline: [Phase 1] [Phase 2] [Phase 3]

Viewed phase · selected document               Choose document
┌─────────────────────────────────┬─────────────────────┐
│                                 │ Conversations       │
│             Drawing             │                     │
│                                 │                     │
└─────────────────────────────────┴─────────────────────┘
Document tray, expandable
```

At narrower widths, use **timeline → document selector → drawing → conversations**. Let conversations open as an intentional panel or section rather than forcing a tall panel between the drawing and its controls. The current layout becomes one column at 1150 px and places the project panel before the timeline.

Increase drawing control targets from the current 36 × 36 px to approximately 44 × 44 px on touch layouts, with enough separation to avoid accidental presses. Retain keyboard operation and visible focus.

## Design and validation notes

- Treat the sizes and placement above as hypotheses. Review them in a real browser at desktop, tablet and phone widths, including light and dark themes.
- Preserve the existing role permissions, archived read-only behaviour, timeline editing, uploads, document preview states, conversations, and map access listed in the [UI Redesign Feature Preservation Inventory](UI%20Redesign%20Feature%20Preservation%20Inventory.md).
- Validate the reading order with both architect and client tasks before settling the layout.

## Source references

- `Frontend/src/pages/DashboardPage.tsx`
- `Frontend/src/pages/CompanyProjectsCreatePage.tsx`
- `Frontend/src/pages/CompanyProjectPage.tsx`
- `Frontend/src/components/ProjectWorkspace.tsx`
- `Frontend/src/styles.css`
- `Frontend 2/src/project.css`
