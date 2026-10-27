.PHONY: start up stop down restart \
	startdb updb stopdb downdb restartdb \
	startapi upapi stopapi downapi restartapi \
	startfrontend upfrontend stopfrontend downfrontend restartfrontend

# Full application
start up:
	docker compose up --build

stop down:
	docker compose down

restart:
	$(MAKE) down
	$(MAKE) up

# Database (racletty-db)
startdb updb:
	docker compose up racletty-db

stopdb:
	docker compose stop racletty-db

downdb:
	docker compose stop racletty-db
	docker compose rm -f racletty-db

restartdb:
	$(MAKE) downdb
	$(MAKE) updb

# API (racletty-api)
startapi upapi:
	docker compose up --build racletty-api

stopapi:
	docker compose stop racletty-api

downapi:
	docker compose stop racletty-api
	docker compose rm -f racletty-api

restartapi:
	$(MAKE) downapi
	$(MAKE) upapi

# Frontend (racletty-frontend)
startfrontend upfrontend:
	docker compose up racletty-frontend

stopfrontend:
	docker compose stop racletty-frontend

downfrontend:
	docker compose stop racletty-frontend
	docker compose rm -f racletty-frontend

restartfrontend:
	$(MAKE) downfrontend
	$(MAKE) upfrontend
