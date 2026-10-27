# UI Redesign — Feature Preservation Inventory

**Status:** Baseline for Warm Workshop migration  
**Owner:** Product / Frontend  
**Last updated:** 2026-10-15

## Scope and evidence

This inventory records behavior **implemented in the frontend today**, based on the cited source and tests. It is the preservation checklist for adapting the real app to the [Warm Workshop Design Book](Warm%20Workshop%20Design%20Book.md). The design lab uses synthetic content and does not implement these workflows. `Core Workflows.md` describes broader product goals, including revision publication and approval, but is not evidence that those features already exist in the UI.

The routes in `Frontend/src/App.tsx` remain the navigation contract. The three lab screens correspond to `/`, `/dashboard`, and `/projects/:id`; the latter is reached through `/projects`. Shared shell behavior also affects `/clients`, `/administration`, `/settings`, `/notifications`, and `/profile`, so global style changes must be checked there before rollout.

## Shared contracts

| Area | Existing behavior to preserve | Source / existing proof |
| --- | --- | --- |
| Authentication and routes | Authenticated routes redirect when no roles are present; dashboard and settings/admin routes apply role gates. | `App.tsx`, `App.test.tsx` |
| Shell navigation | Role-aware links, active state, mobile drawer, collapsed sidebar, profile entry, logout, and company/client context. | `PortalShell.tsx` |
| Notifications in shell | Unread count refreshes on interval, window focus, and notification events. | `PortalShell.tsx`, `api/notifications.ts` |
| Themes | Saved light/dark/dynamic preference and temporary profile preview. | `theme/ThemeContext.tsx`, `theme.ts`, `ProfilePage.test.tsx` |
| Brand | Current production `BrandLogoMark` in login and shell. A mascot replacement is not yet approved. | `LoginPage.tsx`, `PortalShell.tsx` |
| Accessibility and responsive behavior | Semantic labels, visible focus, keyboard operation, mobile navigation, and legible status/error states. | Existing page/component markup and styles; browser recheck required |

## Welcome and login (`/`)

Source: `Frontend/src/pages/LoginPage.tsx`; behavior coverage in `Frontend/src/App.test.tsx`.

| Preserve | Important cases |
| --- | --- |
| Username/password form | Required-field validation, max lengths, autocomplete, submit by keyboard, pending state that prevents duplicate submission. |
| Password reveal | Toggle value visibility and accessible show/hide label without altering the entered password. |
| Authentication response | Successful login stores roles/environment and navigates to `/dashboard`; invalid credentials, server failure, and network failure show distinct messages. |
| Development shortcuts | Quick-login options appear only in development and use the same real login flow. |
| Responsive brand and form | Brand mark, welcome information, and fields remain usable on mobile. |

**Current visual controls without wired behavior:** “Forgot password?”, “Keep me signed in”, “Contact your practice administrator”, and footer Privacy/Terms/Help buttons have no handler in `LoginPage.tsx`. Preserve their visibility if redesigning this page, but do not describe them as functioning features or invent a flow in a visual-only change.

## Dashboard (`/dashboard`)

Source: `Frontend/src/pages/DashboardPage.tsx`, `ProjectCard.tsx`, `NotificationList.tsx`; relevant coverage in `App.test.tsx`.

| Preserve | Important cases |
| --- | --- |
| Real project and notification data | Projects load from API; unread notifications and per-project counts come from hooks. Loading, request errors, no active projects, and search-empty results remain distinct. |
| Two organization modes | “Notifications above projects” and “Notifications grouped by project”; selection persists in session storage. |
| Notification actions | Read one, mark all read, see all unread, and view per-project unread preview in grouped mode. |
| Search | Filters active projects by title, code, address, client, company, and assigned members; clear action restores results. Archived projects do not appear in the active dashboard list. |
| Project card details and navigation | Open the correct project; show phase, contact, location, and unread count. Client and owner views reveal different contact/member information. |
| Role-sensitive view | Client/employee differences are based on profile data, not on the lab sample persona. |

## Project list (`/projects`)

Source: `Frontend/src/pages/CompanyProjectsPage.tsx` and `ProjectCard.tsx`.

| Preserve | Important cases |
| --- | --- |
| Active and archived groups | Both have counts and independent expand/collapse controls; search covers both. |
| Client grouping | Client projects are grouped by company; employee projects use the normal grid. |
| Owner action | Only a company owner sees “Criar projeto”. |
| Search and card navigation | Search includes project, company, client, and address; cards open `/projects/:id`. |

## Real project page (`/projects/:id`) — first pilot

Source: `Frontend/src/pages/CompanyProjectPage.tsx`, `ProjectTimelineEditor.tsx`, `ProjectDocumentViewer.tsx`, `ProjectFileViewer.tsx`, and `ProjectWorkspace.tsx`. Existing coverage includes `CompanyProjectPage.test.tsx`, `ProjectWorkspace.test.tsx`, `ProjectTimelineEditor.test.ts`, and document viewer tests.

| Area | Implemented behavior that must survive | Cases for the redesigned page |
| --- | --- | --- |
| Project identity | Title, code, company, clients, address, assigned architects, current phase, unread notification count, archived state, and back navigation. | Missing optional fields, long names, multiple clients/members, archived badge, role visibility. |
| Owner editing | Edit title/code/address/Google Maps URL; select clients and architects; search members; save; cancel; confirm discarding unsaved changes. | Validation, request error, saving state, empty client/member lists; nonowners cannot access owner editing. |
| Location | Embedded map and external Google Maps link when available; location-empty state; map picker while editing. | Missing/invalid map link, mobile width, external link remains obvious. |
| Timeline | Show current and viewed phases; switch viewed phase; expand/collapse; authorized edit, quick fill, set current, save and cancel. | No phases, repeated phase codes, edit failure, narrow width, keyboard menu. |
| Document list | Group by phase; expand folders; select one/additive/range; upload, delete with confirmation, download, and change client visibility. | Pending/failed uploads, partial delete failure, loading/error, archived read-only behavior, per-item progress. |
| Viewer | Choose newest available drawing by default; switch document; drawing pan/select/zoom, conversation markers, maximize, file preview, unsupported-format message, loading/error/retry. | No document, non-drawing file, slow request, switch while a prior request is pending, mobile tool access. |
| Conversation workspace | General chat, drawing-linked conversation index and chat, new conversation from selected drawing part, file tree, tabs, collapse, load older, send and retry. | Empty conversation, failed send with draft retained, archived read-only, keyboard tabs, selected drawing context. |
| Archive lifecycle | Owner archive/reactivate action with confirmation and navigation. | Confirmation, busy/error state, archived read-only restrictions. |

**Do not substitute lab content:** The Workshop sample says “R07”, “Marta”, and “Preparar partilha” and shows a static plan. The real page does not always have these values or a share action. A production focus card must derive any action, document, person, and status from real supported data. If there is no valid action, show an honest state instead of a dead button.

### Proposed project composition for the pilot

| Workshop region | Production source to present there | Preservation note |
| --- | --- | --- |
| Project header | `project-hero` identity, unread count, owner edit, location, current phase | Retain the full edit form and location map/picker; the compact lab header is insufficient. |
| Current-work summary | Existing current/viewed phase and selected available document | Do not invent a revision number or a share CTA. If no document exists, explain the empty state. |
| Main work area | `ProjectDocumentViewer` with current `ProjectDocuments` selection | Preserve viewer tools, maximization, preview formats, document management, and progress/error states. |
| Conversation area | `ProjectWorkspacePanel` tabs, global and drawing-linked conversations | The lab comment card is a visual cue; the real workspace contains several tabs and full chat history. |
| Journey / timeline | `ProjectTimelineView` and `ProjectTimelineEditor` | Keep phase selection and authorized editing, including empty timeline and repeated phases. |
| Secondary management | Owner project editing and archive/reactivate dialogs | Keep access checks, confirmation, and navigation behavior. |

This mapping is a design starting point. The first code change should establish a responsive layout around these existing components, then style the components themselves; no component should disappear simply because it lacks an equivalent in the lab.

## Adjacent routes to recheck for shared styling

`/projects/new`, `/clients`, `/clients/:id`, `/administration`, `/settings`, `/settings/storage`, `/notifications`, and `/profile` are outside the first three screen compositions. They share global CSS and/or `PortalShell`. A shell or token change cannot ship until these routes are checked at least for navigation, controls, dialogs, dense data, empty/error states, and both theme modes. Their detailed feature inventories should be completed before changing each route's composition.

## Pilot acceptance checklist

- [ ] Record before screenshots of the current project page in ordinary, empty, loading/error, archived, owner-edit, and mobile states using representative test fixtures or available local data.
- [ ] Map every project row above to an existing component and planned visual placement; keep API calls, access checks, and state ownership in the current production code.
- [ ] Implement Workshop styling on the real project page without importing lab sample data or lab components.
- [ ] Run focused project page/workspace/viewer tests and the full frontend suite; add focused coverage only for a behavior whose placement or interaction changes.
- [ ] In a browser, exercise owner and nonowner views, current/viewed phase, document selection/upload/download/visibility/delete, viewer tools, conversation tabs/send, archived read-only, and failure/empty states.
- [ ] Check desktop and narrow mobile layouts, keyboard focus/order, reduced motion, and light/dark/dynamic theme outcomes. No important control may be hidden by the new composition.
- [ ] Compare the completed page to this inventory and record any intentional product-behavior change separately; a visual migration alone does not remove features.

The last lab implementation baseline passed 157 frontend tests and a production build. That proves the lab and current code compiled at that point; it does not prove a future production redesign preserves these workflows. The pilot must pass the checks above on its own.

## Pilot progress — 2026-10-15

The project page now uses a route-scoped Workshop shell and stylesheet. Its real hero precedes the workspace; the existing document viewer and conversation panel sit together, followed by the timeline and document list. The same production components and API wiring remain in place. The project stylesheet includes light and dark values and mobile layout rules. Other routes are not opted into this variant.

Focused project tests passed (47/47), the full frontend suite passed (157/157), and the frontend production build passed. Browser smoke checks used the local development API with an existing architect account and project: desktop and 390 px mobile layout, no horizontal overflow, owner edit open/cancel, timeline editor open/cancel, conversation tab selection, and dark/light rendering. The account's original light theme preference was restored after the dark check. These checks do **not** complete the full pilot acceptance list: client/nonowner and archived states, destructive/document mutation paths, all failure states, keyboard focus order, and reduced motion still require verification before treating the project redesign as finished.

The development quick-login client credential did not authenticate in the current local data, so a live client view was unavailable for this pass. Existing automated tests still cover client-facing and archived behavior; a later browser pass needs a valid local client fixture.
