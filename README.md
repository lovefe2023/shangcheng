<div align="center">
<img width="200" height="200" alt="Wine Mall Logo" src="https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=200&h=200&fit=crop" />
<h1>🍷 名酒商城系统</h1>
<p>一个完整的酒类电商合伙人分销系统</p>
</div>

---

## 系统概述

这是一个完整的酒类电商合伙人分销系统，包含：

- **前端展示**：商品浏览、购物车、订单管理、合伙人中心等
- **后台管理**：商品管理、订单管理、用户管理、合伙人管理、财务管理等
- **后端服务**：Express.js + Supabase

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 19 + TypeScript + Vite + TailwindCSS |
| 后端 | Express.js |
| 数据库 | Supabase (PostgreSQL) |
| 认证 | Supabase Auth |

## 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并填写配置：

```env
# Supabase 配置 (必填)
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# 服务端配置
PORT=3001
NODE_ENV=development

# 管理员手机号 (用逗号分隔)
ADMIN_PHONES=13800138000
```

### 3. 初始化数据库

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 创建新项目
3. 进入 SQL Editor
4. 执行 `supabase/migrations/001_initial_schema.sql`

### 4. 启动服务

```bash
# 开发模式 (前端 + 后端)
npm run dev:full

# 仅前端
npm run dev

# 仅后端
npm run server
```

### 5. 访问系统

- 🛒 前端展示: http://localhost:3000
- 📊 后台管理: http://localhost:3000/admin
- 🔌 API 接口: http://localhost:3001/api

## 项目结构

```
D:\AI\shangcheng\
├── src/                    # 前端代码
│   ├── pages/             # 页面组件
│   │   └── admin/        # 后台管理页面
│   ├── components/        # 公共组件
│   └── lib/              # API 客户端
├── server/                # 后端代码
│   ├── index.ts          # 服务入口
│   ├── routes/           # API 路由
│   └── middleware/       # 中间件
├── supabase/             # 数据库迁移
└── .env                  # 环境变量
```

## 主要功能

### 前端展示
- 🏠 首页（秒杀、团购、推荐商品）
- 📦 商品列表与详情
- 🛒 购物车管理
- 📋 订单管理
- 👤 用户中心
- 🤝 合伙人中心
- 🎫 优惠券领取与使用

### 后台管理
- 📊 仪表盘数据展示
- 📦 商品管理（分类、标签）
- 📋 订单管理（发货、退款）
- 👥 用户管理
- 🤝 合伙人管理（审核、等级）
- 💰 财务管理（提现审核）
- 📢 营销管理（秒杀、团购、优惠券）

## API 文档

详见 [API_DOCS.md](./API_DOCS.md)

## 生产部署

### 前端
```bash
npm run build
# 部署 dist/ 目录
```

### 后端
```bash
pm2 start "tsx server/index.ts" --name "wine-mall-api"
```

## 更新日志

### v1.0.0 (2026-04-01)
- ✅ 完成前端展示和后台管理界面
- ✅ 完成后端 API 服务
- ✅ 完成 Supabase 数据库设计
- ✅ 实现用户认证与权限控制
