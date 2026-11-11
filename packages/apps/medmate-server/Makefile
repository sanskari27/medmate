# Local development uses Java 21 on the host. Docker builds the deployment image.

MVN := ./mvnw
JAVA21_HOME := $(shell \
  if /usr/libexec/java_home -v 21 >/dev/null 2>&1; then \
    /usr/libexec/java_home -v 21; \
  elif [ -x /opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home/bin/java ]; then \
    echo /opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home; \
  elif [ -x /usr/local/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home/bin/java ]; then \
    echo /usr/local/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home; \
  fi)

.PHONY: java21-check run test verify format format-check package docker-build docker-run

java21-check:
	@test -n "$(JAVA21_HOME)" || { echo "Java 21 is required. Install it with: brew install openjdk@21"; exit 1; }

run: java21-check ## Start the API on :8080 against local Postgres
	JAVA_HOME="$(JAVA21_HOME)" SPRING_PROFILES_ACTIVE=local $(MVN) -pl medmate-server-app -am spring-boot:run

test: java21-check ## Run unit tests
	JAVA_HOME="$(JAVA21_HOME)" $(MVN) -B test

verify: java21-check ## Check formatting, then run unit and integration tests
	JAVA_HOME="$(JAVA21_HOME)" $(MVN) -B verify

format: java21-check ## Rewrite Java sources with Palantir Java Format
	JAVA_HOME="$(JAVA21_HOME)" $(MVN) -B spotless:apply

format-check: java21-check ## Fail if Java sources are not formatted
	JAVA_HOME="$(JAVA21_HOME)" $(MVN) -B spotless:check

package: java21-check ## Build the runnable jar without tests
	JAVA_HOME="$(JAVA21_HOME)" $(MVN) -B -DskipTests package

docker-build: ## Build the deployment image
	docker build -t medmate-server:local .

docker-run: ## Run the deployment image on :8080
	docker run --rm -p 8080:8080 --name medmate-server medmate-server:local
