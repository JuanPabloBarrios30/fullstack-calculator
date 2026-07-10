# syntax=docker/dockerfile:1

FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Vite inlines VITE_* variables into the bundle at build time, so the backend
# origin has to be known here rather than configured at container runtime.
ARG VITE_API_BASE_URL=http://localhost:8080
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

# A plain `apk add nginx` on Alpine only pulls nginx + pcre — the prebuilt
# nginx-unprivileged image bundles optional modules (image_filter, xslt,
# geoip, ...) statically, dragging in libpng/libxml2/freetype/openssl and
# the CVEs that come with them, none of which this static file server uses.
# The nginx package already creates an unprivileged "nginx" system user
# with the right ownership on its runtime directories, so we reuse it
# rather than adding our own.
FROM alpine:3.21
RUN apk add --no-cache nginx

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/http.d/default.conf

USER nginx
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:8080/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
