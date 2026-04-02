/**
 * 认证中间件
 * 验证 Token 并获取用户信息
 */

import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../utils/supabase';
import jwt from 'jsonwebtoken';

// JWT 密钥
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// 扩展 Request 类型
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        phone: string;
        name?: string;
        role?: string;
      };
    }
  }
}

/**
 * 验证用户认证
 */
export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '请先登录'
        }
      });
    }

    const token = authHeader.substring(7);

    // 验证 JWT token
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: '登录已过期，请重新登录'
        }
      });
    }

    // 获取用户详细信息
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', decoded.userId)
      .single();

    if (profileError || !userProfile) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: '用户不存在'
        }
      });
    }

    // 检查用户状态
    if (userProfile.status === 'frozen') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'USER_FROZEN',
          message: '账号已被冻结'
        }
      });
    }

    // 设置用户信息到请求对象
    req.user = {
      id: userProfile.id,
      phone: userProfile.phone,
      name: userProfile.name,
      role: 'user'
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'AUTH_ERROR',
        message: '认证失败'
      }
    });
  }
};

/**
 * 验证管理员权限
 */
export const requireAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // 首先验证用户是否登录
    await requireAuth(req, res, () => {});

    if (!req.user) {
      return;
    }

    // 检查是否是管理员
    // 这里简单判断，实际项目中应该有专门的 admin 表或 role 字段
    const adminPhones = (process.env.ADMIN_PHONES || '').split(',');

    if (!adminPhones.includes(req.user.phone)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: '没有管理员权限'
        }
      });
    }

    req.user.role = 'admin';
    next();
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'AUTH_ERROR',
        message: '认证失败'
      }
    });
  }
};

/**
 * 可选认证（不强制要求登录）
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      try {
        const decoded: any = jwt.verify(token, JWT_SECRET);

        const { data: userProfile } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('id', decoded.userId)
          .single();

        if (userProfile) {
          req.user = {
            id: userProfile.id,
            phone: userProfile.phone,
            name: userProfile.name,
            role: 'user'
          };
        }
      } catch (err) {
        // Token invalid, but don't block request
      }
    }

    next();
  } catch (error) {
    // 可选认证失败不阻止请求
    next();
  }
};