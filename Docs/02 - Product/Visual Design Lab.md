# Visual Design Lab

**Status:** Experimental  
**Owner:** Product / Frontend  
**Last updated:** 2026-10-15

Open `http://localhost:5385/design-lab` after starting the frontend with `npm run dev` from `Frontend`. The route is available by default in Vite development mode. To include it in a preview or production build, set `VITE_ENABLE_DESIGN_LAB=true` at build time; without that opt-in, the route is unavailable.

The lab uses synthetic Portuguese content and makes no authentication or project API calls. Its four buttons at the top change only the lab preview. Use the separate Boas-vindas, Dashboard, and Projeto buttons to compare the same content in each style. The login form and project share action are illustrative and do not submit data.

The current production screens, logo, and saved theme preference are independent of this experiment. To review the motion alternative, enable **Reduce motion** in the operating system or browser emulation. External Google Fonts improve the intended typography; system and local fallbacks remain usable if fonts cannot load.

## Current comparison

The fourth button, **Workshop**, is the evolving blend of the user's preferred details: dotted surfaces and square drawing grids, Studio's rounded controls and Nunito type, Atelier's 2D spatula mascot, and Blueprint's structured cards and offset shadows. Its palette is a muted cream, sage, and coral exploration. The first three styles remain reference options. Workshop also tries a different project hierarchy: one current action, the revision drawing, and the related discussion together. This is a visual prototype; none of the project actions send data.
