# Use a more lightweight Python image as base
FROM python:3.8-slim

# Install Node.js
RUN apt-get update && apt-get install -y curl && \
    curl -sL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install ffmpeg and other dependencies
RUN apt-get update && \
    apt-get install -y ffmpeg libsndfile1 && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install Spleeter and its dependencies
RUN pip install --no-cache-dir spleeter==2.3.0 tensorflow==2.5.0

# Pre-download the Spleeter model
RUN mkdir -p /root/.cache/spleeter && \
    spleeter separate -p spleeter:5stems -o /tmp /dev/null && \
    rm -rf /tmp/*

# Create necessary directories and adjust permissions
RUN mkdir -p /usr/app/separated /usr/app/uploads && \
    chmod 777 /usr/app/separated /usr/app/uploads

# Set the working directory in the container
WORKDIR /usr/app

# Copy only necessary files
COPY src ./src
COPY package*.json ./

# Install Node.js dependencies
RUN npm ci --only=production

# Create the configuration file for Spleeter
RUN echo '{ \
  "cpu_separation": true, \
  "cpu_threads": 4 \
}' > /usr/app/config.json

# Set environment variables
ENV NODE_OPTIONS="--max-old-space-size=4096"
ENV SPLEETER_CONFIG="/usr/app/config.json"
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Expose the port on which the application will run
EXPOSE 3001

# Command to run the application
CMD ["node", "--max-old-space-size=4096", "src/index.js"]