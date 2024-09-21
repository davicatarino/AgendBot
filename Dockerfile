# Use uma imagem base oficial do Node.js
FROM node:20-alpine

# Defina o diretório de trabalho dentro do contêiner
WORKDIR /app

# Copie o package.json e o package-lock.json para o contêiner
COPY package*.json ./

# Instale as dependências da aplicação
RUN npm install --production

# Copie o restante do código da aplicação para o contêiner
COPY . .

# Instale o PM2 globalmente
RUN npm install pm2 -g

# Exponha a porta que a aplicação usa
EXPOSE 57420

# Comando para iniciar a aplicação usando PM2
CMD ["pm2-runtime", "index.js"]
