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
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5173',
    'http://127.0.0.1:5173'
  ],
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

// 静态文件服务（上传的图片）
app.use('/uploads', express.static(resolve(process.cwd(), 'server', 'uploads')));

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

// 挂载路由
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/partner', partnersRoutes);
app.use('/api', marketingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/partner-packages', partnerPackagesRoutes);
app.use('/api/cellar', cellarRoutes);
app.use('/api/upload', uploadRoutes);

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