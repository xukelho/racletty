# Complete Blueprint-to-Racletty Rename Plan

## Summary

Rename the application completely from Blueprint to Racletty, including the GitHub repository, local checkout, .NET project identity, namespaces, frontend metadata and runtime resource names. This is a deliberate clean break: only the local Docker Compose environment is reset, with no compatibility reads, old aliases, or data migration from Blueprint.

## Conventions and overrides

### Conventions

- Use `Racletty` for product-facing text, .NET assembly/project/namespace/class identifiers, and repository names; use `racletty` for lowercase technical identifiers.
- Rename every tracked `Blueprint`/`blueprint` reference unless it is part of a deliberately retained Git-history reference. Finish with a case-insensitive tracked-file scan that has no product-identity matches.
- Rename the existing root asset `raclette logo.svg` to `racletty-logo.svg` without changing its SVG artwork. Make `Frontend/src/assets/racletty-logo.svg` the bundled runtime copy and update [`BrandLogoMark.tsx`](../../Frontend/src/components/BrandLogoMark.tsx) to import it.
- Keep the existing API paths, domain table names, user-facing behavior, ports, and initial administrator credentials unchanged. This is a naming migration, not an API or domain-model redesign.
- Use the current test conventions: xUnit integration/unit tests in `Backend.Tests`, Vitest/Testing Library tests in `Frontend/src`, and Compose as the local end-to-end runtime.
- Treat every old browser cookie/session-storage value as invalid. The renamed application writes only `racletty.*` keys and `racletty.session`; it does not read or clear Blueprint keys as a compatibility feature.

### Overrides

- **Previous assumption:** existing Blueprint environments and data should be preserved. **Requirement:** perform a clean break and wipe the Blueprint local Compose environment. **Why:** the user explicitly accepted loss of local data.
- **Previous assumption:** EF migration history should stay intact and merely be namespace-renamed. **Requirement:** replace the current historical migration chain with one generated Racletty `InitialCreate` baseline. **Why:** the new local database is intentionally empty, and the old history remains recoverable in Git.
- **Previous assumption:** the existing visual asset has a separate `raclette` identity. **Requirement:** retain its pixels but rename the source asset to `racletty-logo.svg`. **Why:** the user chose the existing mark as the Racletty visual asset.
- **Boundary:** reset only the Docker Compose database, MinIO data, containers, images if desired, and browser state on this developer machine. Do not delete, migrate, or alter any separately hosted staging or production service.

## Steps

### 1. Rename the repository and checkout identity

**Owner:** Full-stack implementation

**What:** Rename the GitHub repository and local checkout from Blueprint to Racletty.

**Where:** GitHub repository `xukelho/blueprint`, the local directory `C:\Git\blueprint`, Git remote `origin`, [`README.md`](../../README.md), [`Backend/README.md`](../../Backend/README.md), [`.env.example`](../../.env.example), [`Makefile`](../../Makefile), and Dockerfile comments.

**How:** Rename the GitHub repository to `xukelho/racletty` using an authorized GitHub action, then set `origin` to the new URL. Once all in-repository renames and validation pass, move the checkout to `C:\Git\racletty`; do this last because the active execution session starts in the old directory. Replace written references to Blueprint in root/backend documentation, examples, comments, and local environment instructions. Do not claim hosted environment changes in the documentation.

**Depends on:** None.

### 2. Rename the .NET project, namespaces, and context types

**Owner:** Backend implementation

**What:** Change the backend compilation identity from `Blueprint.Api` to `Racletty.Api`.

**Where:** `Backend/Blueprint.Api.csproj` -> `Backend/Racletty.Api.csproj`; `Backend.Tests/Blueprint.Api.IntegrationTests.csproj` -> `Backend.Tests/Racletty.Api.IntegrationTests.csproj`; all `Backend/**/*.cs` and `Backend.Tests/**/*.cs`; `BlueprintDbContext.cs` -> `RaclettyDbContext.cs`; `BlueprintDbContextFactory.cs` -> `RaclettyDbContextFactory.cs`.

**How:** Rename both project files, set the application project `RootNamespace` to `Racletty.Api`, update the test project reference to the renamed backend project, and replace `Blueprint.Api` using/import/namespace declarations throughout application and test code. Rename the context and design-time factory classes/files and every generic registration/reference; [`Program.cs`](../../Backend/Program.cs:1) currently registers `BlueprintDbContext`, and [`DatabaseInitializer.cs`](../../Backend/Data/DatabaseInitializer.cs:4) resolves it before calling `MigrateAsync`. Preserve the context model mappings and startup seed behavior exactly.

**Depends on:** 1.

### 3. Replace migration history with a fresh Racletty baseline

**Owner:** Backend implementation

**What:** Remove the obsolete migration history and generate one baseline migration from the renamed current model.

**Where:** all files in `Backend/Data/Migrations/`; migration-specific assertions in `Backend.Tests/ProjectClientMigrationIntegrationTests.cs` and `Backend.Tests/ProjectDocumentVisibilityMigrationIntegrationTests.cs`; renamed `RaclettyDbContext` and `RaclettyDbContextFactory`.

**How:** Delete the current generated migration `.cs`/`.Designer.cs` files and `BlueprintDbContextModelSnapshot.cs`. After step 2 compiles, use the EF tool against `Backend/Racletty.Api.csproj` to generate a single migration named `InitialCreate` in `Data/Migrations`, using `RaclettyDbContext`; commit both its generated migration and `RaclettyDbContextModelSnapshot.cs`. Replace tests that assert the old incremental migration chain with focused tests that verify the baseline can create a fresh database and the current schema supports the existing workflows. Do not hand-edit the generated migration or snapshot. [`DatabaseInitializer.cs`](../../Backend/Data/DatabaseInitializer.cs:11) must continue using `Database.MigrateAsync`, so a new local database auto-creates and seeds the admin account.

**Depends on:** 2.

### 4. Rename backend and test runtime identifiers

**Owner:** Backend implementation

**What:** Replace Blueprint-specific cookies, configuration, database/object-storage defaults, test prefixes, and environment variables with Racletty names.

**Where:** [`Backend/Program.cs`](../../Backend/Program.cs:41), [`Backend/appsettings.json`](../../Backend/appsettings.json), `Backend/Data/RaclettyDbContextFactory.cs`, all `Backend.Tests/**/*.cs`, [`Backend/README.md`](../../Backend/README.md), and [`.env.example`](../../.env.example).

**How:** Change the authentication cookie to `racletty.session`. Replace `blueprint` database, PostgreSQL user, development password, MinIO user/password, and `blueprint-private` bucket defaults with consistently named Racletty equivalents (for example, `racletty`, `racletty_dev`, `racletty_dev_password`, and `racletty-private`). Rename `BLUEPRINT_TEST_*` variables and generated test database prefixes to `RACLETTY_TEST_*`/`racletty_*`. Update tests, fixture connection strings, and docs in the same change. Keep service ports and API routes stable. Do not supply Blueprint fallbacks.

**Depends on:** 2, 3.

### 5. Rename the Compose stack and local developer controls

**Owner:** Backend implementation

**What:** Make Compose and Make targets use only Racletty service, volume, database, bucket, and credential names.

**Where:** [`docker-compose.yml`](../../docker-compose.yml:1), [`Makefile`](../../Makefile:1), [`Backend/Dockerfile`](../../Backend/Dockerfile), [`Frontend/Dockerfile`](../../Frontend/Dockerfile), [`.env.example`](../../.env.example), and [`Backend/appsettings.json`](../../Backend/appsettings.json).

**How:** Preserve Compose project name `racletty`, then rename `blueprint-frontend`, `blueprint-api`, `blueprint-frontend-node-modules`, `blueprint-db`, and `blueprint-objects` to `racletty-*`. Update `VITE_API_PROXY_TARGET`, `depends_on`, Makefile service targets, named-volume declarations, PostgreSQL configuration, MinIO setup command, and application object-store connection settings as one consistent graph. Preserve the `postgresdb` and `minio` service names only if deliberately left generic; the preferred clean result is `racletty-db` and `racletty-minio`, with every hostname reference updated. Retain loopback port bindings and the existing health-check/startup ordering.

**Depends on:** 4.

### 6. Rename frontend package, browser state, UI copy, and visual assets

**Owner:** Frontend implementation

**What:** Replace frontend-facing Blueprint identity and client runtime keys with Racletty.

**Where:** [`Frontend/package.json`](../../Frontend/package.json:1), [`Frontend/package-lock.json`](../../Frontend/package-lock.json), [`Frontend/index.html`](../../Frontend/index.html), `Frontend/src/**/*.tsx`, `Frontend/src/**/*.ts`, frontend tests, `Frontend/src/assets/logo.svg` -> `Frontend/src/assets/racletty-logo.svg`, [`Frontend/src/components/BrandLogoMark.tsx`](../../Frontend/src/components/BrandLogoMark.tsx:1), and root `raclette logo.svg` -> `racletty-logo.svg`.

**How:** Change package metadata to `racletty-frontend`, replace visible text/metadata/accessibility labels with the correctly cased Racletty product name, and update all tests accordingly. Replace the auth keys and events in [`auth.ts`](../../Frontend/src/auth.ts:11), environment cache key in [`environment.ts`](../../Frontend/src/environment.ts:3), theme key in [`theme.ts`](../../Frontend/src/theme.ts:4), dashboard state key, and notification event with `racletty.*` names. Rename/import the logo asset while preserving its bytes. Do not retain a legacy key constant or migration code: an existing Blueprint browser session must result in the normal signed-out state.

**Depends on:** 1, 5.

### 7. Perform the local clean-break cutover

**Owner:** Full-stack implementation

**What:** Remove only the known local Blueprint Compose runtime data and start an empty Racletty stack.

**Where:** Local Docker resources created by the current [`docker-compose.yml`](../../docker-compose.yml:10): current `racletty` Compose containers plus named volumes `blueprint-db`, `blueprint-objects`, and `blueprint-frontend-node-modules`; browser data for the local application origin.

**How:** Before deletion, inspect the exact target containers and volumes with `docker compose -p racletty ps -a` and `docker volume inspect blueprint-db blueprint-objects blueprint-frontend-node-modules`. Stop the current stack using `docker compose -p racletty down --volumes --remove-orphans`, then remove only those three exact legacy volumes if they remain. The MinIO bucket/object data is contained in `blueprint-objects`; deleting that volume is the approved wipe. Do not use broad Docker prune commands and do not operate on hosted resources. Clear site data/cookies/session storage for the local application origin. Start the renamed stack with `docker compose up --build`, confirm its new Racletty database and bucket are empty before startup, then confirm startup creates schema, bucket, and initial admin data.

**Depends on:** 3, 4, 5, 6.

### 8. Verify the rename and clean startup end-to-end

**Owner:** Tester

**What:** Prove that only Racletty identity remains in tracked source and that the new local stack works from empty state.

**Where:** entire repository, `Backend/Racletty.Api.csproj`, `Backend.Tests/Racletty.Api.IntegrationTests.csproj`, `Frontend/`, and the Racletty Compose stack.

**How:** Run a case-insensitive `rg` scan over tracked source for `blueprint` and `raclette`; resolve every match except an explicitly documented Git-history reference. Run `dotnet test` against the renamed test project, `npm run test:run`, and `npm run build` from `Frontend`. Build/start the Compose stack and verify health/authentication, fresh admin login, Racletty session cookie and browser keys, database migration/seed, MinIO bucket creation, and an object upload/download workflow. Confirm the login and portal render the retained logo asset and Racletty text. Record command output and any manual browser checks in the implementation handoff.

**Depends on:** 7.

## Acceptance criteria

- AC-1 → steps 1, 2, 6: The GitHub repository, local checkout, .NET projects, namespaces, package metadata, documentation, visible UI, HTML metadata, and logo asset identify the product as Racletty; the original logo artwork is retained under `racletty-logo.svg`.
- AC-2 → steps 2, 3: `Racletty.Api` and `Racletty.Api.IntegrationTests` build with no `Blueprint.Api` namespace, project-reference, context, factory, or model-snapshot identifiers.
- AC-3 → steps 3, 4: A new Racletty database initializes from one generated `InitialCreate` migration and seeds the current initial administrator; the old migration history is absent from the working tree.
- AC-4 → steps 4, 5, 7: The local Compose environment uses only Racletty service, volume, database, PostgreSQL user, object-storage bucket, credential, cookie, test-prefix, and configuration identities.
- AC-5 → steps 6, 7: A browser with old Blueprint cookies/session-storage values receives no compatibility behavior and starts signed out; a new login writes only Racletty keys and `racletty.session`.
- AC-6 → steps 7, 8: Only the local Blueprint Compose resources are deleted; no hosted staging or production resource is modified.
- AC-7 → step 8: Backend tests, frontend tests, frontend production build, and an empty-state local Compose smoke test pass.
- AC-8 → step 8: A case-insensitive scan of tracked source finds no remaining Blueprint/blueprint or raclette product-identity references.

## Decisions log

When a settled decision deviates from or extends this plan, append one line — the decision and its why — to `rebranding-racletty.DECISIONS.md` beside this plan, the moment it is settled.
