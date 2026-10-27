# Frontend UX before and after

These screenshots use the real Vite frontend at `http://localhost:5385/` with the same browser-only API fixtures for both captures. They do not use or change the backend or database. The sample project is **Casa do Vale**.

| View | Before | After |
| --- | --- | --- |
| Project, desktop (1440 × 900) | [Screenshot](before/project-desktop.png) | [Screenshot](after/project-desktop.png) |
| Project, tablet (900 × 900) | [Screenshot](before/project-tablet.png) | [Screenshot](after/project-tablet.png) |
| Project, mobile (390 × 844) | [Screenshot](before/project-mobile.png) | [Screenshot](after/project-mobile.png) |
| Dashboard, desktop | [Screenshot](before/dashboard-desktop.png) | [Screenshot](after/dashboard-desktop.png) |
| Create project, desktop | [Screenshot](before/create-desktop.png) | [Screenshot](after/create-desktop.png) |

Additional after states: [Viewing another phase](after/project-other-phase.png) and [recovering from a project creation error](after/create-error-desktop.png).

The browser log in `after/browser-errors.json` records the expected HTTP 409 response used to demonstrate the creation error. No uncaught page errors or horizontal overflow were detected in the captured project views.

The capture script is `capture.mjs`. Run it with Node.js and Playwright available (`PLAYWRIGHT_MODULE` can point to a Playwright module if it is not installed locally), while the frontend runs on port 5385. Running it with `after` refreshes the after images; the before images represent the frontend before the changes on 2026-10-17.
