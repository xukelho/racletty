# Racletty

Racletty is a browser-based collaboration platform for architecture professionals and their clients.

It provides a shared, revision-centred workspace where professionals can publish project revisions and clients can review them, provide contextual feedback and record decisions. The product is intended to improve clarity, traceability and confidence throughout the revision and approval process.

Racletty does not replace CAD or BIM authoring software. It complements existing professional tools by centralising the collaboration that currently takes place across email, messaging applications, shared folders and meetings.

## Project Status

**Current phase:** Alpha development and deployment preparation

**Documentation status:** Product and architecture documentation in progress

**Last updated:** 2026-11-06

The application is being prepared for a controlled alpha. The repository includes a local production-mode build for diagnosis. Server deployment configuration will be added separately once the target environment is selected.

## Core Product Workflow

1. An architecture professional creates a project.
2. The professional uploads an IFC file as a new revision.
3. The platform processes the file and generates a browser-compatible 2D review representation.
4. The professional publishes the revision and invites the client.
5. The client reviews the revision and creates contextual comments or questions.
6. Participants discuss and resolve the matters raised.
7. The professional requests a decision when approval is required.
8. The platform preserves the revision, discussion and decision history.

## MVP Direction

The MVP is designed to validate one complete collaboration cycle on real architecture projects.

The initial product includes:

- Secure professional and client access
- Practice and project management
- IFC-based revision upload and asynchronous processing
- A limited browser-based 2D review experience
- Contextual comments, questions and replies
- Matter resolution and reopening
- Approval requests and recorded client decisions
- Revision and project history
- Notifications, audit records and essential operational controls

Advanced 3D visualisation, model editing, automatic revision comparison, billing, public sharing and native mobile applications are outside the initial MVP.

## Key Decisions

- The initial application will not use a formal multi-tenant architecture.
- Access boundaries must still be enforced between practices, projects and users.
- IFC is the primary project exchange format.
- The MVP review experience is focused on 2D views.
- Published revisions are immutable.
- MinIO is the selected S3-compatible object storage for development and the initial pilot.
- The primary application will begin as a modular monolith.
- IFC processing will run in a separate asynchronous worker.
- The initial repository will be a monorepository.

Technology marked as a baseline or candidate in the architecture documentation remains subject to validation before implementation.

## Repository Layout

| Path | Contents |
| --- | --- |
| `Backend/` | ASP.NET Core API, endpoints, services, storage and EF Core migrations. |
| `Backend.Tests/` | Integration and unit tests. |
| `Frontend/` | React 19 + TypeScript application built with Vite. |
| `Frontend 2/` | Shared workshop styles and assets consumed by the frontend build. |
| `Database/` | PostgreSQL development container. |
| `deploy/` | Dockerfiles, Caddy configuration, MinIO bootstrap and local smoke checks. |
| `Docs/` | Product, architecture and operations documentation. |
| `Samples/` | CAD samples used by parsers and tests. |

The backend begins as a modular monolith. The API owns authentication, project data, file metadata and object-storage access; MinIO provides S3-compatible storage; PostgreSQL is the system of record.

## Local Development

Prerequisites: Docker Engine with Compose. The development stack is defined in `docker-compose.yml` and can be driven with `make` or Compose directly.

| Service | Host address |
| --- | --- |
| Frontend (Vite) | <http://localhost:5385> |
| API | <http://localhost:1818> |
| PostgreSQL | `127.0.0.1:5837` |
| MinIO API / console | <http://localhost:9000> / <http://localhost:9001> |

Start everything with `make start`, or only one service with `make startdb`, `make startapi` or `make startfrontend`. The database and MinIO use development-only credentials defined in `docker-compose.yml`; never reuse them outside local development.

For production-mode container testing, use `docker-compose.production.yml` with `docker-compose.production.local.yml` as described in [Alpha Deployment](Docs/04%20-%20Operations/Alpha%20Deployment.md).

## Tests

```sh
dotnet test Backend.Tests/Racletty.Api.IntegrationTests.csproj
cd Frontend && npm ci && npm run test:run
```

The backend integration tests start PostgreSQL and MinIO through the test fixture and therefore need a working Docker environment. The frontend tests use Vitest.

## Documentation

### Product Foundation

- [Product Vision](Docs/01%20-%20Vision/Product%20Vision.md)
- [Problem Statement](Docs/01%20-%20Vision/Problem%20Statement.md)
- [Goals](Docs/01%20-%20Vision/Goals.md)
- [Non Goals](Docs/01%20-%20Vision/Non%20Goals.md)
- [Success Metrics](Docs/01%20-%20Vision/Success%20Metrics.md)
- [Target Users](Docs/01%20-%20Vision/Target%20Users.md)
- [MVP Scope](Docs/02%20-%20Product/MVP%20Scope.md)
- [Core Workflows](Docs/02%20-%20Product/Core%20Workflows.md)
- [Product Requirements](Docs/02%20-%20Product/Product%20Requirements.md)
- [Roadmap](Docs/02%20-%20Product/Roadmap.md)

### Architecture

- [Architecture Overview](Docs/03%20-%20Architecture/Architecture%20Overview.md)
- [Technology Stack](Docs/03%20-%20Architecture/Technology%20Stack.md)
- [Repository Structure](Docs/03%20-%20Architecture/Repository%20Structure.md)
- [Architecture Principles](Docs/03%20-%20Architecture/Architecture%20Principles.md)

### Operations

- [Local Production-mode Runbook](Docs/04%20-%20Operations/Alpha%20Deployment.md)

## Documentation Conventions

- Documents are written in British English.
- Draft documents must show their status, owner and last-updated date.
- Product documents describe the problem, expected outcomes and required behaviour.
- Architecture documents describe system boundaries, technical direction and engineering constraints.
- Significant technical choices that require investigation should be recorded as architecture decision records.
- Requirements use stable identifiers so that design, implementation and tests can reference them.
- A document should link to related documents rather than duplicate their detailed content.

## Docker Commands

Run these commands from the repository root. `make start` and the individual
service start commands run in the foreground, just like `docker compose up`.
Use `Ctrl+C` to stop a foreground process.

| Command | Description |
| --- | --- |
| `make start` / `make up` | Start all services defined in `docker-compose.yml`. |
| `make stop` / `make down` | Stop and remove all Compose containers and networks. |
| `make restart` | Bring down all services, then start them again. |
| `make startdb` / `make updb` | Start only the `racletty-db` database service. |
| `make stopdb` | Stop only the database service. |
| `make downdb` | Stop and remove only the database container. Its named volume is retained. |
| `make restartdb` | Remove the database container, then start it again. |
| `make startapi` / `make upapi` | Start only the `racletty-api` service. |
| `make stopapi` | Stop only the API service. |
| `make downapi` | Stop and remove only the API container. |
| `make restartapi` | Remove the API container, then start it again. |
| `make startfrontend` / `make upfrontend` | Start only the `racletty-frontend` service. |
| `make stopfrontend` | Stop only the frontend service. |
| `make downfrontend` | Stop and remove only the frontend container. |
| `make restartfrontend` | Remove the frontend container, then start it again. |

Docker Compose cannot run `down` for just one service: its `down` command always
targets the whole project. The service-specific `down*` commands therefore stop
and remove that service's container, which provides the equivalent scoped result.

For production-mode container testing, see
[Alpha Deployment](Docs/04%20-%20Operations/Alpha%20Deployment.md). It uses a
separate Compose project and volumes from local development.

## Guiding Principle

Racletty should make it unambiguous which revision is current, what feedback remains open, what decisions were made and who made them—without requiring clients to install specialist BIM software.
