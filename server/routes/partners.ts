/**
 * 合伙人路由
 * 合伙人申请、收益、提现
 */

import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../utils/supabase';
import { requireAuth } from '../middleware/auth';

const router = Router();

/**
 * GET /api/partner/profile
 * 获取合伙人信息
 */
router.get('/profile', requireAuth, async (req: Request, res: Response) => {
  try {
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', req.user!.id)
      .single();

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

    // 获取本月销售额
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const { data: monthOrders } = await supabaseAdmin
      .from('orders')
      .select('paid_amount')
      .eq('referrer_id', user.id)
      .in('status', ['completed', 'shipped'])
      .gte('created_at', monthStart);

    const monthSales = monthOrders?.reduce((sum, order) => sum + order.paid_amount, 0) || 0;

    // 获取收益统计
    const { data: incomeStats } = await supabaseAdmin
      .from('income_records')
      .select('type, amount, status')
      .eq('user_id', user.id);

    const stats = {
      referral_reward: 0,
      sales_commission: 0,
      dividend: 0
    };

    incomeStats?.forEach(record => {
      if (record.status === 'settled' || record.status === 'completed') {
        stats[record.type as keyof typeof stats] += record.amount;
      }
    });

    res.json({
      success: true,
      data: {
        ...user,
        team_size: teamSize || 0,
        month_sales: monthSales,
        total_referral_reward: stats.referral_reward,
        total_sales_commission: stats.sales_commission,
        total_dividend: stats.dividend
      }
    });
  } catch (error) {
    console.error('Get partner profile error:', error);
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
 * GET /api/partner/team
 * 获取团队成员
 */
router.get('/team', requireAuth, async (req: Request, res: Response) => {
  try {
    const { page = 1, pageSize = 20, level } = req.query;

    let query = supabaseAdmin
      .from('users')
      .select('id, name, phone, avatar, partner_level, created_at', { count: 'exact' })
      .eq('referrer_id', req.user!.id)
      .order('created_at', { ascending: false });

    if (level) {
      query = query.eq('partner_level', level);
    }

    // 分页
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const pageSizeNum = Math.min(100, Math.max(1, parseInt(pageSize as string) || 20));
    const offset = (pageNum - 1) * pageSizeNum;

    query = query.range(offset, offset + pageSizeNum - 1);

    const { data: members, error, count } = await query;

    if (error) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'QUERY_ERROR',
          message: '查询失败'
        }
      });
    }

    res.json({
      success: true,
      data: {
        list: members || [],
        total: count || 0,
        page: pageNum,
        pageSize: pageSizeNum
      }
    });
  } catch (error) {
    console.error('Get team error:', error);
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
 * POST /api/partner/apply
 * 申请成为合伙人
 */
router.post('/apply', requireAuth, async (req: Request, res: Response) => {
  try {
    const { level = 'junior' } = req.body;

    // 检查是否已经是合伙人
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('is_partner, partner_level')
      .eq('id', req.user!.id)
      .single();

    if (user?.is_partner) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'ALREADY_PARTNER',
          message: '您已经是合伙人'
        }
      });
    }

    // 检查是否有待审核的申请
    const { data: existingApp } = await supabaseAdmin
      .from('partner_applications')
      .select('*')
      .eq('user_id', req.user!.id)
      .eq('status', 'pending')
      .single();

    if (existingApp) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'APPLICATION_EXISTS',
          message: '您已提交申请，请等待审核'
        }
      });
    }

    // 创建申请
    const { error } = await supabaseAdmin
      .from('partner_applications')
      .insert({
        user_id: req.user!.id,
        status: 'pending',
        level
      });

    if (error) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'APPLY_FAILED',
          message: '申请失败'
        }
      });
    }

    res.json({
      success: true,
      message: '申请已提交，请等待审核'
    });
  } catch (error) {
    console.error('Partner apply error:', error);
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
 * GET /api/partner/income
 * 获取收益明细
 */
router.get('/income', requireAuth, async (req: Request, res: Response) => {
  try {
    const { page = 1, pageSize = 20, type, status } = req.query;

    let query = supabaseAdmin
      .from('income_records')
      .select(`
        *,
        source_user:users!income_records_source_user_id_fkey(id, name, phone)
      `, { count: 'exact' })
      .eq('user_id', req.user!.id)
      .order('created_at', { ascending: false });

    if (type) {
      query = query.eq('type', type);
    }
    if (status) {
      query = query.eq('status', status);
    }

    // 分页
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const pageSizeNum = Math.min(100, Math.max(1, parseInt(pageSize as string) || 20));
    const offset = (pageNum - 1) * pageSizeNum;

    query = query.range(offset, offset + pageSizeNum - 1);

    const { data: records, error, count } = await query;

    if (error) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'QUERY_ERROR',
          message: '查询失败'
        }
      });
    }

    res.json({
      success: true,
      data: {
        list: records || [],
        total: count || 0,
        page: pageNum,
        pageSize: pageSizeNum
      }
    });
  } catch (error) {
    console.error('Get income error:', error);
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
 * POST /api/partner/withdraw
 * 申请提现
 */
router.post('/withdraw', requireAuth, async (req: Request, res: Response) => {
  try {
    const { amount, method, account_info } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_AMOUNT',
          message: '请输入正确的提现金额'
        }
      });
    }

    // 获取用户余额
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('balance, status')
      .eq('id', req.user!.id)
      .single();

    if (!user || user.balance < amount) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_BALANCE',
          message: '余额不足'
        }
      });
    }

    if (user.status === 'frozen') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'USER_FROZEN',
          message: '账号已冻结，无法提现'
        }
      });
    }

    // 计算手续费 (0.3%)
    const feeRate = 0.003;
    const fee = Math.ceil(amount * feeRate * 100) / 100;
    const actualAmount = amount - fee;

    // 生成提现单号
    const withdrawalNo = `WD${Date.now()}${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

    // 创建提现记录
    const { data: withdrawal, error } = await supabaseAdmin
      .from('withdrawals')
      .insert({
        withdrawal_no: withdrawalNo,
        user_id: req.user!.id,
        amount,
        fee,
        actual_amount: actualAmount,
        method,
        account_info,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'WITHDRAW_FAILED',
          message: '提现申请失败'
        }
      });
    }

    // 冻结用户余额
    await supabaseAdmin
      .from('users')
      .update({ balance: user.balance - amount })
      .eq('id', req.user!.id);

    res.json({
      success: true,
      data: withdrawal,
      message: '提现申请已提交'
    });
  } catch (error) {
    console.error('Withdraw error:', error);
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
 * GET /api/partner/withdrawals
 * 获取提现记录
 */
router.get('/withdrawals', requireAuth, async (req: Request, res: Response) => {
  try {
    const { page = 1, pageSize = 20, status } = req.query;

    let query = supabaseAdmin
      .from('withdrawals')
      .select('*', { count: 'exact' })
      .eq('user_id', req.user!.id)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    // 分页
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const pageSizeNum = Math.min(100, Math.max(1, parseInt(pageSize as string) || 20));
    const offset = (pageNum - 1) * pageSizeNum;

    query = query.range(offset, offset + pageSizeNum - 1);

    const { data: withdrawals, error, count } = await query;

    if (error) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'QUERY_ERROR',
          message: '查询失败'
        }
      });
    }

    res.json({
      success: true,
      data: {
        list: withdrawals || [],
        total: count || 0,
        page: pageNum,
        pageSize: pageSizeNum
      }
    });
  } catch (error) {
    console.error('Get withdrawals error:', error);
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
 * GET /api/partner/leaderboard
 * 销售排行榜（公开接口）
 */
router.get('/leaderboard', async (req: Request, res: Response) => {
  try {
    const { type = 'sales', limit = 10, period = 'month' } = req.query;

    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string) || 10));

    // 计算时间范围
    const now = new Date();
    let startDate: string;
    if (period === 'week') {
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      startDate = weekStart.toISOString();
    } else if (period === 'year') {
      const yearStart = new Date(now.getFullYear(), 0, 1);
      startDate = yearStart.toISOString();
    } else {
      // 默认本月
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      startDate = monthStart.toISOString();
    }

    if (type === 'sales') {
      // 销售额排行榜：统计合伙人本周期内的销售额
      const { data: orders, error } = await supabaseAdmin
        .from('orders')
        .select(`
          referrer_id,
          paid_amount,
          referrer:users!orders_referrer_id_fkey(id, name, avatar, partner_level)
        `)
        .in('status', ['completed', 'shipped'])
        .gte('created_at', startDate)
        .not('referrer_id', 'is', null);

      if (error) {
        return res.status(500).json({
          success: false,
          error: {
            code: 'QUERY_ERROR',
            message: '查询失败'
          }
        });
      }

      // 按合伙人汇总销售额
      const salesMap: Record<string, { user: any; total: number }> = {};
      orders?.forEach(order => {
        if (order.referrer_id && order.referrer) {
          if (!salesMap[order.referrer_id]) {
            salesMap[order.referrer_id] = {
              user: order.referrer,
              total: 0
            };
          }
          salesMap[order.referrer_id].total += order.paid_amount;
        }
      });

      // 排序并取前N名
      const leaderboard = Object.entries(salesMap)
        .map(([id, data]) => ({
          id,
          name: data.user.name,
          avatar: data.user.avatar,
          partner_level: data.user.partner_level,
          sales: data.total
        }))
        .sort((a, b) => b.sales - a.sales)
        .slice(0, limitNum)
        .map((item, index) => ({
          ...item,
          rank: index + 1
        }));

      res.json({
        success: true,
        data: leaderboard
      });
    } else if (type === 'income') {
      // 收益排行榜：统计合伙人本周期内的收益
      const { data: incomes, error } = await supabaseAdmin
        .from('income_records')
        .select(`
          user_id,
          amount,
          users!user_id(id, name, avatar, partner_level)
        `)
        .in('status', ['settled', 'completed'])
        .gte('created_at', startDate);

      if (error) {
        return res.status(500).json({
          success: false,
          error: {
            code: 'QUERY_ERROR',
            message: '查询失败'
          }
        });
      }

      // 按用户汇总收益
      const incomeMap: Record<string, { user: any; total: number }> = {};
      incomes?.forEach(record => {
        const userData = record.users as any;
        if (record.user_id && userData) {
          if (!incomeMap[record.user_id]) {
            incomeMap[record.user_id] = {
              user: userData,
              total: 0
            };
          }
          incomeMap[record.user_id].total += record.amount;
        }
      });

      // 排序并取前N名
      const leaderboard = Object.entries(incomeMap)
        .map(([id, data]) => ({
          id,
          name: data.user.name,
          avatar: data.user.avatar,
          partner_level: data.user.partner_level,
          income: data.total
        }))
        .sort((a, b) => b.income - a.income)
        .slice(0, limitNum)
        .map((item, index) => ({
          ...item,
          rank: index + 1
        }));

      res.json({
        success: true,
        data: leaderboard
      });
    } else {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TYPE',
          message: '无效的排行榜类型'
        }
      });
    }
  } catch (error) {
    console.error('Get leaderboard error:', error);
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