FROM node:20-alpine
WORKDIR /app
COPY app/package*.json ./
# Mengganti --only=production menjadi --omit=dev sesuai standar Node 20
RUN npm install --omit=dev
COPY app/ .
EXPOSE 3000
CMD ["npm", "start"]