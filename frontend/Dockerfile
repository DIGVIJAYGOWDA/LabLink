# LabLink web - build the static site, serve it with nginx on port 8080 (Cloud Run default)
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
COPY docker/40-runtime-config.sh /docker-entrypoint.d/40-runtime-config.sh
# Strip Windows line endings in case the script was checked out with CRLF
RUN sed -i 's/\r$//' /docker-entrypoint.d/40-runtime-config.sh && chmod +x /docker-entrypoint.d/40-runtime-config.sh
EXPOSE 8080
