FROM caddy:alpine

COPY dist/ /dist
COPY Caddyfile /etc/caddy/Caddyfile