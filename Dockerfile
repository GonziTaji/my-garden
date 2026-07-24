FROM node:24-alpine AS frontend
ENV CI=true
WORKDIR /app
COPY frontend/package.json frontend/pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY frontend/ .
RUN pnpm build

FROM golang:1.25-alpine AS backend
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
COPY --from=frontend /app/dist ./frontend/dist
RUN CGO_ENABLED=0 go build -o my-garden .

FROM alpine:3.20
RUN apk add --no-cache sqlite
WORKDIR /app
COPY --from=backend /app/my-garden .
COPY --from=backend /app/frontend/dist ./frontend/dist
COPY --from=backend /app/public ./public
COPY --from=backend /app/internal/database ./internal/database
COPY docker-entrypoint.sh .
RUN chmod +x docker-entrypoint.sh
EXPOSE 8080
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["./my-garden"]
