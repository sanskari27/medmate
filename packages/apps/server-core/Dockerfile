FROM --platform=$BUILDPLATFORM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /src
COPY pom.xml .
COPY server-core-kernel/pom.xml server-core-kernel/pom.xml
COPY server-core-identity/pom.xml server-core-identity/pom.xml
COPY server-core-files/pom.xml server-core-files/pom.xml
COPY server-core-pharmacy/pom.xml server-core-pharmacy/pom.xml
COPY server-core-master/pom.xml server-core-master/pom.xml
COPY server-core-app/pom.xml server-core-app/pom.xml
COPY server-core-kernel/src server-core-kernel/src
COPY server-core-identity/src server-core-identity/src
COPY server-core-files/src server-core-files/src
COPY server-core-pharmacy/src server-core-pharmacy/src
COPY server-core-master/src server-core-master/src
COPY server-core-app/src server-core-app/src
RUN mvn -q -DskipTests package

FROM eclipse-temurin:21-jre
RUN apt-get update \
  && apt-get install -y --no-install-recommends curl \
  && rm -rf /var/lib/apt/lists/* \
  && useradd --system --uid 10001 --home /app app
WORKDIR /app
COPY --from=build /src/server-core-app/target/server-core.jar server-core.jar
USER app
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=70"
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/server-core.jar"]
