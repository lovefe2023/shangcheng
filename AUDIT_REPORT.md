# 前后端一致性审计报告

> 审计时间: 2026-04-01
> 审计范围: 前端商城页面 + 后台管理平台
> 审计人: Claude (全栈开发专家)

---

## 一、[严重不一致]

### 1. 合伙人礼包状态枚举不匹配
**问题描述**：
- 前端 `types.ts` 定义: `PartnerPackageStatus.ON_SHELVES / OFF_SHELVES`
- 后台 `AdminMarketing.tsx` 使用: `PartnerPackageStatus.ACTIVE / INACTIVE`（不存在）
- 数据库定义: `on_shelves / off_shelves`

**影响**：后台礼包管理功能状态切换失效，状态显示异常

**修改建议**：
```typescript
// AdminMarketing.tsx 第 24-54 行
// 将 PartnerPackageStatus.ACTIVE 改为 PartnerPackageStatus.ON_SHELVES
// 将 PartnerPackageStatus.INACTIVE 改为 PartnerPackageStatus.OFF_SHELVES
```

**涉及文件**：
- `src/pages/admin/AdminMarketing.tsx` (第 24-54, 199-206 行)

---

### 2. 优惠券状态枚举不存在
**问题描述**：
- 前端 `types.ts` 定义: `CouponStatus.DISTRIBUTING / ENDED`
- 后台 `AdminCoupons.tsx` 使用: `CouponStatus.ACTIVE / ENDED`（ACTIVE 不存在）

**影响**：后台优惠券管理状态筛选和显示失效

**修改建议**：
```typescript
// AdminCoupons.tsx 第 24, 36, 110 行
// 将 CouponStatus.ACTIVE 改为 CouponStatus.DISTRIBUTING
```

**涉及文件**：
- `src/pages/admin/AdminCoupons.tsx` (第 24, 36, 110 行)

---

### 3. 后台管理页面全部使用 Mock 数据
**问题描述**：以下后台页面未接入真实 API，全部使用硬编码数据：

| 页面 | 文件 | 状态 |
|------|------|------|
| 商品管理 | `AdminProducts.tsx` | Mock 数据 |
| 订单管理 | `AdminOrders.tsx` | Mock 数据 |
| 营销活动 | `AdminMarketing.tsx` | Mock 数据 |
| 优惠券管理 | `AdminCoupons.tsx` | Mock 数据 |
| 内容管理 | `AdminContent.tsx` | Mock 数据 |
| 用户管理 | `AdminUsers.tsx` | Mock 数据 |

**影响**：后台管理功能完全不可用，所有操作仅在前端模拟，不会持久化

**修改建议**：接入 `adminApi` 相关接口，替换 mock 数据

**涉及文件**：
- `src/pages/admin/AdminProducts.tsx`
- `src/pages/admin/AdminOrders.tsx`
- `src/pages/admin/AdminMarketing.tsx`
- `src/pages/admin/AdminCoupons.tsx`
- `src/pages/admin/AdminContent.tsx`
- `src/pages/admin/AdminUsers.tsx`

---

### 4. OrderDetails 前台页面未接入 API
**问题描述**：
- `OrderDetails.tsx` 使用硬编码数据，未调用 `ordersApi.getDetail(id)`
- 订单状态直接显示枚举值 `OrderStatus.SHIPPED` 而非 `OrderStatusLabel`

**影响**：订单详情页无法展示真实订单数据

**修改建议**：
```typescript
// OrderDetails.tsx 需要添加 useEffect 调用 ordersApi.getDetail(id)
// 并使用 OrderStatusLabel[order.status] 显示状态
```

**涉及文件**：
- `src/pages/OrderDetails.tsx`

---

## 二、[功能缺失]

### 1. 排行榜配置管理
| 方向 | 情况 |
|------|------|
| 前台有 | `/leaderboard` 排行榜展示页面 |
| 后台无 | 缺少排行榜规则配置（周榜/月榜/年榜权重、奖励设置等） |

**影响**：排行榜规则无法动态调整

---

### 2. 酒窖管理后台入口
| 方向 | 情况 |
|------|------|
| 前台有 | `/my-cellar` 我的酒窖页面 |
| 后台无 | 缺少酒窖数据管理、统计查看入口 |

**影响**：运营无法查看用户酒窖数据

---

### 3. 秒杀/团购活动编辑功能
| 方向 | 情况 |
|------|------|
| 后台有 | 创建页面 `AdminCreateFlashSale.tsx`, `AdminCreateGroupBuy.tsx` |
| 后台无 | 编辑已有活动的功能 |

**影响**：活动创建后无法修改

---

### 4. 商品规格管理不完整
| 方向 | 情况 |
|------|------|
| 前台有 | 商品详情页多规格选择（`specs` 字段） |
| 后台无 | `AdminAddProduct.tsx` / `AdminEditProduct.tsx` 缺少规格配置 UI |

**影响**：无法通过后台配置商品规格

---

## 三、[优化建议]

### 1. ContentStatus 枚举冗余
`types.ts` 中 ContentStatus 定义了 4 个值：
```typescript
VISIBLE = 'visible', HIDDEN = 'hidden', PUBLISHED = 'published', DRAFT = 'draft'
```
**建议**：拆分为两个枚举 `BannerStatus` 和 `PublishStatus`，语义更清晰

---

### 2. 佣金规则配置化
当前佣金规则、合伙人升级规则硬编码在前端 FAQ 页面，建议：
- 后台添加「分销规则配置」模块
- 存储在 `settings` 表中
- 前端动态读取

---

### 3. 订单详情页物流追踪
`OrderDetails.tsx` 第 128 行"确认收货"按钮始终显示，建议：
- 根据订单状态 `SHIPPED` 时才显示"确认收货"
- 添加物流追踪功能展示

---

### 4. 商品标签与营销活动关联
`AdminProducts.tsx` 商品标签设置为硬编码（热卖/秒杀/团购），建议：
- 标签与实际营销活动关联
- 秒杀活动开始时自动打标签，结束时移除

---

## 四、状态机一致性检查结果

| 状态类型 | 前端枚举 | 后端数据库 | 一致性 |
|---------|---------|-----------|--------|
| 订单状态 | OrderStatus | orders.status | ✅ 一致 |
| 商品状态 | ProductStatus | products.status | ✅ 一致 |
| 用户状态 | UserStatus | users.status | ✅ 一致 |
| 提现状态 | WithdrawalStatus | withdrawals.status | ✅ 一致 |
| 优惠券状态 | CouponStatus | coupons.status | ⚠️ 后台使用错误 |
| 合伙人礼包状态 | PartnerPackageStatus | partner_packages.status | ❌ 后台使用错误 |
| 用户优惠券状态 | UserCouponStatus | user_coupons.status | ✅ 一致 |

---

## 五、优先修复清单

| 优先级 | 问题 | 文件 | 行号 | 状态 |
|-------|------|------|------|------|
| P0 | 后台管理页面接入 API | AdminProducts.tsx 等 | 全文件 | ✅ 已修复 |
| P0 | 合伙人礼包状态修复 | AdminMarketing.tsx | 24-54, 199-206 | ✅ 已修复 |
| P0 | 优惠券状态修复 | AdminCoupons.tsx | 24, 36, 110 | ✅ 已修复 |
| P1 | 订单详情页接入 API | OrderDetails.tsx | 全文件 | ✅ 已修复 |
| P1 | 商品规格管理后台 | AdminAddProduct.tsx | 需新增 UI | ✅ 已修复 |
| P2 | 酒窖管理后台入口 | 路由配置 | 需新增页面 | ✅ 已修复 |
| P2 | 排行榜配置管理 | 需新增 | 需新增页面 | ✅ 已修复 |
| P3 | 秒杀/团购编辑功能 | AdminMarketing.tsx | 需新增功能 | ✅ 已修复 |
| P0 | AdminCoupons 接入真实API | AdminCoupons.tsx | 全文件 | ✅ 已修复 (2026-04-02) |
| P0 | AdminLeaderboard 接入真实API | AdminLeaderboard.tsx | 全文件 | ✅ 已修复 (2026-04-02) |
| P0 | AdminSettings 接入真实API | AdminSettings.tsx | 全文件 | ✅ 已修复 (2026-04-02) |

---

## 六、修复进度追踪

| 日期 | 修复内容 | 修复人 | 备注 |
|------|---------|--------|------|
| 2026-04-01 | AdminProducts.tsx API接入 | Claude | 接入adminApi.getProducts实现分页/筛选/搜索 |
| 2026-04-01 | AdminOrders.tsx API接入 | Claude | 接入adminApi.getOrders实现订单列表/筛选/导出 |
| 2026-04-01 | AdminUsers.tsx API接入 | Claude | 接入adminApi.getUsers实现用户管理/状态切换 |
| 2026-04-01 | AdminMarketing.tsx API接入 | Claude | 接入marketingApi实现秒杀/团购/优惠券列表 |
| 2026-04-01 | AdminContent.tsx API接入 | Claude | 接入marketingApi.getBanners/getNotifications实现内容管理 |
| 2026-04-01 | OrderDetails.tsx API接入 | Claude | 接入ordersApi.getDetail实现订单详情/取消/确认收货 |
| 2026-04-01 | PartnerPackageStatus枚举修复 | Claude | ACTIVE→ON_SHELVES, INACTIVE→OFF_SHELVES |
| 2026-04-01 | CouponStatus枚举修复 | Claude | ACTIVE→DISTRIBUTING |
| 2026-04-01 | 路由修复 | server/routes/products.ts | /categories→/categories/list |
| 2026-04-01 | 商品规格管理UI完善 | AdminAddProduct.tsx | 接入API+多规格支持+真实分类数据 |
| 2026-04-01 | 商品编辑页面完善 | AdminEditProduct.tsx | 接入API+规格编辑功能 |
| 2026-04-01 | 酒窖管理后台 | AdminCellar.tsx | 新增页面+后端API+路由导航 |
| 2026-04-01 | 排行榜配置后台 | AdminLeaderboard.tsx | 新增页面+奖励配置+显示设置 |
| 2026-04-01 | 秒杀活动编辑 | AdminEditFlashSale.tsx | 新增编辑页面+路由 |
| 2026-04-01 | 团购活动编辑 | AdminEditGroupBuy.tsx | 新增编辑页面+路由 |
| 2026-04-01 | 后台导航更新 | AdminLayout.tsx | 添加酒窖管理/排行榜配置入口 |
| 2026-04-01 | AdminFinance.tsx API接入 | Claude | 接入adminApi.getFinanceStats/getTransactions实现财务统计/交易流水 |
| 2026-04-01 | AdminDistribution.tsx API接入 | Claude | 接入adminApi.getIncomeRecords/getSalesLeaderboard实现收益记录/龙虎榜 |
| 2026-04-01 | 后端API新增 | server/routes/admin.ts | 添加finance/stats, transactions, income-records, sales-leaderboard, distribution-settings接口 |
| 2026-04-01 | 前端API新增 | src/lib/api.ts | 添加getFinanceStats, getTransactions, getIncomeRecords, getSalesLeaderboard等方法 |
| 2026-04-01 | FlashSale.tsx API接入 | Claude | 接入marketingApi.getFlashSales实现秒杀商品列表 |
| 2026-04-01 | GroupBuy.tsx API接入 | Claude | 接入marketingApi.getGroupBuys实现团购商品列表 |
| 2026-04-01 | CategoryList.tsx API接入 | Claude | 接入productsApi.getList实现分类商品列表 |
| 2026-04-01 | Sales.tsx API接入 | Claude | 接入partnerApi.getIncome实现收益记录/统计 |
| 2026-04-01 | TeamSales.tsx API接入 | Claude | 接入partnerApi.getTeam实现团队销售统计/图表 |
| 2026-04-01 | NewPartnersToday.tsx API接入 | Claude | 接入partnerApi.getTodayNew实现今日新增合伙人列表 |
| 2026-04-01 | Profile.tsx API接入 | Claude | 接入authApi.getMe和ordersApi实现用户信息/订单统计 |

---

## 七、附录：相关文件清单

### 前端类型定义
- `src/types.ts`

### 前台页面
- `src/pages/OrderDetails.tsx`
- `src/pages/ProductDetails.tsx`
- `src/pages/FlashSale.tsx`
- `src/pages/Partner.tsx`
- `src/pages/Checkout.tsx`

### 后台管理页面
- `src/pages/admin/AdminProducts.tsx`
- `src/pages/admin/AdminOrders.tsx`
- `src/pages/admin/AdminMarketing.tsx`
- `src/pages/admin/AdminCoupons.tsx`
- `src/pages/admin/AdminContent.tsx`
- `src/pages/admin/AdminUsers.tsx`

### 数据库定义
- `supabase/migrations/001_initial_schema.sql`
- `supabase/migrations/002_partner_packages.sql`
- `supabase/migrations/003_cellar_items.sql`