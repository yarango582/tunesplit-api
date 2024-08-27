# Usa una imagen de Python como base
FROM python:3.8

# Instala Node.js
RUN curl -sL https://deb.nodesource.com/setup_20.x | bash -
RUN apt-get update && apt-get install -y nodejs

# Instala ffmpeg y otras dependencias
RUN apt-get update && apt-get install -y ffmpeg libsndfile1

# Instala Spleeter y sus dependencias
RUN pip install spleeter==2.3.0 tensorflow==2.5.0

# Pre-descarga el modelo de Spleeter
RUN mkdir -p /root/.cache/spleeter
RUN spleeter separate -p spleeter:5stems -o /tmp /dev/null

# Crea directorios necesarios y ajusta permisos
RUN mkdir -p /usr/app/separated /usr/app/uploads
RUN chmod 777 /usr/app/separated /usr/app/uploads

# Establece el directorio de trabajo en el contenedor
WORKDIR /usr/app

# Copia los archivos necesarios
COPY src ./src
COPY package*.json ./

# Instala las dependencias de Node.js
RUN npm install

# Crea el archivo de configuración para Spleeter
RUN echo '{ \
  "cpu_separation": true, \
  "cpu_threads": 4 \
}' > /usr/app/config.json

# Exponer el puerto en el que la aplicación correrá
EXPOSE 3001

# Comando para ejecutar la aplicación
CMD ["node", "src/index.js"]