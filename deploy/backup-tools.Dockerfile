FROM alpine:3.24@sha256:be2656061b536c1883c4034790e21d0a09c5aaaf51968b89368a3c0371ea2c9a

RUN apk add --no-cache age postgresql17-client tar gzip rclone
WORKDIR /opt/racletty
COPY docker-stack.production.yml /opt/racletty/docker-stack.production.yml
COPY deploy/portainer-backup.sh /usr/local/bin/racletty-backup
COPY deploy/portainer-restore.sh /usr/local/bin/racletty-restore
COPY deploy/portainer-fetch-backup.sh /usr/local/bin/racletty-fetch-backup
COPY deploy/portainer-reset-keys.sh /usr/local/bin/racletty-reset-keys
RUN chmod 0755 /usr/local/bin/racletty-backup /usr/local/bin/racletty-restore /usr/local/bin/racletty-fetch-backup /usr/local/bin/racletty-reset-keys

CMD ["sh", "-c", "while :; do sleep 3600; done"]
