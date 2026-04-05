// ===========================================
// 订单相关
// ===========================================

// 订单类型
export enum OrderType {
  NORMAL = 'normal',
  FLASH_SALE = 'flash_sale',
  GROUP_BUY = 'group_buy',
}

// 订单类型显示文本
export const OrderTypeLabel: Record<OrderType, string> = {
  [OrderType.NORMAL]: '普通订单',
  [OrderType.FLASH_SALE]: '秒杀订单',
  [OrderType.GROUP_BUY]: '团购订单',
};

// 订单状态
export enum OrderStatus {
  PENDING_PAYMENT = 'pending_payment',
  PENDING_SHIPMENT = 'pending_shipment',
  SHIPPED = 'shipped',
  COMPLETED = 'completed',
  REFUNDING = 'refunding',
  CANCELLED = 'cancelled',
}

// 订单状态显示文本
export const OrderStatusLabel: Record<OrderStatus, string> = {
  [OrderStatus.PENDING_PAYMENT]: '待付款',
  [OrderStatus.PENDING_SHIPMENT]: '待发货',
  [OrderStatus.SHIPPED]: '已发货',
  [OrderStatus.COMPLETED]: '已完成',
  [OrderStatus.REFUNDING]: '退款/售后',
  [OrderStatus.CANCELLED]: '已取消',
};

// 售后状态
export enum AfterSalesStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

// 售后状态显示文本
export const AfterSalesStatusLabel: Record<AfterSalesStatus, string> = {
  [AfterSalesStatus.PENDING]: '处理中',
  [AfterSalesStatus.COMPLETED]: '已完成',
  [AfterSalesStatus.REJECTED]: '已拒绝',
  [AfterSalesStatus.CANCELLED]: '已取消',
};

// ===========================================
// 用户相关
// ===========================================

// 用户状态
export enum UserStatus {
  ACTIVE = 'active',
  FROZEN = 'frozen',
}

// 用户状态显示文本
export const UserStatusLabel: Record<UserStatus, string> = {
  [UserStatus.ACTIVE]: '正常',
  [UserStatus.FROZEN]: '冻结',
};

// 合伙人等级
export enum PartnerLevel {
  NONE = 'none',
  JUNIOR = 'junior',
  MIDDLE = 'middle',
  SENIOR = 'senior',
}

// 合伙人等级显示文本
export const PartnerLevelLabel: Record<PartnerLevel, string> = {
  [PartnerLevel.NONE]: '无',
  [PartnerLevel.JUNIOR]: '初级合伙人',
  [PartnerLevel.MIDDLE]: '中级合伙人',
  [PartnerLevel.SENIOR]: '高级合伙人',
};

// 合伙人激活状态
export enum PartnerActivationStatus {
  ACTIVATED = 'activated',
  PENDING = 'pending',
}

// 合伙人激活状态显示文本
export const PartnerActivationStatusLabel: Record<PartnerActivationStatus, string> = {
  [PartnerActivationStatus.ACTIVATED]: '已激活',
  [PartnerActivationStatus.PENDING]: '待激活',
};

// 收益类型
export enum IncomeType {
  REFERRAL_REWARD = 'referral_reward',
  SALES_COMMISSION = 'sales_commission',
  DIVIDEND = 'dividend',
}

// 收益类型显示文本
export const IncomeTypeLabel: Record<IncomeType, string> = {
  [IncomeType.REFERRAL_REWARD]: '推荐奖励',
  [IncomeType.SALES_COMMISSION]: '销售提成',
  [IncomeType.DIVIDEND]: '销售分红',
};

// 收益状态
export enum IncomeStatus {
  PENDING = 'pending',
  SETTLED = 'settled',
  COMPLETED = 'completed',
}

// 收益状态显示文本
export const IncomeStatusLabel: Record<IncomeStatus, string> = {
  [IncomeStatus.PENDING]: '待结算',
  [IncomeStatus.SETTLED]: '已结算',
  [IncomeStatus.COMPLETED]: '已完成',
};

// 性别
export enum Gender {
  MALE = '男',
  FEMALE = '女',
  SECRET = '保密',
}

// 性别选项
export const GenderOptions = [Gender.MALE, Gender.FEMALE, Gender.SECRET];

// ===========================================
// 商品相关
// ===========================================

// 商品状态
export enum ProductStatus {
  ON_SHELVES = 'on_shelves',
  OFF_SHELVES = 'off_shelves',
}

// 商品状态显示文本
export const ProductStatusLabel: Record<ProductStatus, string> = {
  [ProductStatus.ON_SHELVES]: '上架',
  [ProductStatus.OFF_SHELVES]: '下架',
};

// ===========================================
// 营销相关
// ===========================================

// 提现状态
export enum WithdrawalStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  REJECTED = 'rejected',
  FAILED = 'failed',
}

// 提现状态显示文本
export const WithdrawalStatusLabel: Record<WithdrawalStatus, string> = {
  [WithdrawalStatus.PENDING]: '处理中',
  [WithdrawalStatus.SUCCESS]: '成功',
  [WithdrawalStatus.REJECTED]: '审核拒绝',
  [WithdrawalStatus.FAILED]: '打款失败',
};

// 优惠券状态
export enum CouponStatus {
  DISTRIBUTING = 'distributing',
  ENDED = 'ended',
}

// 优惠券状态显示文本
export const CouponStatusLabel: Record<CouponStatus, string> = {
  [CouponStatus.DISTRIBUTING]: '发放中',
  [CouponStatus.ENDED]: '已结束',
};

// 用户优惠券状态
export enum UserCouponStatus {
  UNUSED = 'unused',
  USED = 'used',
  EXPIRED = 'expired',
}

// 用户优惠券状态显示文本
export const UserCouponStatusLabel: Record<UserCouponStatus, string> = {
  [UserCouponStatus.UNUSED]: '未使用',
  [UserCouponStatus.USED]: '已使用',
  [UserCouponStatus.EXPIRED]: '已过期',
};

// 营销活动状态
export enum CampaignStatus {
  NOT_STARTED = 'not_started',
  ONGOING = 'ongoing',
  ENDED = 'ended',
}

// 营销活动状态显示文本
export const CampaignStatusLabel: Record<CampaignStatus, string> = {
  [CampaignStatus.NOT_STARTED]: '未开始',
  [CampaignStatus.ONGOING]: '进行中',
  [CampaignStatus.ENDED]: '已结束',
};

// 拼团状态
export enum GroupBuyStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
}

// 拼团状态显示文本
export const GroupBuyStatusLabel: Record<GroupBuyStatus, string> = {
  [GroupBuyStatus.PENDING]: '拼团中',
  [GroupBuyStatus.SUCCESS]: '拼团成功',
  [GroupBuyStatus.FAILED]: '拼团失败',
};

// 秒杀状态
export enum FlashSaleStatus {
  NOT_STARTED = 'not_started',
  ONGOING = 'ongoing',
  ENDED = 'ended',
}

// 秒杀状态显示文本
export const FlashSaleStatusLabel: Record<FlashSaleStatus, string> = {
  [FlashSaleStatus.NOT_STARTED]: '未开始',
  [FlashSaleStatus.ONGOING]: '进行中',
  [FlashSaleStatus.ENDED]: '已结束',
};

// 合伙人礼包状态
export enum PartnerPackageStatus {
  ON_SHELVES = 'on_shelves',
  OFF_SHELVES = 'off_shelves',
}

// 合伙人礼包状态显示文本
export const PartnerPackageStatusLabel: Record<PartnerPackageStatus, string> = {
  [PartnerPackageStatus.ON_SHELVES]: '上架',
  [PartnerPackageStatus.OFF_SHELVES]: '下架',
};

// 审核状态
export enum AuditStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

// 审核状态显示文本
export const AuditStatusLabel: Record<AuditStatus, string> = {
  [AuditStatus.PENDING]: '待审核',
  [AuditStatus.APPROVED]: '已通过',
  [AuditStatus.REJECTED]: '已拒绝',
};

// 内容状态 (Banner, 公告, FAQ)
export enum ContentStatus {
  VISIBLE = 'visible',
  HIDDEN = 'hidden',
  PUBLISHED = 'published',
  DRAFT = 'draft',
}

// 内容状态显示文本
export const ContentStatusLabel: Record<ContentStatus, string> = {
  [ContentStatus.VISIBLE]: '显示中',
  [ContentStatus.HIDDEN]: '已隐藏',
  [ContentStatus.PUBLISHED]: '已发布',
  [ContentStatus.DRAFT]: '草稿',
};

// 打款状态 (已废弃，使用 WithdrawalStatus)
export enum PaymentStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
}
