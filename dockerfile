# Usa una imagen oficial de Node.js como base
FROM node:20

# Establece el directorio de trabajo en el contenedor
WORKDIR /usr/app

#Copy the source code to the container
COPY src ./

# Copia los archivos de package.json y package-lock.json al directorio de trabajo
COPY package*.json ./

# Instala las dependencias de la aplicación
RUN npm install

# Exponer el puerto en el que la aplicación correrá
EXPOSE 3001

# Comando para ejecutar la aplicación
CMD ["node", "index.js"]
