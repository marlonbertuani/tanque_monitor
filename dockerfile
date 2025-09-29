# Etapa 1: build da aplicação
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .

# Gera a versão de produção (output vai para /app/dist)
RUN npm run build

# Etapa 2: imagem final com NGINX
FROM nginx:alpine

# Copia os arquivos do build (dist) para o diretório que o NGINX serve
COPY --from=build /app/dist /usr/share/nginx/html

# Substitui config padrão do NGINX (opcional)
COPY nginx.conf /etc/nginx/nginx.conf
COPY default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]