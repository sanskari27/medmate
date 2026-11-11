# Local development for the Medmate repo.
#
# Quick start:
#   make install     # Node dependencies
#   make dev         # local Postgres, medmate-server on :8080, pharmacy console on :3203
#
# Run from the repository root. Override defaults on the command line, for example:
#   make db-up DB_PORT=5433

DB_NAME ?= pharmacy
DB_USER ?= pharmacy
DB_PASSWORD ?= pharmacy
DB_PORT ?= 5432
DB_IMAGE ?= postgres:16-alpine
DB_CONTAINER ?= medmate-postgres

MEDMATE_DB_NAME ?= medmate_server
MEDMATE_DATASOURCE_URL ?= jdbc:postgresql://127.0.0.1:$(DB_PORT)/$(MEDMATE_DB_NAME)

JAVA21_HOME := $(shell \
  if /usr/libexec/java_home -v 21 >/dev/null 2>&1; then \
    /usr/libexec/java_home -v 21; \
  elif [ -x /opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home/bin/java ]; then \
    echo /opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home; \
  elif [ -x /usr/local/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home/bin/java ]; then \
    echo /usr/local/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home; \
  fi)

PG_BIN := $(shell \
  if [ -x /opt/homebrew/opt/postgresql@16/bin/psql ]; then \
    echo /opt/homebrew/opt/postgresql@16/bin; \
  elif [ -x /usr/local/opt/postgresql@16/bin/psql ]; then \
    echo /usr/local/opt/postgresql@16/bin; \
  fi)

SPRING_DATASOURCE_URL ?= jdbc:postgresql://127.0.0.1:$(DB_PORT)/$(DB_NAME)

NODE_APPS := pharmacy nammamedmate medmatepharmacy todo-react

.PHONY: help install doctor check dev db-up db-ready db-down db-logs db-psql db-local java21-check \
	api api-compile api-test api-verify api-format api-package sms-mock todo-api todo-compile \
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

doctor: ## Report whether Java 21, local Postgres, node, docker, and python are available
	@if [ -n "$(JAVA21_HOME)" ]; then "$(JAVA21_HOME)/bin/java" -version 2>&1 | head -n 1; else echo "java 21: missing (brew install openjdk@21)"; fi
	@command -v mvn >/dev/null && mvn -version 2>&1 | head -n 1 || echo "maven: wrapper is used for medmate-server (./mvnw)"
	@if [ -n "$(PG_BIN)" ]; then echo "postgres: $$("$(PG_BIN)/postgres" --version)"; else echo "postgres 16: missing (brew install postgresql@16)"; fi
	@command -v node >/dev/null && echo "node: $$(node -v)" || echo "node: missing (need 22)"
	@command -v npm >/dev/null && echo "npm: $$(npm -v)" || echo "npm: missing"
	@command -v docker >/dev/null && docker --version || echo "docker: missing (needed to build the deployment image and for todo Postgres)"
	@command -v python3 >/dev/null && python3 --version || echo "python3: missing"

check: ## Validate every packages/apps/*/project.yaml contract
	python3 scripts/validate_projects.py

## Run

dev: db-local java21-check ## local Postgres + medmate-server (:8080) + pharmacy console (:3203)
	@test -d packages/apps/pharmacy/node_modules || { echo "Run 'make install' first"; exit 1; }
	@echo "API  http://127.0.0.1:8080/actuator/health"
	@echo "App  http://127.0.0.1:3203  (/api is proxied to the API)"
	@echo "Ctrl-C stops both. Use 'make api' and 'make pharmacy' in two terminals for separate logs."
	@set -eu; \
	trap 'kill $$api $$web 2>/dev/null || true; wait $$api $$web 2>/dev/null || true' EXIT INT TERM; \
	( cd packages/apps/medmate-server && \
	  exec env \
	    JAVA_HOME="$(JAVA21_HOME)" \
	    SPRING_PROFILES_ACTIVE=local \
	    SPRING_DATASOURCE_URL="$(MEDMATE_DATASOURCE_URL)" \
	    SPRING_DATASOURCE_USERNAME="$(DB_USER)" \
	    SPRING_DATASOURCE_PASSWORD="$(DB_PASSWORD)" \
	    ./mvnw -pl medmate-server-app -am spring-boot:run ) & api=$$!; \
	( cd packages/apps/pharmacy && exec npm run dev ) & web=$$!; \
	wait $$api $$web

api: db-local java21-check ## Run medmate-server on :8080 with local Java and Postgres
	cd packages/apps/medmate-server && \
	  JAVA_HOME="$(JAVA21_HOME)" \
	  SPRING_PROFILES_ACTIVE=local \
	  SPRING_DATASOURCE_URL="$(MEDMATE_DATASOURCE_URL)" \
	  SPRING_DATASOURCE_USERNAME="$(DB_USER)" \
	  SPRING_DATASOURCE_PASSWORD="$(DB_PASSWORD)" \
	  ./mvnw -pl medmate-server-app -am spring-boot:run

sms-mock: java21-check ## Record OTP deliveries on http://127.0.0.1:8090
	cd packages/apps/medmate-server && \
	  JAVA_HOME="$(JAVA21_HOME)" ./mvnw -pl medmate-server-identity -am -DskipTests compile && \
	  JAVA_HOME="$(JAVA21_HOME)" "$(JAVA21_HOME)/bin/java" -cp medmate-server-identity/target/classes com.medmate.server.identity.sms.SmsMock

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

java21-check: ## Fail when Java 21 is not installed
	@test -n "$(JAVA21_HOME)" || { echo "Java 21 is required. Install it with: brew install openjdk@21"; exit 1; }

db-local: ## Start Homebrew Postgres 16 and ensure the medmate_server database exists
	@test -n "$(PG_BIN)" || { echo "PostgreSQL 16 is required. Install it with: brew install postgresql@16"; exit 1; }
	@if ! "$(PG_BIN)/pg_isready" -h 127.0.0.1 -p "$(DB_PORT)" -q; then \
	  brew services start postgresql@16; \
	  i=0; \
	  while [ $$i -lt 30 ]; do \
	    "$(PG_BIN)/pg_isready" -h 127.0.0.1 -p "$(DB_PORT)" -q && break; \
	    i=$$((i + 1)); \
	    sleep 1; \
	  done; \
	fi
	@"$(PG_BIN)/pg_isready" -h 127.0.0.1 -p "$(DB_PORT)" -q || { echo "Postgres 16 did not become ready on 127.0.0.1:$(DB_PORT)"; exit 1; }
	@version=$$("$(PG_BIN)/psql" -h 127.0.0.1 -p "$(DB_PORT)" -d postgres -tAc "SHOW server_version"); \
	  case "$$version" in \
	    16.*) ;; \
	    *) echo "127.0.0.1:$(DB_PORT) is Postgres $$version, not 16. Stop the other server and rerun."; exit 1 ;; \
	  esac
	@"$(PG_BIN)/psql" -h 127.0.0.1 -p "$(DB_PORT)" -d postgres -tc "SELECT 1 FROM pg_roles WHERE rolname = '$(DB_USER)'" | grep -q 1 \
	  || "$(PG_BIN)/psql" -h 127.0.0.1 -p "$(DB_PORT)" -d postgres -c "CREATE ROLE $(DB_USER) LOGIN PASSWORD '$(DB_PASSWORD)'"
	@"$(PG_BIN)/psql" -h 127.0.0.1 -p "$(DB_PORT)" -d postgres -c "ALTER ROLE $(DB_USER) WITH LOGIN PASSWORD '$(DB_PASSWORD)'"
	@"$(PG_BIN)/psql" -h 127.0.0.1 -p "$(DB_PORT)" -d postgres -tc "SELECT 1 FROM pg_database WHERE datname = '$(MEDMATE_DB_NAME)'" | grep -q 1 \
	  || "$(PG_BIN)/psql" -h 127.0.0.1 -p "$(DB_PORT)" -d postgres -c "CREATE DATABASE $(MEDMATE_DB_NAME) OWNER $(DB_USER)"
	@echo "Postgres 16 is ready at 127.0.0.1:$(DB_PORT) (db $(MEDMATE_DB_NAME))"

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

api-compile: java21-check ## Compile medmate-server
	cd packages/apps/medmate-server && JAVA_HOME="$(JAVA21_HOME)" ./mvnw -B -DskipTests compile

api-test: java21-check ## Unit-test medmate-server
	cd packages/apps/medmate-server && JAVA_HOME="$(JAVA21_HOME)" ./mvnw -B test

api-verify: java21-check ## Format-check, unit-test, and integration-test medmate-server
	cd packages/apps/medmate-server && JAVA_HOME="$(JAVA21_HOME)" ./mvnw -B verify

api-format: java21-check ## Format medmate-server sources
	cd packages/apps/medmate-server && JAVA_HOME="$(JAVA21_HOME)" ./mvnw -B spotless:apply

api-package: java21-check ## Package medmate-server (skip tests)
	cd packages/apps/medmate-server && JAVA_HOME="$(JAVA21_HOME)" ./mvnw -B -DskipTests package

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
	  packages/apps/medmate-server/medmate-server-shared/target \
	  packages/apps/medmate-server/medmate-server-identity/target \
	  packages/apps/medmate-server/medmate-server-app/target
