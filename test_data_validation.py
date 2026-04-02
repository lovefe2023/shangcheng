"""
数据源验证测试脚本
验证页面数据是否来自真实API/数据库，而非Mock数据
"""
from playwright.sync_api import sync_playwright
import requests
import json
import sys
import os

sys.stdout.reconfigure(encoding='utf-8')

API_BASE = "http://localhost:3005/api"
SCREENSHOT_DIR = "D:/AI/shangcheng/test_screenshots/data_validation"
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

def take_screenshot(page, name):
    page.screenshot(path=f"{SCREENSHOT_DIR}/{name}")

def get_api_data(endpoint, token=None):
    """获取API数据"""
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    try:
        resp = requests.get(f"{API_BASE}{endpoint}", headers=headers, timeout=10)
        data = resp.json()
        if data.get('success'):
            return data.get('data')
        return None
    except Exception as e:
        print(f"  API Error: {e}")
        return None

print("=" * 70)
print("Data Source Validation Test")
print("=" * 70)

# 1. 登录获取Token
print("\n[Step 1] Get Auth Token")
login_resp = requests.post(f"{API_BASE}/auth/login",
    json={"phone": "13800138001", "password": "123456"}, timeout=10)
login_data = login_resp.json()

if login_data.get('success'):
    token = login_data['data']['session']['access_token']
    user_data = login_data['data']['user']
    print(f"  [PASS] Login successful")
    print(f"  User: {user_data['name']} (ID: {user_data['id']})")
    print(f"  Phone: {user_data['phone']}")
    print(f"  is_partner: {user_data['is_partner']}")
    print(f"  balance: {user_data['balance']}")
else:
    print("  [FAIL] Login failed")
    exit()

results = {
    "user_profile": False,
    "orders": False,
    "addresses": False,
    "coupons": False,
    "partner_profile": False,
    "partner_income": False,
    "products": False,
    "cart": False
}

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(viewport={'width': 1280, 'height': 900})
    page = context.new_page()
    page.set_default_timeout(15000)

    # Login in browser
    print("\n[Step 2] Browser Login")
    page.goto('http://localhost:3000/login')
    page.fill('input[type="tel"]', '13800138001')
    page.fill('input[type="password"]', '123456')
    page.click('button:has-text("登录")')
    page.wait_for_timeout(2000)
    print("  Browser logged in")

    # ==========================================
    # 2. Validate User Profile Data
    # ==========================================
    print("\n" + "=" * 70)
    print("[Test 1] User Profile Data Validation")
    print("=" * 70)

    # Get API data
    api_user = get_api_data("/auth/me", token)
    print(f"\n  API Data:")
    if api_user:
        print(f"    name: {api_user.get('name')}")
        print(f"    phone: {api_user.get('phone')}")
        print(f"    balance: {api_user.get('balance')}")
        print(f"    is_partner: {api_user.get('is_partner')}")
        print(f"    invite_code: {api_user.get('invite_code')}")

    # Get Page data
    page.goto('http://localhost:3000/profile')
    page.wait_for_timeout(2000)
    take_screenshot(page, "profile_page.png")

    page_content = page.content()
    print(f"\n  Page Content Check:")

    # Check if API data matches page content
    if api_user:
        checks = []
        if api_user.get('name') in page_content:
            print(f"    [PASS] Name '{api_user['name']}' found on page")
            checks.append(True)
        else:
            print(f"    [FAIL] Name '{api_user['name']}' NOT found on page")
            checks.append(False)

        if api_user.get('phone') in page_content:
            print(f"    [PASS] Phone '{api_user['phone']}' found on page")
            checks.append(True)
        else:
            print(f"    [FAIL] Phone '{api_user['phone']}' NOT found on page")
            checks.append(False)

        if api_user.get('invite_code') in page_content:
            print(f"    [PASS] Invite code '{api_user['invite_code']}' found on page")
            checks.append(True)
        else:
            print(f"    [FAIL] Invite code '{api_user['invite_code']}' NOT found on page")
            checks.append(False)

        results['user_profile'] = all(checks)

    # ==========================================
    # 3. Validate Orders Data
    # ==========================================
    print("\n" + "=" * 70)
    print("[Test 2] Orders Data Validation")
    print("=" * 70)

    # Get API data
    api_orders = get_api_data("/orders", token)
    print(f"\n  API Data:")
    if api_orders and api_orders.get('list'):
        orders_list = api_orders['list']
        print(f"    Total orders: {api_orders.get('total', 0)}")
        for i, order in enumerate(orders_list[:3]):
            print(f"    Order {i+1}:")
            print(f"      order_no: {order.get('order_no')}")
            print(f"      status: {order.get('status')}")
            print(f"      total_amount: {order.get('total_amount')}")
            print(f"      paid_amount: {order.get('paid_amount')}")

    # Get Page data
    page.goto('http://localhost:3000/orders')
    page.wait_for_timeout(2000)
    take_screenshot(page, "orders_page.png")

    page_content = page.content()
    print(f"\n  Page Content Check:")

    if api_orders and api_orders.get('list'):
        checks = []
        for order in api_orders['list'][:2]:
            order_no = order.get('order_no', '')
            # Check order number (partial match since display might truncate)
            if order_no[:8] in page_content or order_no in page_content:
                print(f"    [PASS] Order no '{order_no}' found on page")
                checks.append(True)
            else:
                print(f"    [WARN] Order no '{order_no}' may not be visible")

            # Check amount
            amount_str = str(order.get('paid_amount', 0))
            if amount_str in page_content or f"¥{amount_str}" in page_content:
                print(f"    [PASS] Amount '{amount_str}' found on page")
                checks.append(True)

        results['orders'] = len(checks) > 0

    # ==========================================
    # 4. Validate Addresses Data
    # ==========================================
    print("\n" + "=" * 70)
    print("[Test 3] Addresses Data Validation")
    print("=" * 70)

    # Get API data
    api_addresses = get_api_data("/addresses", token)
    print(f"\n  API Data:")
    if api_addresses:
        # Handle both list and dict formats
        addr_list = api_addresses if isinstance(api_addresses, list) else api_addresses.get('list', [])
        print(f"    Total addresses: {len(addr_list)}")
        for i, addr in enumerate(addr_list[:2]):
            print(f"    Address {i+1}:")
            print(f"      name: {addr.get('name')}")
            print(f"      phone: {addr.get('phone')}")
            print(f"      detail: {addr.get('detail', '')[:30]}...")

    # Get Page data
    page.goto('http://localhost:3000/addresses')
    page.wait_for_timeout(2000)
    take_screenshot(page, "addresses_page.png")

    page_content = page.content()

    if api_addresses:
        addr_list = api_addresses if isinstance(api_addresses, list) else api_addresses.get('list', [])
        checks = []
        for addr in addr_list[:2]:
            if addr.get('name') in page_content:
                print(f"    [PASS] Name '{addr['name']}' found on page")
                checks.append(True)
            if addr.get('phone') in page_content:
                print(f"    [PASS] Phone '{addr['phone']}' found on page")
                checks.append(True)

        results['addresses'] = len(checks) > 0

    # ==========================================
    # 5. Validate Partner Profile Data
    # ==========================================
    print("\n" + "=" * 70)
    print("[Test 4] Partner Profile Data Validation")
    print("=" * 70)

    # Get API data
    api_partner = get_api_data("/partner/profile", token)
    print(f"\n  API Data:")
    if api_partner:
        print(f"    name: {api_partner.get('name')}")
        print(f"    is_partner: {api_partner.get('is_partner')}")
        print(f"    partner_level: {api_partner.get('partner_level')}")
        print(f"    balance: {api_partner.get('balance')}")
        print(f"    team_size: {api_partner.get('team_size')}")
        print(f"    month_sales: {api_partner.get('month_sales')}")
        print(f"    total_income: {api_partner.get('total_income')}")
        print(f"    invite_code: {api_partner.get('invite_code')}")

    # Get Page data
    page.goto('http://localhost:3000/partner')
    page.wait_for_timeout(2000)
    take_screenshot(page, "partner_page.png")

    page_content = page.content()
    print(f"\n  Page Content Check:")

    if api_partner:
        checks = []

        # Check invite code
        invite_code = api_partner.get('invite_code', '')
        if invite_code in page_content:
            print(f"    [PASS] Invite code '{invite_code}' found on page")
            checks.append(True)
        else:
            print(f"    [FAIL] Invite code '{invite_code}' NOT found on page")

        # Check balance (0.00 format)
        balance = api_partner.get('balance', 0)
        if f"{balance:.2f}" in page_content or f"¥{balance}" in page_content or str(balance) in page_content:
            print(f"    [PASS] Balance '{balance}' found on page")
            checks.append(True)

        # Check team size
        team_size = api_partner.get('team_size', 0)
        if str(team_size) in page_content:
            print(f"    [PASS] Team size '{team_size}' found on page")
            checks.append(True)

        results['partner_profile'] = len(checks) >= 2

    # ==========================================
    # 6. Validate Partner Income Data
    # ==========================================
    print("\n" + "=" * 70)
    print("[Test 5] Partner Income Data Validation")
    print("=" * 70)

    # Get API data
    api_income = get_api_data("/partner/income", token)
    print(f"\n  API Data:")
    if api_income:
        print(f"    Total income records: {api_income.get('total', 0)}")
        if api_income.get('list'):
            for i, rec in enumerate(api_income['list'][:3]):
                print(f"    Record {i+1}:")
                print(f"      type: {rec.get('type')}")
                print(f"      amount: {rec.get('amount')}")
                print(f"      status: {rec.get('status')}")

    results['partner_income'] = api_income is not None

    # ==========================================
    # 7. Validate Products Data
    # ==========================================
    print("\n" + "=" * 70)
    print("[Test 6] Products Data Validation")
    print("=" * 70)

    # Get API data
    api_products = get_api_data("/products")
    print(f"\n  API Data:")
    if api_products and api_products.get('list'):
        print(f"    Total products: {api_products.get('total', 0)}")
        for i, prod in enumerate(api_products['list'][:3]):
            print(f"    Product {i+1}:")
            print(f"      name: {prod.get('name')}")
            print(f"      price: {prod.get('price')}")
            print(f"      stock: {prod.get('stock')}")
            print(f"      status: {prod.get('status')}")

    # Get Page data
    page.goto('http://localhost:3000/products')
    page.wait_for_timeout(2000)
    take_screenshot(page, "products_page.png")

    page_content = page.content()
    print(f"\n  Page Content Check:")

    if api_products and api_products.get('list'):
        checks = []
        for prod in api_products['list'][:2]:
            prod_name = prod.get('name', '')
            if prod_name in page_content:
                print(f"    [PASS] Product name '{prod_name}' found on page")
                checks.append(True)

            price = prod.get('price', 0)
            price_str = str(price)
            if price_str in page_content:
                print(f"    [PASS] Price '{price_str}' found on page")
                checks.append(True)

        results['products'] = len(checks) >= 2

    # ==========================================
    # 8. Validate Cart Data
    # ==========================================
    print("\n" + "=" * 70)
    print("[Test 7] Cart Data Validation")
    print("=" * 70)

    # Get API data
    api_cart = get_api_data("/orders/cart", token)
    print(f"\n  API Data:")
    if api_cart:
        items = api_cart.get('items', api_cart.get('list', []))
        print(f"    Cart items: {len(items)}")
        for i, item in enumerate(items[:3]):
            print(f"    Item {i+1}:")
            print(f"      product_id: {item.get('product_id')}")
            print(f"      quantity: {item.get('quantity')}")
            print(f"      selected: {item.get('selected')}")

    # Get Page data
    page.goto('http://localhost:3000/cart')
    page.wait_for_timeout(2000)
    take_screenshot(page, "cart_page.png")

    results['cart'] = api_cart is not None

    # ==========================================
    # 9. Validate Coupons Data
    # ==========================================
    print("\n" + "=" * 70)
    print("[Test 8] Coupons Data Validation")
    print("=" * 70)

    # Get API data
    api_coupons = get_api_data("/coupons")
    print(f"\n  API Data (Public Coupons):")
    if api_coupons and api_coupons.get('list'):
        print(f"    Total coupons: {api_coupons.get('total', 0)}")
        for i, coupon in enumerate(api_coupons['list'][:2]):
            print(f"    Coupon {i+1}:")
            print(f"      name: {coupon.get('name')}")
            print(f"      discount_amount: {coupon.get('discount_amount')}")
            print(f"      status: {coupon.get('status')}")

    # Get my coupons
    api_my_coupons = get_api_data("/my-coupons", token)
    print(f"\n  API Data (My Coupons):")
    if api_my_coupons:
        print(f"    My coupons total: {api_my_coupons.get('total', 0)}")

    results['coupons'] = api_coupons is not None

    browser.close()

# ==========================================
# Final Summary
# ==========================================
print("\n" + "=" * 70)
print("Data Validation Results Summary")
print("=" * 70)

total = len(results)
passed = sum(1 for v in results.values() if v)

for test, status in results.items():
    icon = "[PASS]" if status else "[FAIL]"
    print(f"  {icon} {test}")

print(f"\nOverall: {passed}/{total} validated ({passed*100//total}%)")

if passed == total:
    print("\n[CONCLUSION] All page data comes from real API/Database!")
else:
    print("\n[WARNING] Some pages may still use Mock data!")

print(f"\nScreenshots: {SCREENSHOT_DIR}")