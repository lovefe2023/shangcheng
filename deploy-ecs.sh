#!/bin/bash

# ===========================================
# 阿里云 ECS 手动部署脚本（不使用 Docker）
# ===========================================

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# ===========================================
# 配置变量
# ===========================================
APP_DIR="/var/www/wine-mall"
NODE_VERSION="20"

# ===========================================
# 安装 Node.js
# ===========================================
install_nodejs() {
    if command -v node &> /dev/null; then
        log_info "Node.js 已安装: $(node -v)"
        return
    fi

    log_info "安装 Node.js $NODE_VERSION..."

    curl -fsSL https://rpm.nodesource.com/setup_$NODE_VERSION.x | sudo bash -
    sudo yum install -y nodejs

    log_info "Node.js 安装完成: $(node -v)"
}

# ===========================================
# 安装 PM2
# ===========================================
install_pm2() {
    if command -v pm2 &> /dev/null; then
        log_info "PM2 已安装"
        return
    fi

    log_info "安装 PM2..."
    sudo npm install -g pm2

    log_info "PM2 安装完成"
}

# ===========================================
# 安装 Nginx
# ===========================================
install_nginx() {
    if command -v nginx &> /dev/null; then
        log_info "Nginx 已安装"
        return
    fi

    log_info "安装 Nginx..."
    sudo yum install -y nginx

    # 启动并设置开机自启
    sudo systemctl start nginx
    sudo systemctl enable nginx

    log_info "Nginx 安装完成"
}

# ===========================================
# 创建应用目录
# ===========================================
create_app_directory() {
    log_info "创建应用目录: $APP_DIR"

    sudo mkdir -p $APP_DIR
    sudo mkdir -p $APP_DIR/logs
    sudo mkdir -p $APP_DIR/uploads
    sudo chown -R $USER:$USER $APP_DIR
}

# ===========================================
# 安装应用依赖
# ===========================================
install_dependencies() {
    log_info "安装应用依赖..."

    cd $APP_DIR

    # 安装生产依赖
    npm ci --only=production --legacy-peer-deps

    log_info "依赖安装完成"
}

# ===========================================
# 配置 PM2
# ===========================================
configure_pm2() {
    log_info "配置 PM2..."

    cd $APP_DIR

    # 停止旧进程
    pm2 delete wine-mall 2>/dev/null || true

    # 启动应用
    pm2 start server/index.ts --name wine-mall \
        --interpreter tsx \
        --instances max \
        --exec-mode cluster \
        --env production

    # 保存 PM2 配置
    pm2 save

    # 设置开机自启
    pm2 startup | tail -1 | sudo bash || true

    log_info "PM2 配置完成"
}

# ===========================================
# 配置 Nginx
# ===========================================
configure_nginx() {
    log_info "配置 Nginx..."

    # 创建 Nginx 配置
    sudo tee /etc/nginx/conf.d/wine-mall.conf <<'EOF'
upstream wine_mall_backend {
    server 127.0.0.1:5000;
    keepalive 64;
}

server {
    listen 80;
    server_name _;
    root /var/www/wine-mall/dist;
    index index.html;

    # Gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
    gzip_min_length 1000;

    # 静态文件缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API 代理
    location /api {
        proxy_pass http://wine_mall_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }

    # 上传文件
    location /uploads {
        proxy_pass http://wine_mall_backend;
    }

    # 前端路由
    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF

    # 删除默认配置
    sudo rm -f /etc/nginx/nginx.conf.default 2>/dev/null || true

    # 测试配置
    sudo nginx -t

    # 重载配置
    sudo systemctl reload nginx

    log_info "Nginx 配置完成"
}

# ===========================================
# 配置防火墙
# ===========================================
configure_firewall() {
    log_info "配置防火墙..."

    if command -v firewall-cmd &> /dev/null; then
        sudo firewall-cmd --permanent --add-port=80/tcp
        sudo firewall-cmd --permanent --add-port=443/tcp
        sudo firewall-cmd --reload
        log_info "防火墙配置完成"
    else
        log_warn "未检测到 firewalld，请手动配置安全组"
    fi
}

# ===========================================
# 显示部署信息
# ===========================================
show_info() {
    LOCAL_IP=$(curl -s ifconfig.me 2>/dev/null || echo "your-server-ip")

    echo ""
    echo "=========================================="
    echo -e "${GREEN}部署完成！${NC}"
    echo "=========================================="
    echo ""
    echo "应用地址: http://$LOCAL_IP"
    echo "API 地址: http://$LOCAL_IP/api"
    echo ""
    echo "常用命令："
    echo "  查看日志:   pm2 logs wine-mall"
    echo "  重启服务:   pm2 restart wine-mall"
    echo "  停止服务:   pm2 stop wine-mall"
    echo "  监控面板:   pm2 monit"
    echo ""
    echo "=========================================="
}

# ===========================================
# 主函数
# ===========================================
main() {
    echo "=========================================="
    echo "   商城系统 - 阿里云 ECS 部署脚本"
    echo "=========================================="
    echo ""

    log_info "步骤 1/8: 安装 Node.js"
    install_nodejs

    log_info "步骤 2/8: 安装 PM2"
    install_pm2

    log_info "步骤 3/8: 安装 Nginx"
    install_nginx

    log_info "步骤 4/8: 创建应用目录"
    create_app_directory

    log_info "步骤 5/8: 安装依赖"
    install_dependencies

    log_info "步骤 6/8: 配置 PM2"
    configure_pm2

    log_info "步骤 7/8: 配置 Nginx"
    configure_nginx

    log_info "步骤 8/8: 配置防火墙"
    configure_firewall

    show_info
}

# 运行主函数
main "$@"