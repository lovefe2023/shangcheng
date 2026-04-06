# ===========================================
# 多阶段构建 - 前端
# ===========================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# 复制前端依赖文件
COPY package*.json ./
COPY vite.config.ts ./
COPY tsconfig.json ./
COPY index.html ./
COPY src ./src
COPY public ./public 2>/dev/null || true

# 安装依赖并构建
RUN npm ci --legacy-peer-deps
RUN npm run build

# ===========================================
# 多阶段构建 - 后端
# ===========================================
FROM node:20-alpine AS backend-builder

WORKDIR /app

# 复制后端依赖文件
COPY package*.json ./
COPY server ./server
COPY supabase ./supabase

# 安装依赖
RUN npm ci --legacy-peer-deps

# ===========================================
# 生产镜像
# ===========================================
FROM node:20-alpine AS production

WORKDIR /app

# 安装 PM2
RUN npm install -g pm2

# 复制依赖清单
COPY package*.json ./

# 只安装生产依赖
RUN npm ci --only=production --legacy-peer-deps

# 复制后端代码
COPY server ./server
COPY supabase ./supabase

# 从前端构建阶段复制静态文件
COPY --from=frontend-builder /app/dist ./dist

# 复制环境变量模板
COPY .env.example ./.env.example

# 创建日志目录
RUN mkdir -p /app/logs

# 暴露端口
EXPOSE 5000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

# 启动命令
CMD ["pm2-runtime", "server/index.ts", "--name", "wine-mall-api"]