#!/bin/bash

# ===========================================
# 阿里云一键部署脚本
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
# 检查系统环境
# ===========================================
check_system() {
    log_info "检查系统环境..."

    if [ -f /etc/redhat-release ]; then
        OS="centos"
        PKG_MANAGER="yum"
    elif [ -f /etc/debian_version ]; then
        OS="debian"
        PKG_MANAGER="apt"
    else
        log_error "不支持的操作系统"
        exit 1
    fi

    log_info "检测到系统: $OS"
}

# ===========================================
# 安装基础依赖
# ===========================================
install_dependencies() {
    log_info "安装基础依赖..."

    if [ "$OS" = "centos" ]; then
        sudo yum update -y
        sudo yum install -y git curl wget vim
    else
        sudo apt update -y
        sudo apt install -y git curl wget vim
    fi
}

# ===========================================
# 安装 Docker
# ===========================================
install_docker() {
    if command -v docker &> /dev/null; then
        log_info "Docker 已安装"
        return
    fi

    log_info "安装 Docker..."

    # 使用阿里云镜像加速
    curl -fsSL https://get.docker.com | bash -s docker --mirror Aliyun

    # 启动 Docker
    sudo systemctl start docker
    sudo systemctl enable docker

    # 配置 Docker 镜像加速
    sudo mkdir -p /etc/docker
    sudo tee /etc/docker/daemon.json <<EOF
{
    "registry-mirrors": [
        "https://registry.cn-hangzhou.aliyuncs.com",
        "https://mirror.ccs.tencentyun.com"
    ]
}
EOF

    sudo systemctl daemon-reload
    sudo systemctl restart docker

    log_info "Docker 安装完成"
}

# ===========================================
# 安装 Docker Compose
# ===========================================
install_docker_compose() {
    if command -v docker-compose &> /dev/null; then
        log_info "Docker Compose 已安装"
        return
    fi

    log_info "安装 Docker Compose..."

    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose

    log_info "Docker Compose 安装完成"
}

# ===========================================
# 创建应用目录
# ===========================================
create_app_directory() {
    APP_DIR="/var/www/wine-mall"

    log_info "创建应用目录: $APP_DIR"

    sudo mkdir -p $APP_DIR
    sudo mkdir -p $APP_DIR/logs
    sudo mkdir -p $APP_DIR/uploads
    sudo mkdir -p $APP_DIR/ssl

    cd $APP_DIR
}

# ===========================================
# 配置防火墙
# ===========================================
configure_firewall() {
    log_info "配置防火墙..."

    if command -v firewall-cmd &> /dev/null; then
        sudo firewall-cmd --permanent --add-port=80/tcp
        sudo firewall-cmd --permanent --add-port=443/tcp
        sudo firewall-cmd --permanent --add-port=5000/tcp
        sudo firewall-cmd --reload
        log_info "防火墙配置完成"
    else
        log_warn "未检测到 firewalld，跳过防火墙配置"
    fi
}

# ===========================================
# 配置环境变量
# ===========================================
configure_env() {
    log_info "配置环境变量..."

    if [ ! -f .env ]; then
        if [ -f .env.example ]; then
            cp .env.example .env
            log_warn "已创建 .env 文件，请编辑配置生产环境变量"
        else
            log_error "缺少 .env.example 文件"
            exit 1
        fi
    fi

    # 提示用户修改环境变量
    log_warn "=========================================="
    log_warn "请确保已修改 .env 文件中的以下配置："
    log_warn "- JWT_SECRET (设置一个强密钥)"
    log_warn "- DATABASE_URL (数据库连接)"
    log_warn "- 其他敏感信息"
    log_warn "=========================================="
}

# ===========================================
# 构建和启动服务
# ===========================================
deploy_app() {
    log_info "构建和启动服务..."

    # 停止旧容器
    docker-compose down 2>/dev/null || true

    # 构建镜像
    docker-compose build --no-cache

    # 启动服务
    docker-compose up -d

    # 等待服务启动
    sleep 5

    # 检查服务状态
    if docker-compose ps | grep -q "Up"; then
        log_info "服务启动成功"
    else
        log_error "服务启动失败，请检查日志"
        docker-compose logs
        exit 1
    fi
}

# ===========================================
# 运行数据库迁移
# ===========================================
run_migrations() {
    log_info "请确保已在 Supabase 控制台运行数据库迁移脚本"
    log_info "迁移文件位于: supabase/migrations/"
}

# ===========================================
# 显示部署信息
# ===========================================
show_info() {
    echo ""
    echo "=========================================="
    echo -e "${GREEN}部署完成！${NC}"
    echo "=========================================="
    echo ""
    echo "应用地址: http://$(curl -s ifconfig.me)"
    echo "API 地址: http://$(curl -s ifconfig.me)/api"
    echo ""
    echo "常用命令："
    echo "  查看日志:   docker-compose logs -f"
    echo "  重启服务:   docker-compose restart"
    echo "  停止服务:   docker-compose down"
    echo "  更新部署:   git pull && docker-compose up -d --build"
    echo ""
    echo "=========================================="
}

# ===========================================
# 主函数
# ===========================================
main() {
    echo "=========================================="
    echo "   商城系统 - 阿里云一键部署脚本"
    echo "=========================================="
    echo ""

    check_system
    install_dependencies
    install_docker
    install_docker_compose
    create_app_directory
    configure_firewall
    configure_env
    deploy_app
    run_migrations
    show_info
}

# 运行主函数
main "$@"