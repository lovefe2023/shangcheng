# 商城系统 API 文档

## 基础信息

- **Base URL**: `http://localhost:3001/api`
- **认证方式**: Bearer Token (JWT)
- **数据格式**: JSON

## 通用响应格式

```json
{
  "success": true,
  "data": { ... },
  "message": "操作成功"
}
```

错误响应：
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述"
  }
}
```

---

## 认证接口

### POST /api/auth/register
用户注册

**请求体**:
```json
{
  "phone": "13800138000",
  "password": "123456",
  "name": "张三",
  "inviteCode": "UXXX"
}
```

### POST /api/auth/login
用户登录

**请求体**:
```json
{
  "phone": "13800138000",
  "password": "123456"
}
```

### GET /api/auth/me
获取当前用户信息 (需要认证)

### PUT /api/auth/profile
更新用户资料 (需要认证)

---

## 商品接口

### GET /api/products
商品列表

**查询参数**:
- `page`: 页码 (默认 1)
- `pageSize`: 每页数量 (默认 20)
- `category`: 分类ID
- `keyword`: 搜索关键词
- `minPrice`: 最低价格
- `maxPrice`: 最高价格
- `sortBy`: 排序字段 (created_at, price, sales)
- `sortOrder`: 排序方向 (asc, desc)

### GET /api/products/:id
商品详情

### GET /api/products/categories/list
分类列表

---

## 购物车接口

### GET /api/orders/cart
获取购物车 (需要认证)

### POST /api/orders/cart
添加到购物车 (需要认证)

**请求体**:
```json
{
  "product_id": "xxx",
  "spec": "500ml",
  "quantity": 1
}
```

### PUT /api/orders/cart/:id
更新购物车项 (需要认证)

### DELETE /api/orders/cart/:id
删除购物车项 (需要认证)

---

## 订单接口

### GET /api/orders
订单列表 (需要认证)

### GET /api/orders/:id
订单详情 (需要认证)

### POST /api/orders
创建订单 (需要认证)

**请求体**:
```json
{
  "address_id": "xxx",
  "cart_item_ids": ["id1", "id2"],
  "coupon_id": "xxx",
  "note": "备注",
  "referrer_id": "xxx"
}
```

### PUT /api/orders/:id/cancel
取消订单 (需要认证)

### PUT /api/orders/:id/confirm
确认收货 (需要认证)

---

## 合伙人接口

### GET /api/partner/profile
合伙人信息 (需要认证)

### GET /api/partner/team
团队成员 (需要认证)

### POST /api/partner/apply
申请成为合伙人 (需要认证)

### GET /api/partner/income
收益明细 (需要认证)

### POST /api/partner/withdraw
申请提现 (需要认证)

### GET /api/partner/withdrawals
提现记录 (需要认证)

---

## 营销接口

### GET /api/coupons
可领取优惠券列表

### POST /api/coupons/:id/claim
领取优惠券 (需要认证)

### GET /api/my-coupons
我的优惠券 (需要认证)

### GET /api/flash-sales
秒杀活动列表

### GET /api/group-buys
团购活动列表

### GET /api/banners
轮播图列表

### GET /api/notifications
公告列表

---

## 地址接口

### GET /api/addresses
地址列表 (需要认证)

### POST /api/addresses
新增地址 (需要认证)

### PUT /api/addresses/:id
更新地址 (需要认证)

### DELETE /api/addresses/:id
删除地址 (需要认证)

---

## 后台管理接口

所有后台接口需要管理员权限，请求头需包含 `Authorization: Bearer <token>`

### GET /api/admin/dashboard
仪表盘数据

### 商品管理
- `GET /api/admin/products` - 商品列表
- `POST /api/admin/products` - 创建商品
- `PUT /api/admin/products/:id` - 更新商品
- `DELETE /api/admin/products/:id` - 删除商品

### 订单管理
- `GET /api/admin/orders` - 订单列表
- `PUT /api/admin/orders/:id/ship` - 发货

### 用户管理
- `GET /api/admin/users` - 用户列表
- `PUT /api/admin/users/:id/status` - 更新用户状态

### 合伙人管理
- `GET /api/admin/partners` - 合伙人列表
- `GET /api/admin/partner-applications` - 申请列表
- `PUT /api/admin/partner-applications/:id/review` - 审核申请

### 财务管理
- `GET /api/admin/withdrawals` - 提现列表
- `PUT /api/admin/withdrawals/:id/process` - 处理提现

### 分类管理
- `GET /api/admin/categories` - 分类列表
- `POST /api/admin/categories` - 创建分类

---

## 错误码说明

| 错误码 | 说明 |
|--------|------|
| UNAUTHORIZED | 未登录 |
| INVALID_TOKEN | Token 无效或过期 |
| USER_FROZEN | 用户已冻结 |
| NOT_FOUND | 资源不存在 |
| INVALID_PARAMS | 参数错误 |
| SERVER_ERROR | 服务器错误 |
| NETWORK_ERROR | 网络错误 |