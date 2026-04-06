/**
 * 认证路由
 * 用户登录、注册、信息获取
 */

import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../utils/supabase';
import { requireAuth } from '../middleware/auth';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const router = Router();

// JWT 密钥 - 延迟检查，确保环境变量已加载
const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET 环境变量未配置');
  }
  return secret;
};

// bcrypt 盐值轮数 (12 是推荐的安全值)
const BCRYPT_SALT_ROUNDS = 12;

// 安全的密码哈希函数 (使用 bcrypt)
const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
};

// 验证密码函数
const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

// 生成 JWT token
const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, getJwtSecret(), { expiresIn: '7d' });
};

// 生成 refresh token
const generateRefreshToken = (userId: string): string => {
  return jwt.sign({ userId, type: 'refresh' }, getJwtSecret(), { expiresIn: '30d' });
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
        password_hash: await hashPassword(password),
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

    // 验证密码 (使用 bcrypt 安全比较)
    const isValidPassword = await verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
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
      .select('id, phone, name, avatar, status, is_partner, partner_level, referrer_id, invite_code, balance, total_income, created_at, updated_at, gender, birthday, email')
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

    // 管理员角色判断 (根据 ADMIN_PHONES 环境变量)
    const adminPhones = (process.env.ADMIN_PHONES || '').split(',').filter(p => p.trim());
    const role = adminPhones.includes(user.phone) ? 'admin' : 'user';

    res.json({
      success: true,
      data: {
        ...user,
        role,
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

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: '用户不存在'
        }
      });
    }

    // 验证原密码 (使用 bcrypt)
    const isValidPassword = await verifyPassword(oldPassword, user.password_hash);
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'WRONG_PASSWORD',
          message: '原密码错误'
        }
      });
    }

    // 更新密码 (使用 bcrypt 哈希)
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ password_hash: await hashPassword(newPassword) })
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

// ===========================================
// 忘记密码相关
// ===========================================

// 验证码存储（生产环境应使用Redis）
const verificationCodes = new Map<string, { code: string; expiresAt: number }>();

/**
 * POST /api/auth/forgot-password
 * 发送验证码（忘记密码）
 */
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_PARAMS', message: '手机号不能为空' }
      });
    }

    // 验证手机号格式
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_PHONE', message: '请输入正确的手机号' }
      });
    }

    // 检查用户是否存在
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('phone', phone)
      .single();

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: '该手机号未注册' }
      });
    }

    // 生成6位验证码
    const code = Math.random().toString().slice(-6);

    // 存储验证码（5分钟有效）
    verificationCodes.set(phone, {
      code,
      expiresAt: Date.now() + 5 * 60 * 1000
    });

    // 生产环境：调用短信服务发送验证码
    // await sendSms(phone, `您的验证码是：${code}，5分钟内有效`);

    // 开发环境：返回验证码（生产环境应删除此行）
    console.log(`[DEV] 验证码已发送到 ${phone}: ${code}`);

    res.json({
      success: true,
      message: '验证码已发送',
      // 开发环境返回验证码，生产环境应删除
      _dev_code: process.env.NODE_ENV === 'development' ? code : undefined
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: '服务器错误' }
    });
  }
});

/**
 * POST /api/auth/reset-password
 * 重置密码（使用验证码）
 */
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { phone, code, newPassword } = req.body;

    if (!phone || !code || !newPassword) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_PARAMS', message: '参数不完整' }
      });
    }

    // 验证密码长度
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_PASSWORD', message: '密码至少需要6位字符' }
      });
    }

    // 验证验证码
    const storedCode = verificationCodes.get(phone);
    if (!storedCode) {
      return res.status(400).json({
        success: false,
        error: { code: 'CODE_NOT_FOUND', message: '请先获取验证码' }
      });
    }

    if (storedCode.expiresAt < Date.now()) {
      verificationCodes.delete(phone);
      return res.status(400).json({
        success: false,
        error: { code: 'CODE_EXPIRED', message: '验证码已过期，请重新获取' }
      });
    }

    if (storedCode.code !== code) {
      return res.status(400).json({
        success: false,
        error: { code: 'CODE_INVALID', message: '验证码错误' }
      });
    }

    // 更新密码
    const hashedPassword = await hashPassword(newPassword);
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ password_hash: hashedPassword })
      .eq('phone', phone);

    if (updateError) {
      return res.status(500).json({
        success: false,
        error: { code: 'UPDATE_FAILED', message: '密码重置失败' }
      });
    }

    // 删除已使用的验证码
    verificationCodes.delete(phone);

    res.json({
      success: true,
      message: '密码重置成功，请使用新密码登录'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: '服务器错误' }
    });
  }
});

export default router;