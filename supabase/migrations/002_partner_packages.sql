-- ===========================================
-- 合伙人礼包表
-- ===========================================

CREATE TABLE partner_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  images TEXT[],
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2),
  includes JSONB NOT NULL,  -- 包含的商品列表 [{product_id, quantity}]
  benefits TEXT[],  -- 专属权益说明
  stock INT DEFAULT 999,
  sales INT DEFAULT 0,
  status VARCHAR(20) DEFAULT 'on_shelves' CHECK (status IN ('on_shelves', 'off_shelves')),
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_partner_packages_status ON partner_packages(status);
CREATE INDEX idx_partner_packages_sort_order ON partner_packages(sort_order);

-- RLS策略：所有人可查看上架礼包
ALTER TABLE partner_packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view on_shelves partner packages" ON partner_packages
  FOR SELECT USING (status = 'on_shelves');

-- 插入示例礼包数据
INSERT INTO partner_packages (id, name, description, images, price, original_price, includes, benefits, stock, sales, status, sort_order) VALUES
  ('55555555-5555-5555-5555-555555555001', '尊享酱香套餐', '飞天茅台53度500ml × 1 + 奔富MAX干红葡萄酒 × 2', ARRAY['https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?q=80&w=800&auto=format&fit=crop'], 3300.00, 4599.00, '[{"product_id": "22222222-2222-2222-2222-222222222001", "quantity": 1}, {"product_id": "22222222-2222-2222-2222-222222222003", "quantity": 2}]'::jsonb, ARRAY['高额推荐奖励', '平台分红池权益', '自购省钱特权'], 999, 1200, 'on_shelves', 1),
  ('55555555-5555-5555-5555-555555555002', '经典浓香套餐', '五粮液普五第八代52度 × 2 + 景德镇高端酒具套装 × 1', ARRAY['https://images.unsplash.com/photo-1596460107916-430662021049?q=80&w=800&auto=format&fit=crop'], 3500.00, 4899.00, '[{"product_id": "22222222-2222-2222-2222-222222222002", "quantity": 2}]'::jsonb, ARRAY['高额推荐奖励', '平台分红池权益', '一对一专属客服'], 999, 800, 'on_shelves', 2),
  ('55555555-5555-5555-5555-555555555003', '红酒品鉴套餐', '拉菲传奇波尔多红酒 × 6 + 进口水晶醒酒器 × 1', ARRAY['https://images.unsplash.com/photo-1585553616435-2dc0a54e271d?q=80&w=800&auto=format&fit=crop'], 3300.00, 4200.00, '[{"product_id": "22222222-2222-2222-2222-222222222006", "quantity": 6}]'::jsonb, ARRAY['高额推荐奖励', '平台分红池权益', '自购省钱特权'], 999, 500, 'on_shelves', 3);

-- 创建触发器：自动更新 updated_at
CREATE TRIGGER update_partner_packages_updated_at
  BEFORE UPDATE ON partner_packages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();