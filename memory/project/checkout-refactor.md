---
name: checkout-refactor
description: Checkout页面重构完成，接入真实API实现完整购买流程
type: project
---

## Checkout页面重构完成 (2026-04-02)

**问题背景:**
原Checkout.tsx使用硬编码Mock数据：
- `userStatus = UserStatus.FROZEN` 导致提交按钮禁用
- 地址、商品、价格全部是假数据
- 点击"提交订单"只是跳转到 `/payment`，不实际创建订单

**重构内容:**

### 1. 数据获取
- `cartApi.get()` - 获取购物车商品，支持URL参数筛选
- `addressesApi.getList()` - 获取用户地址列表
- `marketingApi.getMyCoupons('unused')` - 获取可用优惠券

### 2. 订单创建
```typescript
const res = await ordersApi.create({
  address_id: selectedAddress.id,
  cart_item_ids: cartItems.map(item => item.id),
  coupon_id: selectedCoupon?.id,
  note
});
```

### 3. UI组件
- 地址选择模态框
- 优惠券选择模态框
- 订单备注输入
- 动态金额计算

### 关联修复
- `src/lib/api.ts` - Token获取逻辑修复
- `src/pages/Cart.tsx` - 购物车数据映射修复

**Why:** 原页面完全无法完成真实购买，是P0级别功能缺陷
**How to apply:** 用户登录后添加收货地址即可完成完整购买流程