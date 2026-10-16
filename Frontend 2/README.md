# Warm Workshop UI

This folder holds the Warm Workshop theme and project styling for the default UI at `/`. React routes, components, forms, permissions, and API calls live in `Frontend/src`.

## Run

From the repository root:

```sh
docker compose up -d --build racletty-api racletty-frontend
```

Open `http://localhost:5385/` for the Workshop UI.

For host development, run `npm run dev` from `Frontend`. Use `npm run build` to validate the production bundle in `Frontend/dist`.

The four-way comparison remains at `/design-lab` in development. The previous UI remains available in Git history if a rollback is needed.
