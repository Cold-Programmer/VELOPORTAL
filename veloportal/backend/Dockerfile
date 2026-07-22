FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

EXPOSE 5000

# Waits for Postgres, seeds if empty, then starts the API.
# In production, replace with a proper migration step instead of sync({force:true}).
CMD ["sh", "-c", "node server.js"]
