# ==============================================================================
# Stage 1: Build the Spring Boot application using Maven & Java 21
# ==============================================================================
FROM maven:3.9.9-eclipse-temurin-21-jammy AS builder

WORKDIR /build

# Copy Maven pom.xml first to take advantage of Docker layer caching
COPY pom.xml .

# Download dependencies offline (cached across builds unless pom.xml changes)
RUN mvn dependency:go-offline -B || true

# Copy application source code
COPY src ./src

# Package the production artifact (skip tests for faster image builds)
RUN mvn clean package -DskipTests && \
    mv /build/target/*.jar /build/app.jar

# ==============================================================================
# Stage 2: Production runtime image using lightweight Eclipse Temurin JRE 21
# ==============================================================================
FROM eclipse-temurin:21-jre-jammy

WORKDIR /app

# Install curl (for container health checks) and font libraries (for OpenPDF generation)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        curl \
        fontconfig \
        fonts-dejavu-core && \
    rm -rf /var/lib/apt/lists/*

# Create dedicated non-root user and group for security compliance
RUN groupadd -r -g 1001 spring && \
    useradd -r -u 1001 -g spring spring

# Copy the built jar from the builder stage
COPY --from=builder --chown=spring:spring /build/app.jar /app/app.jar

# Run the container as the non-root spring user
USER 1001:1001

# Default environment configuration
ENV SERVER_PORT=8080 \
    JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -Djava.security.egd=file:/dev/./urandom"

# Expose backend application port
EXPOSE 8080

# Health check to ensure Spring Boot is up and responding
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:${PORT:-${SERVER_PORT:-8080}}/v3/api-docs || exit 1

# Launch the application
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar /app/app.jar"]
