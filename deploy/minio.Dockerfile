# Build the last upstream MinIO community release that contains the 2025-10
# policy fix. Upstream no longer publishes an official container for it.
FROM golang:1.24.8-alpine3.22@sha256:3d78beb141d98f42337f1252ecf2a5f20374109929a4c3f6817f9e4179cc0ae5 AS build
RUN apk add --no-cache git
ARG MINIO_VERSION=RELEASE.2025-10-15T17-29-55Z
ARG MINIO_COMMIT=9e49d5e7a648f00e26f2246f4dc28e6b07f8c84a
ARG TARGETARCH
RUN git clone --depth 1 --branch "$MINIO_VERSION" https://github.com/minio/minio.git /src
RUN test "$(git -C /src rev-parse HEAD)" = "$MINIO_COMMIT"
WORKDIR /src
RUN mkdir -p /out \
    && CGO_ENABLED=0 GOOS=linux GOARCH="$TARGETARCH" \
       go build -tags kqueue -trimpath -o /out/minio .

FROM alpine:3.24@sha256:be2656061b536c1883c4034790e21d0a09c5aaaf51968b89368a3c0371ea2c9a
RUN apk add --no-cache ca-certificates
COPY --from=build /out/minio /usr/bin/minio
COPY --from=build /src/dockerscripts/docker-entrypoint.sh /usr/bin/docker-entrypoint.sh
ENTRYPOINT ["/usr/bin/docker-entrypoint.sh"]
VOLUME ["/data"]
CMD ["minio"]
