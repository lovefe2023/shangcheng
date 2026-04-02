/**
 * 认证路由
 * 用户登录、注册、信息获取
 */

import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../utils/supabase';
import { requireAuth } from '../middleware/auth';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const router = Router();

// JWT 密钥
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// 简单的密码哈希函数
const hashPassword = (password: string): string => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

// 生成 JWT token
const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
};

// 生成 refresh token
const generateRefreshToken = (userId: string): string => {
  return jwt.sign({ userId, type: 'refresh' }, JWT_SECRET, { expiresIn: '30d' });
};

/**
 * POST /api/auth/register
 * 用户注册
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { phone, password, name, inviteCode } = req.body;

    // 参数验证
    if (!phone || !password) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PARAMS',
          message: '手机号和密码不能为空'
        }
      });
    }

    // 验证手机号格式
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PHONE',
          message: '请输入正确的手机号'
        }
      });
    }

    // 验证密码长度
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PASSWORD',
          message: '密码至少需要6位字符'
        }
      });
    }

    // 检查手机号是否已注册
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('phone', phone)
      .single();

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'PHONE_EXISTS',
          message: '该手机号已注册'
        }
      });
    }

    // 查找推荐人
    let referrerId: string | null = null;
    if (inviteCode) {
      const { data: referrer } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('invite_code', inviteCode)
        .single();

      if (referrer) {
        referrerId = referrer.id;
      }
    }

    // 生成邀请码
    const userInviteCode = `U${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

    // 创建用户记录
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        phone,
        password_hash: hashPassword(password),
        name: name || `用户${phone.slice(-4)}`,
        referrer_id: referrerId,
        invite_code: userInviteCode,
        status: 'active'
      })
      .select()
      .single();

    if (userError) {
      console.error('User insert error:', userError);
      return res.status(500).json({
        success: false,
        error: {
          code: 'USER_CREATE_FAILED',
          message: '创建用户失败: ' + userError.message
        }
      });
    }

    // 生成 token (在用户创建之后)
    const token = generateToken(user.id);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          phone: user.phone,
          name: user.name,
          invite_code: user.invite_code,
          is_partner: user.is_partner,
          partner_level: user.partner_level,
          balance: user.balance
        },
        session: {
          access_token: token,
          refresh_token: generateRefreshToken(user.id)
        }
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: '服务器错误'
      }
    });
  }
});

/**
 * POST /api/auth/login
 * 用户登录
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PARAMS',
          message: '手机号和密码不能为空'
        }
      });
    }

    // 查找用户
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('phone', phone)
      .single();

    if (error || !user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'LOGIN_FAILED',
          message: '手机号或密码错误'
        }
      });
    }

    // 验证密码
    const passwordHash = hashPassword(password);
    if (user.password_hash !== passwordHash) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'LOGIN_FAILED',
          message: '手机号或密码错误'
        }
      });
    }

    // 检查用户状态
    if (user.status === 'frozen') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCOUNT_FROZEN',
          message: '账号已被冻结，请联系客服'
        }
      });
    }

    // 生成 token
    const token = generateToken(user.id);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          phone: user.phone,
          name: user.name,
          avatar: user.avatar,
          status: user.status,
          is_partner: user.is_partner,
          partner_level: user.partner_level,
          invite_code: user.invite_code,
          balance: user.balance,
          total_income: user.total_income,
          gender: user.gender,
          birthday: user.birthday,
          email: user.email
        },
        session: {
          access_token: token,
          refresh_token: generateRefreshToken(user.id)
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: '服务器错误'
      }
    });
  }
});

/**
 * POST /api/auth/logout
 * 用户登出
 */
router.post('/logout', async (req: Request, res: Response) => {
  res.json({
    success: true,
    message: '登出成功'
  });
});

/**
 * GET /api/auth/me
 * 获取当前用户信息
 */
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', req.user!.id)
      .single();

    if (error) {
      console.error('Get user error:', error);
    }

    if (error || !user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: '用户不存在'
        }
      });
    }

    // 获取团队人数
    const { count: teamSize } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('referrer_id', user.id);

    res.json({
      success: true,
      data: {
        ...user,
        team_size: teamSize || 0
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: '服务器错误'
      }
    });
  }
});

/**
 * PUT /api/auth/profile
 * 更新用户资料
 */
router.put('/profile', requireAuth, async (req: Request, res: Response) => {
  try {
    const { name, avatar, gender, birthday, email } = req.body;

    const updateData: any = {};
    if (name) updateData.name = name;
    if (avatar) updateData.avatar = avatar;
    if (gender) updateData.gender = gender;
    if (birthday) updateData.birthday = birthday;
    if (email) updateData.email = email;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PARAMS',
          message: '没有需要更新的内容'
        }
      });
    }

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', req.user!.id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'UPDATE_FAILED',
          message: '更新失败'
        }
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: '服务器错误'
      }
    });
  }
});

/**
 * PUT /api/auth/password
 * 修改密码
 */
router.put('/password', requireAuth, async (req: Request, res: Response) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PARAMS',
          message: '请填写完整信息'
        }
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PASSWORD',
          message: '新密码至少需要6位字符'
        }
      });
    }

    // 获取用户
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('password_hash')
      .eq('id', req.user!.id)
      .single();

    if (!user || user.password_hash !== hashPassword(oldPassword)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'WRONG_PASSWORD',
          message: '原密码错误'
        }
      });
    }

    // 更新密码
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ password_hash: hashPassword(newPassword) })
      .eq('id', req.user!.id);

    if (updateError) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'UPDATE_FAILED',
          message: '密码修改失败'
        }
      });
    }

    res.json({
      success: true,
      message: '密码修改成功'
    });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: '服务器错误'
      }
    });
  }
});

export default router;