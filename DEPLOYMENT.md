# 部署指南

本文档介绍如何将商城系统部署到阿里云 ECS 服务器。

## 目录

- [前置要求](#前置要求)
- [方式一：Docker 部署（推荐）](#方式一docker-部署推荐)
- [方式二：手动部署](#方式二手动部署)
- [配置 SSL 证书](#配置-ssl-证书)
- [常见问题](#常见问题)

---

## 前置要求

### 服务器配置

| 配置项 | 最低要求 | 推荐配置 |
|--------|----------|----------|
| CPU | 1核 | 2核+ |
| 内存 | 2GB | 4GB+ |
| 硬盘 | 40GB | 100GB SSD |
| 带宽 | 1Mbps | 5Mbps+ |
| 系统 | CentOS 7+ / Ubuntu 18+ | CentOS 8 |

### 外部服务

- **Supabase** - 数据库和认证服务（或自建 PostgreSQL）
- **阿里云 OSS** - 图片存储（可选）
- **域名** - 已备案域名（可选，用于 HTTPS）

---

## 方式一：Docker 部署（推荐）

### 1. 上传代码到服务器

```bash
# 方式 A: Git 克隆
ssh root@your-server-ip
cd /var/www
git clone https://github.com/lovefe2023/shangcheng.git wine-mall
cd wine-mall

# 方式 B: SCP 上传
scp -r ./dist ./server ./package*.json ./Dockerfile ./docker-compose.yml root@your-server-ip:/var/www/wine-mall/
```

### 2. 配置环境变量

```bash
cd /var/www/wine-mall
cp .env.example .env
vim .env
```

修改以下关键配置：

```env
NODE_ENV=production
PORT=5000
JWT_SECRET=你的强密钥至少32位随机字符

# Supabase 配置
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# 数据库
DATABASE_URL=postgresql://...
```

### 3. 运行部署脚本

```bash
chmod +x deploy.sh
./deploy.sh
```

### 4. 验证部署

```bash
# 检查容器状态
docker-compose ps

# 检查日志
docker-compose logs -f

# 测试 API
curl http://localhost/api/health
```

---

## 方式二：手动部署

### 1. 安装 Node.js

```bash
# CentOS
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs

# Ubuntu
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### 2. 安装 PM2 和 Nginx

```bash
sudo npm install -g pm2
sudo yum install -y nginx  # CentOS
# sudo apt install -y nginx  # Ubuntu
```

### 3. 上传代码

```bash
mkdir -p /var/www/wine-mall
cd /var/www/wine-mall

# 上传以下文件/目录：
# - dist/ (前端打包文件)
# - server/ (后端源码)
# - package.json, package-lock.json
# - .env
```

### 4. 安装依赖

```bash
npm ci --only=production --legacy-peer-deps
```

### 5. 启动后端

```bash
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup | tail -1 | sudo bash
```

### 6. 配置 Nginx

```bash
sudo cp nginx.conf /etc/nginx/nginx.conf
sudo nginx -t
sudo systemctl reload nginx
```

### 7. 配置防火墙

```bash
# CentOS
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --reload

# Ubuntu
sudo ufw allow 80
sudo ufw allow 443
```

---

## 配置 SSL 证书

### 使用 Let's Encrypt 免费证书

```bash
# 安装 Certbot
sudo yum install -y certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# 自动续期
sudo systemctl enable certbot-renew.timer
```

### 使用阿里云 SSL 证书

1. 在阿里云控制台下载 Nginx 格式证书
2. 上传到服务器：

```bash
sudo mkdir -p /etc/nginx/ssl
sudo upload your-cert.pem /etc/nginx/ssl/
sudo upload your-key.pem /etc/nginx/ssl/
```

3. 修改 Nginx 配置启用 HTTPS（参考 nginx.conf 中的注释部分）

---

## 常用命令

### Docker 部署

```bash
# 查看日志
docker-compose logs -f app

# 重启服务
docker-compose restart

# 更新部署
git pull
docker-compose up -d --build

# 停止服务
docker-compose down
```

### 手动部署

```bash
# 查看日志
pm2 logs wine-mall-api

# 重启服务
pm2 restart wine-mall-api

# 监控面板
pm2 monit

# 更新部署
git pull
npm ci --only=production
pm2 restart wine-mall-api
```

---

## 常见问题

### 1. 端口被占用

```bash
# 查看端口占用
netstat -tlnp | grep :5000

# 杀死进程
kill -9 <PID>
```

### 2. Nginx 502 Bad Gateway

检查后端是否运行：
```bash
pm2 status
curl http://localhost:5000/api/health
```

### 3. 数据库连接失败

1. 检查 `.env` 中的数据库配置
2. 确保 Supabase 项目正常运行
3. 检查安全组是否放行数据库端口

### 4. 内存不足

```bash
# 创建交换分区
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## 性能优化建议

1. **开启 Nginx Gzip 压缩** - 已在配置中启用
2. **配置 CDN** - 使用阿里云 CDN 加速静态资源
3. **数据库连接池** - 使用 Supabase 连接池
4. **图片优化** - 使用 WebP 格式，配置 OSS
5. **监控告警** - 配置 PM2 Plus 或阿里云监控

---

## 联系支持

如有问题，请提交 Issue: https://github.com/lovefe2023/shangcheng/issues