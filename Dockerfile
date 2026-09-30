# Multi-stage Dockerfile for Spring Boot Weather App

# Stage 1: Build the Application
FROM maven:3.9.8-eclipse-temurin-21 AS builder
WORKDIR /app

# Cache dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and build production artifact
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Lightweight Production Runtime
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Create non-root system user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Create persistent directory for file-based H2 database
RUN mkdir -p /app/data && chown -R appuser:appgroup /app

# Copy packaged JAR from builder stage
COPY --from=builder /app/target/weather-app-1.0.0.jar app.jar
RUN chown appuser:appgroup app.jar

USER appuser

# Expose default HTTP port
EXPOSE 8080

# Environment variables
ENV PORT=8080
ENV JAVA_OPTS="-Xms256m -Xmx512m -XX:+UseG1GC"

# Production container healthcheck using Spring Boot Actuator
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:${PORT}/actuator/health || exit 1

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
