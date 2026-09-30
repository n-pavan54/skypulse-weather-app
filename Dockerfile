# ============================================================
# Stage 1: Build the Spring Boot application
# ============================================================
FROM maven:3.9.8-eclipse-temurin-21 AS builder
WORKDIR /app

# Copy Maven POM and Wrapper
COPY pom.xml .
COPY .mvn .mvn
COPY mvnw .

# Download dependencies (cached layer)
RUN mvn dependency:go-offline -B

# Copy application source
COPY src ./src

# Build production executable JAR
RUN mvn clean package -DskipTests -B

# ============================================================
# Stage 2: Lightweight Production Runtime
# ============================================================
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Create non-root system user for container security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Create persistent storage directory for file-based database
RUN mkdir -p /app/data && chown -R appuser:appgroup /app

# Copy the exact generated JAR from builder stage
COPY --from=builder /app/target/app.jar app.jar
RUN chown appuser:appgroup app.jar

USER appuser

# Expose default HTTP port
EXPOSE 8080

# Environment variables
ENV PORT=8080
ENV JAVA_OPTS="-Xms256m -Xmx512m -XX:+UseG1GC"

# Production container healthcheck using Spring Boot Actuator
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:${PORT}/actuator/health || exit 1

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -Dserver.port=${PORT} -jar app.jar"]
