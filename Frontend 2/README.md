# Warm Workshop UI

This folder holds the Warm Workshop theme and project styling. It is now the default UI at `/`. The React routes and components remain in `Frontend/src`, so forms, permissions, API calls, and feature fixes are shared between visual modes.

## Run

From the repository root:

```sh
docker compose up -d --build racletty-api racletty-frontend racletty-frontend-2
```

Open `http://localhost:5385/` for the Workshop UI. The top-right **Interface anterior** button opens the previous styling at the same route under `http://localhost:5385/legacy/`. Its **Nova interface** button returns to the default styling. Both URLs share the same browser origin and session storage. The legacy container also listens on port 5386 for direct inspection, though signing in there uses a separate browser origin.

For host development, run `npm run dev` and `npm run dev:legacy` from `Frontend` in separate terminals. Use `npm run build` and `npm run build:legacy` to validate both bundles. Production deployment should serve `Frontend/dist` as the default app; the legacy build in `Frontend 2/legacy-dist` is only needed while the rollback view remains available.

The four-way comparison remains at `/design-lab` in development. To roll back locally, use `/legacy/` or temporarily run the legacy build as the default deployment. Remove the legacy service and switcher after the new UI has been accepted in production.
