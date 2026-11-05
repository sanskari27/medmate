# Local development for the Medmate repo.
#
# Quick start:
#   make install     # Node dependencies
#   make dev         # Postgres, server-core on :8080, pharmacy console on :3203
#
# Run from the repository root. Override defaults on the command line, for example:
#   make db-up DB_PORT=5433

DB_NAME ?= pharmacy
DB_USER ?= pharmacy
DB_PASSWORD ?= pharmacy
DB_PORT ?= 5432
DB_IMAGE ?= postgres:16-alpine
DB_CONTAINER ?= medmate-postgres

SPRING_DATASOURCE_URL ?= jdbc:postgresql://127.0.0.1:$(DB_PORT)/$(DB_NAME)

NODE_APPS := pharmacy nammamedmate medmatepharmacy todo-react

.PHONY: help install doctor check dev db-up db-ready db-down db-logs db-psql \
	api api-compile api-test api-package todo-api todo-compile \
	pharmacy nammamedmate medmatepharmacy todo-react \
	pharmacy-check pharmacy-format build clean

help: ## Show available targets
	@awk 'BEGIN { FS = ":.*##" } \
	  /^## / { printf "\n%s\n", substr($$0, 4); next } \
	  /^[a-zA-Z0-9_-]+:.*##/ { printf "  %-18s %s\n", $$1, $$2 } \
	' Makefile

## Setup

install: ## Install Node dependencies (npm ci) for every frontend
	@for app in $(NODE_APPS); do \
	  echo "==> $$app"; \
	  npm ci --prefix "packages/apps/$$app"; \
	done

doctor: ## Report whether java, maven, node, docker, and python are available
	@command -v java >/dev/null && java -version 2>&1 | head -n 1 || echo "java: missing (need 21)"
	@command -v mvn >/dev/null && mvn -version 2>&1 | head -n 1 || echo "maven: missing"
	@command -v node >/dev/null && echo "node: $$(node -v)" || echo "node: missing (need 22)"
	@command -v npm >/dev/null && echo "npm: $$(npm -v)" || echo "npm: missing"
	@command -v docker >/dev/null && docker --version || echo "docker: missing (needed for Postgres and server-core tests)"
	@command -v python3 >/dev/null && python3 --version || echo "python3: missing"

check: ## Validate every packages/apps/*/project.yaml contract
	python3 scripts/validate_projects.py

## Run

dev: db-up ## Postgres + server-core (:8080) + pharmacy console (:3203)
	@test -d packages/apps/pharmacy/node_modules || { echo "Run 'make install' first"; exit 1; }
	@echo "API  http://127.0.0.1:8080/health"
	@echo "App  http://127.0.0.1:3203  (/api is proxied to the API)"
	@echo "Ctrl-C stops both. Use 'make api' and 'make pharmacy' in two terminals for separate logs."
	@set -eu; \
	trap 'kill $$api $$web 2>/dev/null || true; wait $$api $$web 2>/dev/null || true' EXIT INT TERM; \
	( cd packages/apps/server-core && \
	  exec env \
	    SPRING_DATASOURCE_URL="$(SPRING_DATASOURCE_URL)" \
	    SPRING_DATASOURCE_USERNAME="$(DB_USER)" \
	    SPRING_DATASOURCE_PASSWORD="$(DB_PASSWORD)" \
	    mvn -pl server-core-app -am spring-boot:run ) & api=$$!; \
	( cd packages/apps/pharmacy && exec npm run dev ) & web=$$!; \
	wait $$api $$web

api: ## Run server-core on :8080 against local Postgres
	cd packages/apps/server-core && \
	  SPRING_DATASOURCE_URL="$(SPRING_DATASOURCE_URL)" \
	  SPRING_DATASOURCE_USERNAME="$(DB_USER)" \
	  SPRING_DATASOURCE_PASSWORD="$(DB_PASSWORD)" \
	  mvn -pl server-core-app -am spring-boot:run

pharmacy: ## Pharmacy console on :3203 (proxies /api to :8080)
	@test -d packages/apps/pharmacy/node_modules || { echo "Run 'make install' first"; exit 1; }
	npm run dev --prefix packages/apps/pharmacy

nammamedmate: ## nammamedmate.com site on :3202
	@test -d packages/apps/nammamedmate/node_modules || { echo "Run 'make install' first"; exit 1; }
	npm run dev --prefix packages/apps/nammamedmate

medmatepharmacy: ## medmatepharmacy.com site on :3201
	@test -d packages/apps/medmatepharmacy/node_modules || { echo "Run 'make install' first"; exit 1; }
	npm run dev --prefix packages/apps/medmatepharmacy

todo-react: ## Sample todo UI (Vite default port)
	@test -d packages/apps/todo-react/node_modules || { echo "Run 'make install' first"; exit 1; }
	npm run dev --prefix packages/apps/todo-react

todo-api: db-up ## Run todo-server on :8081 (database name: todo)
	@docker exec "$(DB_CONTAINER)" psql -U "$(DB_USER)" -d postgres -tc \
	  "SELECT 1 FROM pg_database WHERE datname = 'todo'" | grep -q 1 \
	  || docker exec "$(DB_CONTAINER)" psql -U "$(DB_USER)" -d postgres -c "CREATE DATABASE todo"
	cd packages/apps/todo-server && \
	  SPRING_DATASOURCE_URL="jdbc:postgresql://127.0.0.1:$(DB_PORT)/todo" \
	  SPRING_DATASOURCE_USERNAME="$(DB_USER)" \
	  SPRING_DATASOURCE_PASSWORD="$(DB_PASSWORD)" \
	  SERVER_PORT=8081 \
	  mvn spring-boot:run

## Database

db-up: ## Start local Postgres in Docker (user/db/password: pharmacy)
	@command -v docker >/dev/null 2>&1 || { echo "docker is required for the local database"; exit 1; }
	@docker info >/dev/null
	@if docker ps --format '{{.Names}}' | grep -qx "$(DB_CONTAINER)"; then \
	  echo "$(DB_CONTAINER) is already running"; \
	elif docker ps -a --format '{{.Names}}' | grep -qx "$(DB_CONTAINER)"; then \
	  docker start "$(DB_CONTAINER)"; \
	else \
	  docker run -d --name "$(DB_CONTAINER)" \
	    -e POSTGRES_USER="$(DB_USER)" \
	    -e POSTGRES_PASSWORD="$(DB_PASSWORD)" \
	    -e POSTGRES_DB="$(DB_NAME)" \
	    -p "$(DB_PORT):5432" \
	    "$(DB_IMAGE)"; \
	fi
	@$(MAKE) db-ready

db-ready: ## Wait until local Postgres accepts connections
	@i=0; \
	while [ $$i -lt 30 ]; do \
	  if docker exec "$(DB_CONTAINER)" pg_isready -U "$(DB_USER)" -d "$(DB_NAME)" >/dev/null 2>&1; then \
	    echo "Postgres is ready at 127.0.0.1:$(DB_PORT) (db $(DB_NAME))"; \
	    exit 0; \
	  fi; \
	  i=$$((i + 1)); \
	  sleep 1; \
	done; \
	echo "Postgres did not become ready"; \
	exit 1

db-down: ## Stop local Postgres and delete its data
	-docker rm -f "$(DB_CONTAINER)"

db-logs: ## Follow local Postgres logs
	docker logs -f "$(DB_CONTAINER)"

db-psql: ## Open psql in the local pharmacy database
	docker exec -it "$(DB_CONTAINER)" psql -U "$(DB_USER)" -d "$(DB_NAME)"

## Quality

pharmacy-check: ## Typecheck, lint, format check, and test the pharmacy console
	npm run typecheck --prefix packages/apps/pharmacy
	npm run lint --prefix packages/apps/pharmacy
	npm run format:check --prefix packages/apps/pharmacy
	npm test --prefix packages/apps/pharmacy

pharmacy-format: ## Rewrite pharmacy sources with Prettier
	npm run format --prefix packages/apps/pharmacy

api-compile: ## Compile server-core
	cd packages/apps/server-core && mvn -B -DskipTests compile

api-test: ## Test server-core (Testcontainers needs Docker)
	cd packages/apps/server-core && mvn -B test

api-package: ## Package server-core (skip tests)
	cd packages/apps/server-core && mvn -B -DskipTests package

todo-compile: ## Compile todo-server
	cd packages/apps/todo-server && mvn -B -DskipTests compile

build: ## Build every frontend and package both Java apps
	npm run build --prefix packages/apps/pharmacy
	npm run build --prefix packages/apps/nammamedmate
	npm run build --prefix packages/apps/medmatepharmacy
	npm run build --prefix packages/apps/todo-react
	$(MAKE) api-package
	cd packages/apps/todo-server && mvn -B -DskipTests package

clean: ## Remove frontend dist output and Maven target directories
	rm -rf \
	  packages/apps/pharmacy/dist \
	  packages/apps/nammamedmate/dist \
	  packages/apps/nammamedmate/dist-server \
	  packages/apps/medmatepharmacy/dist \
	  packages/apps/medmatepharmacy/dist-server \
	  packages/apps/todo-react/dist \
	  packages/apps/todo-server/target \
	  packages/apps/server-core/server-core-kernel/target \
	  packages/apps/server-core/server-core-identity/target \
	  packages/apps/server-core/server-core-files/target \
	  packages/apps/server-core/server-core-pharmacy/target \
	  packages/apps/server-core/server-core-master/target \
	  packages/apps/server-core/server-core-app/target
