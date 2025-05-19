# Imagen base
FROM node:20

# Directorio de trabajo
WORKDIR /app

# Copiar archivos necesarios
COPY package*.json ./
RUN npm install

# Copiar el resto del código
COPY . .

# Exponer el puerto
EXPOSE 3004

# Comando para ejecutar la app
CMD ["node", "index.js"]
