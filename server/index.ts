/**
 * 商城系统后端服务
 * Express + Supabase
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// 最先加载环境变量（必须在其他导入之前）
config({ path: resolve(process.cwd(), '.env') });

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

// 导入路由
import authRoutes from './routes/auth';
import productsRoutes from './routes/products';
import ordersRoutes from './routes/orders';
import partnersRoutes from './routes/partners';
import marketingRoutes from './routes/marketing';
import adminRoutes from './routes/admin';
import partnerPackagesRoutes from './routes/partnerPackages';
import cellarRoutes from './routes/cellar';
import uploadRoutes from './routes/upload';

// 创建 Express 应用
const app = express();
const PORT = process.env.PORT || 3001;

// ===========================================
// 中间件配置
// ===========================================

// 安全头部
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// CORS 配置
app.use(cors({
  origin: true, // 允许所有来源（生产环境前后端同源，穿透后可能跨域）
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// 压缩响应
app.use(compression());

// 请求日志
app.use(morgan('dev'));

// JSON 解析
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ===========================================
// 速率限制配置
// ===========================================

// 认证接口速率限制（登录/注册）- 更严格
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 10, // 每个 IP 最多 10 次请求
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: '请求过于频繁，请稍后再试'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  // 跳过本地开发环境
  skip: () => process.env.NODE_ENV === 'development'
});

// 敏感操作速率限制（密码修改、提现等）
const sensitiveLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 20, // 每个 IP 最多 20 次请求
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: '操作过于频繁，请稍后再试'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'development'
});

// 通用 API 速率限制
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1分钟
  max: 100, // 每个 IP 最多 100 次请求
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: '请求过于频繁'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

// 静态文件服务（上传的图片）
app.use('/uploads', express.static(resolve(process.cwd(), 'server', 'uploads')));

// 生产环境：静态文件服务（打包后的前端）
const distPath = resolve(process.cwd(), 'dist');
app.use(express.static(distPath));

// SPA fallback - 所有非API请求返回 index.html
app.get('*', (req: Request, res: Response, next: NextFunction) => {
  // 如果是 API 请求，跳过
  if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) {
    return next();
  }
  res.sendFile(resolve(distPath, 'index.html'));
});

// ===========================================
// API 路由
// ===========================================

// 健康检查
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// 挂载路由（带速率限制）
// 认证路由 - 应用严格的速率限制
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth', authRoutes);

// 公开 API - 应用通用速率限制
app.use('/api/products', apiLimiter, productsRoutes);
app.use('/api', apiLimiter, marketingRoutes);
app.use('/api/partner-packages', apiLimiter, partnerPackagesRoutes);

// 用户操作 API - 应用通用速率限制
app.use('/api/orders', apiLimiter, ordersRoutes);
app.use('/api/partner', apiLimiter, partnersRoutes);
app.use('/api/cellar', apiLimiter, cellarRoutes);

// 管理后台 API - 应用通用速率限制
app.use('/api/admin', apiLimiter, adminRoutes);

// 文件上传 - 应用敏感操作速率限制
app.use('/api/upload', sensitiveLimiter, uploadRoutes);

// ===========================================
// 错误处理
// ===========================================

// 404 处理
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: '请求的资源不存在'
    }
  });
});

// 全局错误处理
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Server Error:', err);

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'development' ? err.message : '服务器内部错误'
    }
  });
});

// ===========================================
// 启动服务
// ===========================================

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 商城系统后端服务已启动                                ║
║                                                           ║
║   端口: ${PORT}                                            ║
║   环境: ${process.env.NODE_ENV || 'development'}                         ║
║   时间: ${new Date().toLocaleString('zh-CN')}              ║
║                                                           ║
║   API 文档: http://localhost:${PORT}/api/health            ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

export default app;