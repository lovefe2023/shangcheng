/**
 * 认证中间件
 * 验证 Token 并获取用户信息
 */

import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../utils/supabase';
import jwt from 'jsonwebtoken';

// 延迟获取 JWT 密钥
const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET 环境变量未配置');
  }
  return secret;
};

// 管理员手机号列表 - 延迟获取确保环境变量已加载
const getAdminPhones = (): string[] => {
  return (process.env.ADMIN_PHONES || '').split(',').filter(p => p.trim());
};

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
      decoded = jwt.verify(token, getJwtSecret());
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

    // 设置用户信息到请求对象，根据手机号判断管理员角色
    const role = getAdminPhones().includes(userProfile.phone) ? 'admin' : 'user';
    req.user = {
      id: userProfile.id,
      phone: userProfile.phone,
      name: userProfile.name,
      role
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
    await new Promise<void>((resolve, reject) => {
      requireAuth(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '请先登录'
        }
      });
    }

    // 检查是否是管理员
    if (!getAdminPhones().includes(req.user.phone)) {
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
        const decoded: any = jwt.verify(token, getJwtSecret());

        const { data: userProfile } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('id', decoded.userId)
          .single();

        if (userProfile) {
          // 设置管理员角色
          const role = getAdminPhones().includes(userProfile.phone) ? 'admin' : 'user';
          req.user = {
            id: userProfile.id,
            phone: userProfile.phone,
            name: userProfile.name,
            role
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