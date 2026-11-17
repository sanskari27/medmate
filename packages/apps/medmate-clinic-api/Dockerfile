FROM --platform=$BUILDPLATFORM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /src
COPY pom.xml .
COPY medmate-clinic-api-app/pom.xml medmate-clinic-api-app/pom.xml
COPY medmate-clinic-api-app/src medmate-clinic-api-app/src
RUN mvn -q -DskipTests package

FROM eclipse-temurin:21-jre
RUN apt-get update \
  && apt-get install -y --no-install-recommends curl \
  && rm -rf /var/lib/apt/lists/* \
  && useradd --system --uid 10001 --home /app app
WORKDIR /app
COPY --from=build /src/medmate-clinic-api-app/target/medmate-clinic-api.jar medmate-clinic-api.jar
USER app
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=70"
EXPOSE 8091
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD curl -fsS http://127.0.0.1:8091/actuator/health || exit 1
ENTRYPOINT ["java", "-jar", "/app/medmate-clinic-api.jar"]
