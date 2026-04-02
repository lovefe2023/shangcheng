"""
购买流程侦察脚本 - 确定页面元素选择器
"""
from playwright.sync_api import sync_playwright
import os

SCREENSHOT_DIR = "D:/AI/shangcheng/test_screenshots/purchase_flow"
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(viewport={'width': 1280, 'height': 900})
    page = context.new_page()

    # 1. 登录页面
    print("=== 1. 登录页面 ===")
    page.goto('http://localhost:3000/login')
    page.wait_for_load_state('networkidle')
    page.screenshot(path=f"{SCREENSHOT_DIR}/01_login.png")

    # 查找登录表单元素
    inputs = page.locator('input').all()
    buttons = page.locator('button').all()
    print(f"输入框数量: {len(inputs)}")
    print(f"按钮数量: {len(buttons)}")

    for i, inp in enumerate(inputs):
        try:
            placeholder = inp.get_attribute('placeholder')
            type_attr = inp.get_attribute('type')
            name_attr = inp.get_attribute('name')
            print(f"  Input {i}: type={type_attr}, placeholder={placeholder}, name={name_attr}")
        except:
            pass

    for i, btn in enumerate(buttons):
        try:
            text = btn.text_content()
            print(f"  Button {i}: text={text}")
        except:
            pass

    # 执行登录
    print("\n执行登录...")
    page.fill('input[type="tel"], input[placeholder*="手机"], input[name="phone"]', '13800138001')
    page.fill('input[type="password"], input[placeholder*="密码"], input[name="password"]', '123456')
    page.click('button[type="submit"], button:has-text("登录")')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(2000)
    page.screenshot(path=f"{SCREENSHOT_DIR}/02_after_login.png")

    # 检查是否登录成功
    current_url = page.url
    print(f"登录后URL: {current_url}")

    # 保存登录状态
    context.storage_state(path=f"{SCREENSHOT_DIR}/auth_state.json")

    # 2. 商品列表页面
    print("\n=== 2. 商品列表页面 ===")
    page.goto('http://localhost:3000/products')
    page.wait_for_load_state('networkidle')
    page.screenshot(path=f"{SCREENSHOT_DIR}/03_products.png")

    # 查找商品卡片
    product_cards = page.locator('[class*="product"], [class*="card"], a[href*="/product/"]').all()
    print(f"商品卡片数量: {len(product_cards)}")

    # 获取第一个商品链接
    first_product = page.locator('a[href*="/product/"]').first
    if first_product.is_visible():
        product_href = first_product.get_attribute('href')
        print(f"第一个商品链接: {product_href}")

    # 3. 商品详情页面
    print("\n=== 3. 商品详情页面 ===")
    page.click('a[href*="/product/"].first')
    page.wait_for_load_state('networkidle')
    page.screenshot(path=f"{SCREENSHOT_DIR}/04_product_detail.png")

    # 查找加入购物车按钮
    buttons = page.locator('button').all()
    print(f"详情页按钮数量: {len(buttons)}")
    for i, btn in enumerate(buttons):
        try:
            text = btn.text_content()
            print(f"  Button {i}: text={text.strip()}")
        except:
            pass

    # 查找数量选择器
    inputs = page.locator('input').all()
    print(f"详情页输入框数量: {len(inputs)}")

    # 4. 购物车页面
    print("\n=== 4. 购物车页面 ===")
    page.goto('http://localhost:3000/cart')
    page.wait_for_load_state('networkidle')
    page.screenshot(path=f"{SCREENSHOT_DIR}/05_cart.png")

    cart_items = page.locator('[class*="cart-item"], [class*="item"]').all()
    print(f"购物车商品数量: {len(cart_items)}")

    # 查找结算按钮
    checkout_btn = page.locator('button:has-text("结算"), a:has-text("结算")')
    if checkout_btn.is_visible():
        print("结算按钮可见")

    # 5. 结算页面
    print("\n=== 5. 结算页面 ===")
    page.goto('http://localhost:3000/checkout')
    page.wait_for_load_state('networkidle')
    page.screenshot(path=f"{SCREENSHOT_DIR}/06_checkout.png")

    # 查找地址选择
    address_elements = page.locator('[class*="address"]').all()
    print(f"地址元素数量: {len(address_elements)}")

    # 查找提交订单按钮
    buttons = page.locator('button').all()
    for btn in buttons:
        try:
            text = btn.text_content()
            if '提交' in text or '支付' in text or '下单' in text:
                print(f"提交按钮: {text.strip()}")
        except:
            pass

    browser.close()
    print(f"\n截图保存至: {SCREENSHOT_DIR}")