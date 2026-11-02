FROM alpine:3.24@sha256:be2656061b536c1883c4034790e21d0a09c5aaaf51968b89368a3c0371ea2c9a

ADD --checksum=sha256:01f866e9c5f9b87c2b09116fa5d7c06695b106242d829a8bb32990c00312e891 \
  https://github.com/minio/mc/releases/download/RELEASE.2025-08-13T08-35-41Z/mc.linux-amd64.RELEASE.2025-08-13T08-35-41Z \
  /usr/local/bin/mc

COPY deploy/minio-bootstrap.sh /opt/racletty/minio-bootstrap.sh
COPY deploy/minio-app-policy.json /opt/racletty/minio-app-policy.json

RUN chmod 0755 /usr/local/bin/mc

ENTRYPOINT ["/bin/sh", "/opt/racletty/minio-bootstrap.sh"]
