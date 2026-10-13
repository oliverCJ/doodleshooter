# 涂鸦街区 (Doodle District) - 局域网联机 Node 服务镜像
FROM node:22-alpine

WORKDIR /app

# 先安装依赖，便于 Docker 层缓存。
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# 复制游戏静态资源和本地 PeerJS 信令服务代码。
COPY . .

EXPOSE 8910

# 与本机推荐启动方式保持一致，提供静态资源、/lan-health 和 /peerjs。
CMD ["npm", "run", "serve"]
