FROM node:20-slim

# Instalamos pnpm manualmente para que no dependa de Corepack
RUN npm install -g pnpm

WORKDIR /app

# Copiamos los archivos de dependencias
COPY package.json pnpm-lock.yaml* ./

# Instalamos dependencias (sin el check de frozen por si acaso)
RUN pnpm install --prod

# Copiamos el resto del código
COPY . .

# Variables de entorno
ENV PORT=8080
ENV NODE_ENV=production

EXPOSE 8080

# Comando de arranque
CMD ["node", "index.js"]