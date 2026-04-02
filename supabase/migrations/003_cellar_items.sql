-- ===========================================
-- 酒窖管理表
-- ===========================================

-- 用户酒窖藏酒表
CREATE TABLE cellar_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) NOT NULL,
  product_name VARCHAR(200),
  product_image VARCHAR(500),
  vintage VARCHAR(20),  -- 年份
  quantity INT DEFAULT 1,
  purchase_price DECIMAL(10,2),  -- 购买价格
  purchase_date TIMESTAMP WITH TIME ZONE,  -- 购买/入库时间
  order_id UUID REFERENCES orders(id),  -- 关联订单
  note TEXT,  -- 备注
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_cellar_items_user_id ON cellar_items(user_id);
CREATE INDEX idx_cellar_items_product_id ON cellar_items(product_id);

-- RLS策略
ALTER TABLE cellar_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own cellar items" ON cellar_items
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own cellar items" ON cellar_items
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own cellar items" ON cellar_items
  FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own cellar items" ON cellar_items
  FOR DELETE USING (auth.uid()::text = user_id::text);

-- 创建触发器：自动更新 updated_at
CREATE TRIGGER update_cellar_items_updated_at
  BEFORE UPDATE ON cellar_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();