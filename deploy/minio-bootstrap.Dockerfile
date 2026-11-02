FROM minio/mc:RELEASE.2025-08-13T08-35-41Z@sha256:a7fe349ef4bd8521fb8497f55c6042871b2ae640607cf99d9bede5e9bdf11727

COPY deploy/minio-bootstrap.sh /opt/racletty/minio-bootstrap.sh
COPY deploy/minio-app-policy.json /opt/racletty/minio-app-policy.json

ENTRYPOINT ["/bin/sh", "/opt/racletty/minio-bootstrap.sh"]
