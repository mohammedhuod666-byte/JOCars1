FROM node:20-bullseye-slim
WORKDIR /app
# Build-time only: prisma generate needs *some* URL to validate the schema,
# but the real secret must come from runtime env (fly secrets / host env),
# never baked into the image layer.
ARG DATABASE_URL="postgresql://build:build@localhost:5432/build"
ENV DATABASE_URL=$DATABASE_URL
COPY package.json package-lock.json ./
COPY prisma ./prisma/
RUN npm ci --ignore-scripts --legacy-peer-deps
RUN npx prisma generate
ENV DATABASE_URL=""
COPY . .
RUN rm -rf tsconfig.tsbuildinfo .next
RUN echo "Bugatti build $(date)" > .buildstamp
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build
EXPOSE 8080
CMD ["node", "server.js"]
