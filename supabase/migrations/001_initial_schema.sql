-- ===========================================
-- 商城系统数据库初始化脚本
-- ===========================================

-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- 1. 用户相关表
-- ===========================================

-- 用户表
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(20) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  name VARCHAR(100),
  avatar VARCHAR(500),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'frozen')),
  is_partner BOOLEAN DEFAULT false,
  partner_level VARCHAR(20) DEFAULT 'none' CHECK (partner_level IN ('none', 'junior', 'middle', 'senior')),
  referrer_id UUID REFERENCES users(id),
  invite_code VARCHAR(20) UNIQUE,
  balance DECIMAL(10,2) DEFAULT 0,
  total_income DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建用户表索引
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_referrer_id ON users(referrer_id);
CREATE INDEX idx_users_invite_code ON users(invite_code);

-- 地址表
CREATE TABLE addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  province VARCHAR(50),
  city VARCHAR(50),
  district VARCHAR(50),
  detail VARCHAR(500),
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建地址表索引
CREATE INDEX idx_addresses_user_id ON addresses(user_id);

-- ===========================================
-- 2. 商品相关表
-- ===========================================

-- 分类表
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  parent_id UUID REFERENCES categories(id),
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建分类表索引
CREATE INDEX idx_categories_parent_id ON categories(parent_id);

-- 商品表
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  images TEXT[],
  category_id UUID REFERENCES categories(id),
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2),
  stock INT DEFAULT 0,
  sales INT DEFAULT 0,
  status VARCHAR(20) DEFAULT 'on_shelves' CHECK (status IN ('on_shelves', 'off_shelves')),
  specs JSONB,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建商品表索引
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_name ON products USING gin(to_tsvector('simple', name));

-- ===========================================
-- 3. 订单相关表
-- ===========================================

-- 购物车表
CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) NOT NULL,
  spec VARCHAR(100),
  quantity INT DEFAULT 1,
  selected BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建购物车表索引
CREATE INDEX idx_cart_items_user_id ON cart_items(user_id);

-- 订单表
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_no VARCHAR(50) UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id) NOT NULL,
  type VARCHAR(20) DEFAULT 'normal' CHECK (type IN ('normal', 'flash_sale', 'group_buy')),
  status VARCHAR(30) DEFAULT 'pending_payment' CHECK (status IN (
    'pending_payment', 'pending_shipment', 'shipped', 'completed', 'refunding', 'cancelled'
  )),
  total_amount DECIMAL(10,2) NOT NULL,
  paid_amount DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  payment_method VARCHAR(20),
  payment_time TIMESTAMP WITH TIME ZONE,
  address_snapshot JSONB,
  referrer_id UUID REFERENCES users(id),
  sales_commission DECIMAL(10,2) DEFAULT 0,
  dividend_pool DECIMAL(10,2) DEFAULT 0,
  note TEXT,
  logistics_company VARCHAR(100),
  logistics_no VARCHAR(100),
  shipped_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建订单表索引
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_order_no ON orders(order_no);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_referrer_id ON orders(referrer_id);
CREATE INDEX idx_orders_created_at ON orders(created_at);

-- 订单商品表
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) NOT NULL,
  product_name VARCHAR(200),
  product_image VARCHAR(500),
  spec VARCHAR(100),
  price DECIMAL(10,2) NOT NULL,
  quantity INT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建订单商品表索引
CREATE INDEX idx_order_items_order_id ON order_items(order_id);

-- ===========================================
-- 4. 合伙人相关表
-- ===========================================

-- 合伙人申请表
CREATE TABLE partner_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  level VARCHAR(20) DEFAULT 'junior' CHECK (level IN ('junior', 'middle', 'senior')),
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewer_id UUID REFERENCES users(id),
  note TEXT
);

-- 创建合伙人申请表索引
CREATE INDEX idx_partner_applications_user_id ON partner_applications(user_id);
CREATE INDEX idx_partner_applications_status ON partner_applications(status);

-- 收益记录表
CREATE TABLE income_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('referral_reward', 'sales_commission', 'dividend')),
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'settled', 'completed')),
  order_id UUID REFERENCES orders(id),
  source_user_id UUID REFERENCES users(id),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建收益记录表索引
CREATE INDEX idx_income_records_user_id ON income_records(user_id);
CREATE INDEX idx_income_records_type ON income_records(type);
CREATE INDEX idx_income_records_status ON income_records(status);

-- 提现表
CREATE TABLE withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  withdrawal_no VARCHAR(50) UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  fee DECIMAL(10,2) NOT NULL,
  actual_amount DECIMAL(10,2) NOT NULL,
  method VARCHAR(20) NOT NULL CHECK (method IN ('bank', 'wechat', 'alipay')),
  account_info JSONB,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'rejected', 'failed')),
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- 创建提现表索引
CREATE INDEX idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX idx_withdrawals_status ON withdrawals(status);

-- ===========================================
-- 5. 营销相关表
-- ===========================================

-- 优惠券模板表
CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('discount', 'full_reduction')),
  discount_amount DECIMAL(10,2),
  min_amount DECIMAL(10,2) DEFAULT 0,
  total_count INT NOT NULL,
  used_count INT DEFAULT 0,
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) DEFAULT 'distributing' CHECK (status IN ('distributing', 'ended')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 用户优惠券表
CREATE TABLE user_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  coupon_id UUID REFERENCES coupons(id) NOT NULL,
  status VARCHAR(20) DEFAULT 'unused' CHECK (status IN ('unused', 'used', 'expired')),
  used_at TIMESTAMP WITH TIME ZONE,
  order_id UUID REFERENCES orders(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建用户优惠券表索引
CREATE INDEX idx_user_coupons_user_id ON user_coupons(user_id);
CREATE INDEX idx_user_coupons_status ON user_coupons(status);

-- 秒杀活动表
CREATE TABLE flash_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) NOT NULL,
  flash_price DECIMAL(10,2) NOT NULL,
  stock INT NOT NULL,
  sold_count INT DEFAULT 0,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(20) DEFAULT 'not_started' CHECK (status IN ('not_started', 'ongoing', 'ended')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建秒杀活动表索引
CREATE INDEX idx_flash_sales_product_id ON flash_sales(product_id);
CREATE INDEX idx_flash_sales_status ON flash_sales(status);

-- 团购活动表
CREATE TABLE group_buys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) NOT NULL,
  group_price DECIMAL(10,2) NOT NULL,
  min_quantity INT NOT NULL,
  max_quantity INT,
  current_quantity INT DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建团购活动表索引
CREATE INDEX idx_group_buys_product_id ON group_buys(product_id);
CREATE INDEX idx_group_buys_status ON group_buys(status);

-- ===========================================
-- 6. 系统相关表
-- ===========================================

-- 轮播图表
CREATE TABLE banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(100),
  image_url VARCHAR(500) NOT NULL,
  link_url VARCHAR(500),
  sort_order INT DEFAULT 0,
  status VARCHAR(20) DEFAULT 'visible' CHECK (status IN ('visible', 'hidden')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 公告表
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  content TEXT,
  type VARCHAR(20) DEFAULT 'announcement' CHECK (type IN ('announcement', 'notice', 'faq')),
  status VARCHAR(20) DEFAULT 'published' CHECK (status IN ('published', 'draft')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 系统设置表
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT,
  description VARCHAR(500),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- 7. Row Level Security (RLS) 策略
-- ===========================================

-- 启用 RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE income_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_coupons ENABLE ROW LEVEL SECURITY;

-- 用户表策略
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid()::text = id::text);

-- 地址表策略
CREATE POLICY "Users can view own addresses" ON addresses
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own addresses" ON addresses
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own addresses" ON addresses
  FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own addresses" ON addresses
  FOR DELETE USING (auth.uid()::text = user_id::text);

-- 购物车策略
CREATE POLICY "Users can view own cart" ON cart_items
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own cart items" ON cart_items
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own cart items" ON cart_items
  FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own cart items" ON cart_items
  FOR DELETE USING (auth.uid()::text = user_id::text);

-- 订单策略
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own orders" ON orders
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- 订单商品策略
CREATE POLICY "Users can view own order items" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id::text = auth.uid()::text
    )
  );

-- 收益记录策略
CREATE POLICY "Users can view own income records" ON income_records
  FOR SELECT USING (auth.uid()::text = user_id::text);

-- 提现策略
CREATE POLICY "Users can view own withdrawals" ON withdrawals
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own withdrawals" ON withdrawals
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- 用户优惠券策略
CREATE POLICY "Users can view own coupons" ON user_coupons
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own coupons" ON user_coupons
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- ===========================================
-- 8. 公开访问策略（无需认证）
-- ===========================================

-- 商品表：允许所有人查看上架商品
CREATE POLICY "Anyone can view on-shelves products" ON products
  FOR SELECT USING (status = 'on_shelves');

-- 分类表：允许所有人查看
CREATE POLICY "Anyone can view categories" ON categories
  FOR SELECT USING (true);

-- 优惠券表：允许所有人查看发放中的优惠券
CREATE POLICY "Anyone can view distributing coupons" ON coupons
  FOR SELECT USING (status = 'distributing');

-- 秒杀活动：允许所有人查看
CREATE POLICY "Anyone can view flash sales" ON flash_sales
  FOR SELECT USING (true);

-- 团购活动：允许所有人查看
CREATE POLICY "Anyone can view group buys" ON group_buys
  FOR SELECT USING (true);

-- 轮播图：允许所有人查看可见的
CREATE POLICY "Anyone can view visible banners" ON banners
  FOR SELECT USING (status = 'visible');

-- 公告：允许所有人查看已发布的
CREATE POLICY "Anyone can view published notifications" ON notifications
  FOR SELECT USING (status = 'published');

-- ===========================================
-- 9. 触发器：自动更新 updated_at
-- ===========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 用户表
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 商品表
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 订单表
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- 10. 初始数据
-- ===========================================

-- 插入默认分类
INSERT INTO categories (id, name, sort_order) VALUES
  ('11111111-1111-1111-1111-111111111001', '白酒', 1),
  ('11111111-1111-1111-1111-111111111002', '红酒', 2),
  ('11111111-1111-1111-1111-111111111003', '洋酒', 3),
  ('11111111-1111-1111-1111-111111111004', '养生酒', 4);

-- 插入二级分类
INSERT INTO categories (id, name, parent_id, sort_order) VALUES
  ('11111111-1111-1111-1111-111111111101', '酱香型', '11111111-1111-1111-1111-111111111001', 1),
  ('11111111-1111-1111-1111-111111111102', '浓香型', '11111111-1111-1111-1111-111111111001', 2),
  ('11111111-1111-1111-1111-111111111103', '清香型', '11111111-1111-1111-1111-111111111001', 3),
  ('11111111-1111-1111-1111-111111111201', '干红', '11111111-1111-1111-1111-111111111002', 1),
  ('11111111-1111-1111-1111-111111111202', '干白', '11111111-1111-1111-1111-111111111002', 2);

-- 插入示例商品
INSERT INTO products (id, name, description, images, category_id, price, original_price, stock, sales, status, tags) VALUES
  ('22222222-2222-2222-2222-222222222001', '飞天茅台 53度 500ml 酱香型白酒', '茅台酒独产于中国贵州省遵义市仁怀市茅台镇，是与苏格兰威士忌、法国科涅克白兰地齐名的世界三大蒸馏名酒之一。其酒体微黄透明，酱香突出，幽雅细腻，酒体醇厚，回味悠长。', ARRAY['https://images.unsplash.com/photo-1514228742587-6b1558fcca3d'], '11111111-1111-1111-1111-111111111101', 2999.00, 3299.00, 156, 1205, 'on_shelves', ARRAY['热卖', '秒杀']),
  ('22222222-2222-2222-2222-222222222002', '五粮液 普五第八代 52度 浓香型', '五粮液是中国最著名的白酒品牌之一，以高粱、大米、糯米、小麦和玉米五种粮食为原料，采用传统工艺酿造而成。', ARRAY['https://images.unsplash.com/photo-1596460107916-430662021049'], '11111111-1111-1111-1111-111111111102', 1099.00, 1499.00, 342, 890, 'on_shelves', ARRAY['团购']),
  ('22222222-2222-2222-2222-222222222003', '奔富 MAX 麦克斯 干红葡萄酒', '澳洲原瓶进口，果香浓郁，口感醇厚，是入门级红酒的绝佳选择。', ARRAY['https://images.unsplash.com/photo-1585553616435-2dc0a54e271d'], '11111111-1111-1111-1111-111111111201', 288.00, 399.00, 56, 432, 'on_shelves', ARRAY[]::TEXT[]),
  ('22222222-2222-2222-2222-222222222004', '人参枸杞养生酒 500ml 礼盒装', '精选人参、枸杞等名贵中药材，采用传统工艺泡制，具有滋补养生的功效。', ARRAY['https://images.unsplash.com/photo-1569529465841-dfecdab7503b'], '11111111-1111-1111-1111-111111111004', 299.00, 399.00, 200, 5800, 'on_shelves', ARRAY[]::TEXT[]),
  ('22222222-2222-2222-2222-222222222005', '洋河蓝色经典 海之蓝 52度', '洋河蓝色经典系列，绵柔型白酒代表，入口柔顺，回味甘甜。', ARRAY['https://images.unsplash.com/photo-1568213816046-0ee1c42bd559'], '11111111-1111-1111-1111-111111111102', 188.00, 228.00, 500, 2000, 'on_shelves', ARRAY['满减', '包邮']),
  ('22222222-2222-2222-2222-222222222006', '拉菲传奇 波尔多AOC 干红', '法国波尔多产区优质干红葡萄酒，果香浓郁，单宁柔顺。', ARRAY['https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb'], '11111111-1111-1111-1111-111111111201', 128.00, 168.00, 300, 1500, 'on_shelves', ARRAY['热销', '包邮']),
  ('22222222-2222-2222-2222-222222222007', '汾酒 青花20 清香型 53度', '汾酒是中国清香型白酒的典型代表，青花系列是其高端产品线。', ARRAY['https://images.unsplash.com/photo-1569529465841-dfecdab7503b'], '11111111-1111-1111-1111-111111111103', 498.00, 568.00, 180, 650, 'on_shelves', ARRAY['新品', '满赠']),
  ('22222222-2222-2222-2222-222222222008', '马爹利 名士 干邑白兰地', '马爹利是法国著名的干邑白兰地品牌，名士系列是其入门级产品。', ARRAY['https://images.unsplash.com/photo-1596460107916-430662021049'], '11111111-1111-1111-1111-111111111003', 658.00, 798.00, 80, 320, 'on_shelves', ARRAY['包邮']);

-- 插入轮播图
INSERT INTO banners (id, title, image_url, link_url, sort_order, status) VALUES
  ('33333333-3333-3333-3333-333333333001', '名酒品鉴季', 'https://images.unsplash.com/photo-1568213816046-0ee1c42bd559', '/products', 1, 'visible'),
  ('33333333-3333-3333-3333-333333333002', '新人专享', 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d', '/coupons', 2, 'visible');

-- 插入优惠券
INSERT INTO coupons (id, name, type, discount_amount, min_amount, total_count, status) VALUES
  ('44444444-4444-4444-4444-444444444001', '新人专享券', 'full_reduction', 50.00, 500.00, 1000, 'distributing'),
  ('44444444-4444-4444-4444-444444444002', '名酒品鉴满减券', 'full_reduction', 200.00, 2000.00, 500, 'distributing'),
  ('44444444-4444-4444-4444-444444444003', '无门槛立减券', 'discount', 20.00, 0.00, 2000, 'distributing');

-- 插入系统设置
INSERT INTO settings (key, value, description) VALUES
  ('site_name', '名酒商城', '网站名称'),
  ('withdrawal_fee_rate', '0.003', '提现手续费费率'),
  ('partner_commission_junior', '0.05', '初级合伙人佣金比例'),
  ('partner_commission_middle', '0.10', '中级合伙人佣金比例'),
  ('partner_commission_senior', '0.15', '高级合伙人佣金比例');