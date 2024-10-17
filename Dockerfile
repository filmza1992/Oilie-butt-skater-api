# ใช้ Node.js image จาก official Docker Hub
FROM node:20.10.0

# ตั้งค่า timezone เป็น Asia/Bangkok
RUN apt-get update && \
    apt-get install -y tzdata && \
    ln -sf /usr/share/zoneinfo/Asia/Bangkok /etc/localtime && \
    echo "Asia/Bangkok" > /etc/timezone && \
    dpkg-reconfigure -f noninteractive tzdata

# กำหนด directory ใน container ที่จะเก็บ source code ของคุณ
WORKDIR /app

# Copy package.json และ package-lock.json เข้าไปใน container
COPY package*.json ./

# ติดตั้ง dependencies
RUN npm install --build-from-source bcrypt

# Copy source code ทั้งหมดเข้าไปใน container
COPY . .

# คำสั่งที่จะรัน server เมื่อ container ถูกเริ่มต้น
CMD ["node", "server.js"]

