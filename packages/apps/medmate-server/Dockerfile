FROM --platform=$BUILDPLATFORM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /src
COPY pom.xml .
COPY medmate-server-shared/pom.xml medmate-server-shared/pom.xml
COPY medmate-server-identity/pom.xml medmate-server-identity/pom.xml
COPY medmate-server-support/pom.xml medmate-server-support/pom.xml
COPY medmate-server-app/pom.xml medmate-server-app/pom.xml
COPY medmate-server-shared/src medmate-server-shared/src
COPY medmate-server-identity/src medmate-server-identity/src
COPY medmate-server-support/src medmate-server-support/src
COPY medmate-server-app/src medmate-server-app/src
RUN mvn -q -DskipTests package

FROM eclipse-temurin:21-jre
RUN apt-get update \
  && apt-get install -y --no-install-recommends curl \
  && rm -rf /var/lib/apt/lists/* \
  && useradd --system --uid 10001 --home /app app
WORKDIR /app
COPY --from=build /src/medmate-server-app/target/medmate-server.jar medmate-server.jar
USER app
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=70"
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD curl -fsS http://127.0.0.1:8080/actuator/health || exit 1
ENTRYPOINT ["java", "-jar", "/app/medmate-server.jar"]
