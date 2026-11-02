# syntax=docker/dockerfile:1

# Build from the Backend directory:
#   docker build -t racletty-api ./Backend
#
# If this directory later contains more than one project, specify the API project:
#   docker build --build-arg PROJECT=src/Racletty.Api/Racletty.Api.csproj -t racletty-api ./Backend
ARG DOTNET_VERSION=10.0

FROM mcr.microsoft.com/dotnet/sdk:${DOTNET_VERSION}@sha256:de4fe90a98845d75910b9769662465c84de1a934665c431279d1382b2bddc02b AS build
WORKDIR /src

# Set PROJECT to the path of the API .csproj (relative to the build context) when
# the build context contains multiple projects. A single project is discovered
# automatically.
ARG PROJECT=
COPY . .

RUN set -eu; \
    if [ -z "$PROJECT" ]; then \
        set -- $(find . -type f -name '*.csproj' -print); \
        [ "$#" -eq 1 ] || { echo 'Expected exactly one .csproj; set --build-arg PROJECT=<path-to-api.csproj>.' >&2; exit 1; }; \
        PROJECT="$1"; \
    fi; \
    test -f "$PROJECT"; \
    dotnet restore "$PROJECT"; \
    dotnet publish "$PROJECT" --configuration Release --no-restore --output /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:${DOTNET_VERSION}@sha256:de0ee358cdd672f7017a003bed21e9ac9ed48a27c922a59b18175b6e82fa7fee AS final
WORKDIR /app

# Npgsql can use GSSAPI/Kerberos authentication. The ASP.NET runtime image does
# not include its native library, so install it explicitly to avoid a startup
# loader failure when PostgreSQL advertises GSSAPI.
RUN apt-get update \
    && apt-get install --yes --no-install-recommends libgssapi-krb5-2 curl \
    && rm -rf /var/lib/apt/lists/*

RUN useradd --uid 10001 --create-home --shell /usr/sbin/nologin racletty \
    && mkdir -p /var/lib/racletty/keys \
    && chown -R racletty:racletty /var/lib/racletty

# ASP.NET Core listens on port 1818 by default in .NET 8+ container images.
ENV ASPNETCORE_URLS=http://+:1818 \
    DOTNET_RUNNING_IN_CONTAINER=true \
    DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=false

EXPOSE 1818

COPY --from=build /app/publish .

USER 10001:10001

# The runtime configuration identifies the API assembly without requiring its
# name to be duplicated in this Dockerfile.
ENTRYPOINT ["sh", "-c", "runtimeconfig=$(find /app -maxdepth 1 -type f -name '*.runtimeconfig.json' -print -quit); test -n \"$runtimeconfig\"; exec dotnet \"${runtimeconfig%.runtimeconfig.json}.dll\""]
