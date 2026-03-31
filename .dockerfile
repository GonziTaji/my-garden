# # Stage 1: Build the Go backend binary
# FROM golang:alpine AS go-builder
# WORKDIR /app
# COPY go.mod go.sum ./
# RUN go mod download
# COPY . .
# RUN CGO_ENABLED=0 go build -o /app/myapp /app/backend/main.go # Adjust path to your main.go
#
# # Stage 2: Build the frontend static files
# FROM node:lts-alpine AS frontend-builder
# WORKDIR /app/frontend
# COPY frontend/package*.json ./
# RUN npm install
# COPY frontend/ .
# RUN npm run build # Creates a 'dist' folder (or similar)
#
# # Stage 3: Combine into a minimal final image
# FROM alpine:latest
# WORKDIR /app
# # Copy backend binary from go-builder stage
# COPY --from=go-builder /app/myapp /app/myapp
# # Copy frontend static files from frontend-builder stage to a 'public' directory
# COPY --from=frontend-builder /app/frontend/dist /app/public
#
# EXPOSE 8080 # Or your desired port
# CMD ["/app/myapp"]
