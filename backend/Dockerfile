# syntax=docker/dockerfile:1

FROM golang:1.26-alpine AS builder
WORKDIR /src

# Cached separately from the source so `go mod download` only reruns when
# go.mod actually changes (there's no go.sum yet — this module has zero
# external dependencies).
COPY go.mod ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/api ./cmd/api

FROM alpine:3.20
RUN addgroup -S app && adduser -S app -G app
COPY --from=builder /out/api /usr/local/bin/api
USER app

EXPOSE 8080
HEALTHCHECK --interval=10s --timeout=3s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:8080/health || exit 1

ENTRYPOINT ["/usr/local/bin/api"]
