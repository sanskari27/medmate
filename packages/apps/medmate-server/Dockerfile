FROM --platform=$BUILDPLATFORM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /src
COPY pom.xml .
COPY medmate-server-shared/pom.xml medmate-server-shared/pom.xml
COPY medmate-server-identity/pom.xml medmate-server-identity/pom.xml
COPY medmate-server-support/pom.xml medmate-server-support/pom.xml
COPY medmate-server-employees/pom.xml medmate-server-employees/pom.xml
COPY medmate-server-distributors/pom.xml medmate-server-distributors/pom.xml
COPY medmate-server-stock/pom.xml medmate-server-stock/pom.xml
COPY medmate-server-offers/pom.xml medmate-server-offers/pom.xml
COPY medmate-server-billing/pom.xml medmate-server-billing/pom.xml
COPY medmate-server-crm/pom.xml medmate-server-crm/pom.xml
COPY medmate-server-expenses/pom.xml medmate-server-expenses/pom.xml
COPY medmate-server-reports/pom.xml medmate-server-reports/pom.xml
COPY medmate-server-dashboard/pom.xml medmate-server-dashboard/pom.xml
COPY medmate-server-leads/pom.xml medmate-server-leads/pom.xml
COPY medmate-server-departments/pom.xml medmate-server-departments/pom.xml
COPY medmate-server-wards/pom.xml medmate-server-wards/pom.xml
COPY medmate-server-doctors/pom.xml medmate-server-doctors/pom.xml
COPY medmate-server-oversight/pom.xml medmate-server-oversight/pom.xml
COPY medmate-server-app/pom.xml medmate-server-app/pom.xml
COPY medmate-server-shared/src medmate-server-shared/src
COPY medmate-server-identity/src medmate-server-identity/src
COPY medmate-server-support/src medmate-server-support/src
COPY medmate-server-employees/src medmate-server-employees/src
COPY medmate-server-distributors/src medmate-server-distributors/src
COPY medmate-server-stock/src medmate-server-stock/src
COPY medmate-server-offers/src medmate-server-offers/src
COPY medmate-server-billing/src medmate-server-billing/src
COPY medmate-server-crm/src medmate-server-crm/src
COPY medmate-server-expenses/src medmate-server-expenses/src
COPY medmate-server-reports/src medmate-server-reports/src
COPY medmate-server-dashboard/src medmate-server-dashboard/src
COPY medmate-server-leads/src medmate-server-leads/src
COPY medmate-server-departments/src medmate-server-departments/src
COPY medmate-server-wards/src medmate-server-wards/src
COPY medmate-server-doctors/src medmate-server-doctors/src
COPY medmate-server-oversight/src medmate-server-oversight/src
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
