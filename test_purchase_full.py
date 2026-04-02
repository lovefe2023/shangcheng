"""
完整购买流程测试脚本
测试：登录 -> 商品列表 -> 商品详情 -> 加入购物车 -> 购物车 -> 结算 -> 提交订单
"""
from playwright.sync_api import sync_playwright
import os
import sys

# 设置输出编码
sys.stdout.reconfigure(encoding='utf-8')

SCREENSHOT_DIR = "D:/AI/shangcheng/test_screenshots/purchase_flow"
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

def take_screenshot(page, name):
    page.screenshot(path=f"{SCREENSHOT_DIR}/{name}")
    print(f"  Screenshot: {name}")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(viewport={'width': 1280, 'height': 900})
    page = context.new_page()

    page.set_default_timeout(15000)

    results = {
        "login": False,
        "products_list": False,
        "product_detail": False,
        "add_to_cart": False,
        "cart_view": False,
        "checkout": False,
        "order_submit": False
    }

    print("=" * 50)
    print("Purchase Flow Automation Test")
    print("=" * 50)

    # ==========================================
    # 1. Login
    # ==========================================
    print("\n[Step 1] Login")
    try:
        page.goto('http://localhost:3000/login', timeout=10000)
        page.wait_for_selector('input[type="tel"]', timeout=5000)
        take_screenshot(page, "01_login.png")

        page.fill('input[type="tel"]', '13800138001')
        page.fill('input[type="password"]', '123456')
        print("  Credentials entered")

        page.click('button:has-text("登录")')
        page.wait_for_timeout(2000)

        current_url = page.url
        if 'login' not in current_url:
            results["login"] = True
            print(f"  [PASS] Login success, redirected to: {current_url}")
        else:
            print(f"  [FAIL] Login failed, still at: {current_url}")

        take_screenshot(page, "02_after_login.png")
        context.storage_state(path=f"{SCREENSHOT_DIR}/auth_state.json")

    except Exception as e:
        print(f"  [FAIL] Login error: {e}")
        take_screenshot(page, "01_login_error.png")

    # ==========================================
    # 2. Products List
    # ==========================================
    print("\n[Step 2] Products List")
    try:
        page.goto('http://localhost:3000/products', timeout=10000)
        page.wait_for_selector('a[href*="/product/"]', timeout=8000)
        take_screenshot(page, "03_products.png")

        products = page.locator('a[href*="/product/"]').all()
        product_count = len(products)
        print(f"  Products found: {product_count}")

        if product_count > 0:
            results["products_list"] = True
            print("  [PASS] Products list loaded")
            first_product_href = products[0].get_attribute('href')
            print(f"  First product: {first_product_href}")
        else:
            print("  [FAIL] No products found")

    except Exception as e:
        print(f"  [FAIL] Products list error: {e}")
        take_screenshot(page, "03_products_error.png")

    # ==========================================
    # 3. Product Detail & Add to Cart
    # ==========================================
    print("\n[Step 3] Product Detail & Add to Cart")
    try:
        # Try first product from list
        products = page.locator('a[href*="/product/"]').all()
        if len(products) > 0:
            products[0].click()
        else:
            page.goto('http://localhost:3000/products', timeout=10000)
            page.wait_for_selector('a[href*="/product/"]', timeout=5000)
            page.locator('a[href*="/product/"]').first.click()

        page.wait_for_timeout(2000)
        take_screenshot(page, "04_product_detail.png")

        # Find and click add to cart button
        add_cart_btn = page.locator('button:has-text("加入购物车"), button:has-text("加购"), button:has-text("购买")')
        if add_cart_btn.count() > 0:
            add_cart_btn.first.click()
            page.wait_for_timeout(1500)
            results["product_detail"] = True
            results["add_to_cart"] = True
            print("  [PASS] Added to cart")
        else:
            # Try any button with cart-related text
            buttons = page.locator('button').all()
            for btn in buttons:
                text = btn.text_content() or ""
                if '购物车' in text or '购买' in text or '加' in text:
                    btn.click()
                    page.wait_for_timeout(1500)
                    results["add_to_cart"] = True
                    print(f"  [PASS] Clicked: {text}")
                    break

            if not results["add_to_cart"]:
                print("  [WARN] No add-to-cart button found")

        take_screenshot(page, "05_after_add_cart.png")

    except Exception as e:
        print(f"  [FAIL] Product detail error: {e}")
        take_screenshot(page, "04_product_detail_error.png")

    # ==========================================
    # 4. Cart Page
    # ==========================================
    print("\n[Step 4] Cart Page")
    try:
        page.goto('http://localhost:3000/cart', timeout=10000)
        page.wait_for_timeout(2000)
        take_screenshot(page, "06_cart.png")

        # Check for cart items
        checkboxes = page.locator('input[type="checkbox"]').count()
        images = page.locator('img').count()

        if checkboxes > 0 or images > 3:
            results["cart_view"] = True
            print(f"  [PASS] Cart has items (checkboxes: {checkboxes}, images: {images})")

            checkout_btn = page.locator('button:has-text("结算"), a:has-text("结算")')
            if checkout_btn.count() > 0:
                print("  Checkout button found")
        else:
            print("  [WARN] Cart appears empty")

        take_screenshot(page, "06_cart_content.png")

    except Exception as e:
        print(f"  [FAIL] Cart error: {e}")
        take_screenshot(page, "06_cart_error.png")

    # ==========================================
    # 5. Checkout Page
    # ==========================================
    print("\n[Step 5] Checkout Page")
    try:
        page.goto('http://localhost:3000/checkout', timeout=10000)
        page.wait_for_timeout(2000)
        take_screenshot(page, "07_checkout.png")

        submit_btn = page.locator('button:has-text("提交"), button:has-text("下单"), button:has-text("支付")')
        if submit_btn.count() > 0:
            is_disabled = submit_btn.first.is_disabled()
            if is_disabled:
                print("  [WARN] Submit button disabled (missing address?)")
            else:
                results["checkout"] = True
                print("  [PASS] Checkout page loaded, button enabled")
        else:
            print("  [WARN] No submit button found")

        take_screenshot(page, "07_checkout_detail.png")

    except Exception as e:
        print(f"  [FAIL] Checkout error: {e}")
        take_screenshot(page, "07_checkout_error.png")

    # ==========================================
    # 6. Address Management
    # ==========================================
    print("\n[Step 6] Address Management")
    try:
        page.goto('http://localhost:3000/addresses', timeout=10000)
        page.wait_for_timeout(2000)
        take_screenshot(page, "08_addresses.png")

        # Check for existing addresses
        page_content = page.content()
        has_address = '地址' in page_content and ('修改' in page_content or '删除' in page_content or '默认' in page_content)

        if not has_address:
            print("  No address found, adding new one...")

            add_btn = page.locator('button:has-text("添加"), a:has-text("添加"), button:has-text("新增")')
            if add_btn.count() > 0:
                add_btn.first.click()
                page.wait_for_timeout(1000)

                # Fill address form
                text_inputs = page.locator('input[type="text"], input:not([type="checkbox"]):not([type="radio"])').all()

                placeholders = []
                for inp in text_inputs:
                    ph = inp.get_attribute('placeholder') or ''
                    placeholders.append(ph)

                print(f"  Input placeholders: {placeholders}")

                # Try to fill common address fields
                for inp in text_inputs:
                    ph = inp.get_attribute('placeholder') or ''
                    if '姓名' in ph or '名字' in ph:
                        inp.fill('测试用户')
                    elif '电话' in ph or '手机' in ph:
                        inp.fill('13900139000')
                    elif '省' in ph:
                        inp.fill('广东省')
                    elif '市' in ph:
                        inp.fill('深圳市')
                    elif '区' in ph or '县' in ph:
                        inp.fill('南山区')
                    elif '详细' in ph or '地址' in ph:
                        inp.fill('科技园路1号')

                save_btn = page.locator('button:has-text("保存"), button:has-text("确定"), button:has-text("提交")')
                if save_btn.count() > 0:
                    save_btn.first.click()
                    page.wait_for_timeout(1500)
                    print("  [PASS] Address saved")
        else:
            print("  [PASS] Address already exists")

        take_screenshot(page, "08_addresses_after.png")

    except Exception as e:
        print(f"  [FAIL] Address error: {e}")

    # ==========================================
    # 7. Submit Order
    # ==========================================
    print("\n[Step 7] Submit Order")
    try:
        page.goto('http://localhost:3000/checkout', timeout=10000)
        page.wait_for_timeout(2000)

        # Select address if needed
        address_radio = page.locator('input[type="radio"]')
        if address_radio.count() > 0:
            address_radio.first.click()
            page.wait_for_timeout(500)
            print("  Address selected")

        take_screenshot(page, "09_checkout_ready.png")

        submit_btn = page.locator('button:has-text("提交"), button:has-text("下单")')
        if submit_btn.count() > 0:
            is_disabled = submit_btn.first.is_disabled()

            if not is_disabled:
                submit_btn.first.click()
                page.wait_for_timeout(3000)

                current_url = page.url
                if 'payment' in current_url or 'order' in current_url:
                    results["order_submit"] = True
                    print(f"  [PASS] Order submitted, redirected to: {current_url}")
                else:
                    print(f"  Current URL: {current_url}")

                take_screenshot(page, "09_order_result.png")
            else:
                print("  [FAIL] Submit button still disabled")
                # Check what's missing
                page_content = page.content()
                if '地址' in page_content:
                    print("  Debug: Address section present")
                if '商品' in page_content:
                    print("  Debug: Products present")
        else:
            print("  [FAIL] No submit button")

    except Exception as e:
        print(f"  [FAIL] Order submit error: {e}")
        take_screenshot(page, "09_order_error.png")

    # ==========================================
    # Results Summary
    # ==========================================
    print("\n" + "=" * 50)
    print("Test Results Summary")
    print("=" * 50)

    total = len(results)
    passed = sum(1 for v in results.values() if v)

    for step, status in results.items():
        icon = "[PASS]" if status else "[FAIL]"
        print(f"  {icon} {step}")

    print(f"\nPass rate: {passed}/{total} ({passed*100//total}%)")
    print(f"Screenshots: {SCREENSHOT_DIR}")

    browser.close()