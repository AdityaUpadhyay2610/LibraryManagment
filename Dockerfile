# Stage 1: Build the React frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
ENV BUILD_TO_SPRING=true
RUN npm run build

# Stage 2: Build the Spring Boot backend
FROM eclipse-temurin:17-jdk-alpine AS backend-builder
WORKDIR /app
# Install bash for the maven wrapper script
RUN apk add --no-cache bash
COPY .mvn/ .mvn
COPY mvnw pom.xml ./
# Prefetch dependencies to speed up subsequent builds
RUN ./mvnw dependency:go-offline -B
# Copy backend source code
COPY src ./src
# Copy compiled frontend assets from Stage 1 into Spring Boot's static resources
COPY --from=frontend-builder /app/src/main/resources/static ./src/main/resources/static
# Build the production executable JAR file
RUN ./mvnw clean package -DskipTests -B

# Stage 3: Run the application
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=backend-builder /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
