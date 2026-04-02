"""
个人中心全功能测试脚本
测试所有个人中心相关页面和功能
"""
from playwright.sync_api import sync_playwright
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

SCREENSHOT_DIR = "D:/AI/shangcheng/test_screenshots/profile_test"
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

def take_screenshot(page, name):
    page.screenshot(path=f"{SCREENSHOT_DIR}/{name}")
    print(f"  Screenshot: {name}")

def test_page(page, url, name, check_elements=None):
    """测试单个页面"""
    print(f"\n[{name}]")
    try:
        page.goto(url, timeout=10000)
        page.wait_for_timeout(1500)
        take_screenshot(page, f"{name.replace(' ', '_')}.png")

        # 检查页面是否加载
        status = page.evaluate('document.readyState')
        if status == 'complete':
            print(f"  [PASS] Page loaded")

            # 检查指定元素
            if check_elements:
                for elem in check_elements:
                    locator = page.locator(elem)
                    count = locator.count()
                    if count > 0:
                        print(f"  [PASS] Found {count} '{elem}'")
                    else:
                        print(f"  [WARN] No '{elem}' found")
            return True
        else:
            print(f"  [FAIL] Page not ready: {status}")
            return False
    except Exception as e:
        print(f"  [FAIL] Error: {e}")
        take_screenshot(page, f"{name.replace(' ', '_')}_error.png")
        return False

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(viewport={'width': 1280, 'height': 900})
    page = context.new_page()
    page.set_default_timeout(15000)

    results = {}

    print("=" * 60)
    print("Personal Center Full Feature Test")
    print("=" * 60)

    # ==========================================
    # 1. Login First
    # ==========================================
    print("\n[Step 1] Login")
    try:
        page.goto('http://localhost:3000/login', timeout=10000)
        page.wait_for_selector('input[type="tel"]', timeout=5000)
        page.fill('input[type="tel"]', '13800138001')
        page.fill('input[type="password"]', '123456')
        page.click('button:has-text("登录")')
        page.wait_for_timeout(2000)

        if 'login' not in page.url:
            results['login'] = True
            print("  [PASS] Login successful")
            context.storage_state(path=f"{SCREENSHOT_DIR}/auth_state.json")
        else:
            results['login'] = False
            print("  [FAIL] Login failed")
    except Exception as e:
        print(f"  [FAIL] Login error: {e}")
        results['login'] = False

    if not results['login']:
        print("\nCannot continue without login. Exiting.")
        browser.close()
        exit()

    # ==========================================
    # 2. Profile Page (个人中心首页)
    # ==========================================
    results['profile'] = test_page(page, 'http://localhost:3000/profile', "Profile",
        check_elements=['button', 'img', 'a'])

    # Check profile elements
    try:
        # Find user info
        user_name = page.locator('text=老张').count() > 0
        phone_text = page.locator('text=13800138001').count() > 0
        if user_name or phone_text:
            print(f"  [PASS] User info displayed")
    except:
        pass

    # ==========================================
    # 3. Personal Info Page (个人信息)
    # ==========================================
    results['personal_info'] = test_page(page, 'http://localhost:3000/personal-info', "Personal Info",
        check_elements=['input', 'button'])

    # ==========================================
    # 4. Orders List (订单列表)
    # ==========================================
    results['orders'] = test_page(page, 'http://localhost:3000/orders', "Orders List",
        check_elements=['[class*="order"]', 'a[href*="/order/"]', 'button'])

    # Check for order items
    try:
        order_links = page.locator('a[href*="/order/"]').all()
        print(f"  Orders found: {len(order_links)}")

        # Click first order if exists
        if len(order_links) > 0:
            order_links[0].click()
            page.wait_for_timeout(1500)
            take_screenshot(page, "Order_Detail.png")
            results['order_detail'] = True
            print("  [PASS] Order detail opened")
        else:
            results['order_detail'] = False
            print("  [WARN] No orders to view")
    except Exception as e:
        results['order_detail'] = False
        print(f"  [FAIL] Order detail error: {e}")

    # ==========================================
    # 5. Addresses (地址管理)
    # ==========================================
    results['addresses'] = test_page(page, 'http://localhost:3000/addresses', "Addresses",
        check_elements=['[class*="address"]', 'button'])

    # Check for address items
    try:
        add_btn = page.locator('button:has-text("添加"), button:has-text("新增")')
        if add_btn.count() > 0:
            print("  [PASS] Add address button found")

        # Check existing addresses
        page_content = page.content()
        if '修改' in page_content or '删除' in page_content:
            print("  [PASS] Existing addresses found")
    except:
        pass

    # ==========================================
    # 6. My Coupons (我的优惠券)
    # ==========================================
    results['my_coupons'] = test_page(page, 'http://localhost:3000/my-coupons', "My Coupons",
        check_elements=['[class*="coupon"]', 'button'])

    # Check coupon tabs
    try:
        tabs = page.locator('[class*="tab"]').all()
        print(f"  Tabs found: {len(tabs)}")

        # Check for coupons
        coupons = page.locator('[class*="coupon"]').all()
        print(f"  Coupons found: {len(coupons)}")
    except:
        pass

    # ==========================================
    # 7. Coupons Center (优惠券中心)
    # ==========================================
    results['coupons_center'] = test_page(page, 'http://localhost:3000/coupons', "Coupons Center",
        check_elements=['[class*="coupon"]', 'button'])

    # ==========================================
    # 8. Partner Center (合伙人中心)
    # ==========================================
    results['partner'] = test_page(page, 'http://localhost:3000/partner', "Partner Center",
        check_elements=['[class*="income"]', 'button', 'a'])

    # Check partner info
    try:
        # Look for income/balance displays
        income_text = page.locator('text=/¥[0-9,.]+/').all()
        print(f"  Income displays found: {len(income_text)}")

        # Check invite code
        invite_code = page.locator('text=UMNG694W96BX').count() > 0
        if invite_code:
            print("  [PASS] Invite code displayed")
    except:
        pass

    # ==========================================
    # 9. My Cellar (我的酒窖)
    # ==========================================
    results['my_cellar'] = test_page(page, 'http://localhost:3000/my-cellar', "My Cellar",
        check_elements=['[class*="cellar"]', 'button', 'img'])

    # ==========================================
    # 10. Leaderboard (排行榜)
    # ==========================================
    results['leaderboard'] = test_page(page, 'http://localhost:3000/leaderboard', "Leaderboard",
        check_elements=['[class*="rank"]', 'a'])

    # ==========================================
    # 11. Partner Package (合伙人礼包)
    # ==========================================
    results['partner_package'] = test_page(page, 'http://localhost:3000/partner-package', "Partner Package",
        check_elements=['[class*="package"]', 'button', 'img'])

    # ==========================================
    # 12. Sales/Income (收益明细)
    # ==========================================
    results['sales'] = test_page(page, 'http://localhost:3000/sales', "Sales/Income",
        check_elements=['[class*="income"]', 'button'])

    # ==========================================
    # 13. Withdraw (提现)
    # ==========================================
    results['withdraw'] = test_page(page, 'http://localhost:3000/partner/withdraw', "Withdraw",
        check_elements=['input', 'button'])

    # ==========================================
    # 14. Team (团队成员)
    # ==========================================
    results['team'] = test_page(page, 'http://localhost:3000/partner/team', "Team",
        check_elements=['[class*="member"]', 'button'])

    # ==========================================
    # 15. Settings (设置)
    # ==========================================
    results['settings'] = test_page(page, 'http://localhost:3000/settings', "Settings",
        check_elements=['button', 'a'])

    # ==========================================
    # 16. Notifications (公告中心)
    # ==========================================
    results['notifications'] = test_page(page, 'http://localhost:3000/notifications', "Notifications",
        check_elements=['[class*="notification"]', 'a'])

    # ==========================================
    # 17. Privileges (权益说明)
    # ==========================================
    results['privileges'] = test_page(page, 'http://localhost:3000/privileges', "Privileges",
        check_elements=['button', 'a'])

    # ==========================================
    # 18. Partner Invite (邀请合伙人)
    # ==========================================
    results['partner_invite'] = test_page(page, 'http://localhost:3000/partner/invite', "Partner Invite",
        check_elements=['button', 'input'])

    # ==========================================
    # Results Summary
    # ==========================================
    print("\n" + "=" * 60)
    print("Test Results Summary")
    print("=" * 60)

    total = len(results)
    passed = sum(1 for v in results.values() if v)

    # Group results
    core_features = ['login', 'profile', 'personal_info', 'orders', 'addresses', 'my_coupons']
    partner_features = ['partner', 'sales', 'withdraw', 'team', 'leaderboard', 'partner_package', 'my_cellar', 'partner_invite']
    other_features = ['coupons_center', 'notifications', 'privileges', 'settings', 'order_detail']

    print("\n[Core Features]")
    for feature in core_features:
        if feature in results:
            status = "[PASS]" if results[feature] else "[FAIL]"
            print(f"  {status} {feature}")

    print("\n[Partner Features]")
    for feature in partner_features:
        if feature in results:
            status = "[PASS]" if results[feature] else "[FAIL]"
            print(f"  {status} {feature}")

    print("\n[Other Features]")
    for feature in other_features:
        if feature in results:
            status = "[PASS]" if results[feature] else "[FAIL]"
            print(f"  {status} {feature}")

    print(f"\nTotal: {passed}/{total} passed ({passed*100//total}%)")
    print(f"Screenshots saved to: {SCREENSHOT_DIR}")

    browser.close()