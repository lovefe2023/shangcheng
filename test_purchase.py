"""
Test product purchase flow for Wine Mall System
Flow: Login -> Browse Products -> Add to Cart -> Select Items -> Checkout -> Order
"""

from playwright.sync_api import sync_playwright
import os
import sys

def test_purchase_flow():
    screenshots_dir = 'D:/AI/shangcheng/test_screenshots'
    os.makedirs(screenshots_dir, exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        # Collect console messages
        console_msgs = []
        page.on("console", lambda msg: console_msgs.append(f"[{msg.type}] {msg.text}"))

        # Capture page errors
        page_errors = []
        page.on("pageerror", lambda err: page_errors.append(str(err)))

        # Track network requests
        all_requests = []
        all_responses = []

        def track_request(request):
            all_requests.append({
                'url': request.url,
                'method': request.method
            })

        def track_response(response):
            all_responses.append({
                'url': response.url,
                'status': response.status
            })

        page.on('request', track_request)
        page.on('response', track_response)

        # Step 1: Login
        print("=" * 50)
        print("Step 1: Login")
        print("=" * 50)

        # Wait for frontend to be fully ready
        print("Navigating to login page...")
        page.goto('http://localhost:3000/login', timeout=60000)

        # Wait for React to render (check for input elements)
        print("Waiting for React to render...")
        try:
            page.wait_for_function('document.querySelectorAll("input").length > 0', timeout=60000)  # 60s timeout
            print("React rendered successfully")
        except Exception as e:
            print(f"Timeout waiting for React: {e}")
            # Try to get more info
            root_html = page.evaluate('document.getElementById("root").innerHTML')
            print(f"Root innerHTML length: {len(root_html)}")
            if console_msgs:
                print("Console messages:")
                for msg in console_msgs[:15]:
                    print(f"  {msg}")
            if page_errors:
                print("Page errors:")
                for err in page_errors[:5]:
                    print(f"  {err}")
            # Check failed network requests
            failed_requests = [r for r in all_responses if r['status'] >= 400 or r['status'] == 0]
            if failed_requests:
                print("Failed requests:")
                for req in failed_requests[:10]:
                    print(f"  {req['url']} - Status: {req['status']}")
            # Check if main.tsx was requested
            main_tsx_requests = [r for r in all_requests if 'main.tsx' in r['url']]
            print(f"main.tsx requests: {len(main_tsx_requests)}")
            for req in main_tsx_requests[:5]:
                print(f"  {req['url']}")
            # Print all requests
            print(f"All requests ({len(all_requests)}):")
            for req in all_requests[:20]:
                print(f"  {req['method']} {req['url'][:80]}")

        page.screenshot(path=f'{screenshots_dir}/01_login_page.png')

        # Find all inputs
        all_inputs = page.locator('input').all()
        print(f"Found {len(all_inputs)} input elements")

        if len(all_inputs) == 0:
            print("ERROR: No inputs found")
            browser.close()
            return False

        # Fill login form using first two inputs
        inputs = page.locator('input').all()
        inputs[0].fill('13800138001')
        if len(inputs) >= 2:
            inputs[1].fill('123456')
        page.screenshot(path=f'{screenshots_dir}/02_login_filled.png')

        # Click login button
        login_btn = page.locator('button[type="submit"]').first
        login_btn.click()
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(2000)

        current_url = page.url
        print(f"After login URL: {current_url}")
        page.screenshot(path=f'{screenshots_dir}/03_after_login.png')

        if '/login' in current_url:
            print("ERROR: Still on login page - login failed")
            browser.close()
            return False
        print("Login SUCCESS")

        # Check localStorage for token
        token = page.evaluate('localStorage.getItem("token")')
        user_data = page.evaluate('localStorage.getItem("user")')
        print(f"Token saved: {token[:50] if token else 'None'}...")
        if user_data:
            print(f"User data saved: Yes (length: {len(user_data)})")
        else:
            print("User data saved: None")

        if not token:
            print("ERROR: Token not saved in localStorage")
            browser.close()
            return False

        # Step 2: Browse Products
        print("=" * 50)
        print("Step 2: Browse Products")
        print("=" * 50)

        page.goto('http://localhost:3000/products')
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(5000)  # Extra wait for API data and rendering
        page.screenshot(path=f'{screenshots_dir}/04_products_page.png')

        # Debug: Check page content
        content = page.content()
        print(f"Page content length: {len(content)}")
        if "全部商品" in content:
            print("Products page header found")
        if "加载中" in content:
            print("Page showing loading state")
        if "未找到" in content:
            print("No products found message")

        # Find all links
        all_links = page.locator('a').all()
        print(f"Total links on page: {len(all_links)}")

        # Wait for product cards to load - check for specific elements
        try:
            page.wait_for_selector('a[href*="/product/"]', timeout=15000)
            print("Product links selector found")
        except Exception as e:
            print(f"Wait for selector timeout: {e}")
            page.screenshot(path=f'{screenshots_dir}/04b_products_timeout.png')

        # Click first product link
        product_links = page.locator('a[href*="/product/"]').all()
        print(f"Product links found: {len(product_links)}")

        if len(product_links) > 0:
            product_links[0].click()
            page.wait_for_load_state('networkidle')
            page.screenshot(path=f'{screenshots_dir}/05_product_detail.png')
            print(f"Product detail URL: {page.url}")
        else:
            print("ERROR: No product links found")
            browser.close()
            return False

        # Step 3: Add to Cart
        print("=" * 50)
        print("Step 3: Add to Cart")
        print("=" * 50)

        # Wait for page to be fully loaded
        page.wait_for_timeout(2000)

        # Debug: Find all buttons on page
        all_buttons = page.locator('button').all()
        print(f"Total buttons on page: {len(all_buttons)}")
        for i, btn in enumerate(all_buttons[:5]):
            try:
                text = btn.text_content() or ""
                print(f"  Button {i}: '{text[:30]}'")
            except:
                pass

        page.screenshot(path=f'{screenshots_dir}/05b_product_buttons.png')

        # Try multiple approaches to find add to cart button
        # Approach 1: Find by class pattern (bg-primary/10 for add to cart)
        add_cart_btn = page.locator('button.bg-primary\\/10').first
        if add_cart_btn.count() > 0:
            print(f"Found button by class bg-primary/10")
            if not add_cart_btn.is_disabled():
                add_cart_btn.click()
                page.wait_for_timeout(3000)
                print("Clicked add to cart button - SUCCESS")
                page.screenshot(path=f'{screenshots_dir}/06_after_add_cart.png')

                # Check API requests made
                cart_api_requests = [r for r in all_requests if 'cart' in r['url']]
                print(f"Cart API requests: {len(cart_api_requests)}")
                for req in cart_api_requests:
                    print(f"  {req['method']} {req['url']}")
                # Check responses
                cart_api_responses = [r for r in all_responses if 'cart' in r['url']]
                print(f"Cart API responses: {len(cart_api_responses)}")
                for resp in cart_api_responses:
                    print(f"  Status: {resp['status']}")
            else:
                print("Button is disabled")
        else:
            # Approach 2: Find button containing specific text
            for btn in all_buttons:
                try:
                    text = btn.text_content() or ""
                    if "购物车" in text or "加入" in text:
                        print(f"Found button with text: '{text}'")
                        if not btn.is_disabled():
                            btn.click()
                            page.wait_for_timeout(2000)
                            print("Clicked button")
                            page.screenshot(path=f'{screenshots_dir}/06_after_add_cart.png')
                            break
                except:
                    pass

            # Approach 3: Click the bottom action bar buttons
            if not os.path.exists(f'{screenshots_dir}/06_after_add_cart.png'):
                bottom_buttons = page.locator('div.shrink-0 button, div[class*="bottom"] button').all()
                print(f"Bottom bar buttons: {len(bottom_buttons)}")
                for btn in bottom_buttons:
                    try:
                        text = btn.text_content() or ""
                        print(f"  Bottom button: '{text[:20]}'")
                        if "购物车" in text and not btn.is_disabled():
                            btn.click()
                            page.wait_for_timeout(2000)
                            print("Clicked bottom add to cart button")
                            page.screenshot(path=f'{screenshots_dir}/06_after_add_cart.png')
                            break
                    except:
                        pass

        # Step 4: View Cart
        print("=" * 50)
        print("Step 4: View Cart")
        print("=" * 50)

        page.goto('http://localhost:3000/cart')
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(3000)
        page.screenshot(path=f'{screenshots_dir}/07_cart_page.png')

        # Check localStorage again
        cart_token = page.evaluate('localStorage.getItem("token")')
        print(f"Token in cart page: {cart_token[:50] if cart_token else 'None'}...")

        # Check cart API request/response
        cart_get_requests = [r for r in all_requests if 'cart' in r['url'] and r['method'] == 'GET']
        cart_get_responses = [r for r in all_responses if 'cart' in r['url']]
        print(f"Cart GET requests: {len(cart_get_requests)}")
        print(f"Cart GET responses: {len(cart_get_responses)}")
        for resp in cart_get_responses:
            print(f"  Status: {resp['status']}")

        # Check for empty cart message
        content = page.content()
        print(f"Cart page content length: {len(content)}")
        if "购物车是空的" in content or "暂无商品" in content or "empty" in content.lower():
            print("ERROR: Cart is empty - add to cart failed")
            # Debug: check what's on the page
            page.screenshot(path=f'{screenshots_dir}/07b_cart_empty.png')

            # Check for API errors in console
            console_msgs = []
            page.on("console", lambda msg: console_msgs.append(msg.text))
            print(f"Console messages: {console_msgs[:5]}")

            browser.close()
            return False

        # Find cart items and checkboxes
        checkboxes = page.locator('input[type="checkbox"]').all()
        print(f"Found {len(checkboxes)} checkboxes")

        # Select first item checkbox if not already selected
        item_checkbox = page.locator('input[type="checkbox"]').nth(1)  # Skip "全选" checkbox
        if item_checkbox.count() > 0:
            if not item_checkbox.is_checked():
                item_checkbox.click()
                page.wait_for_timeout(500)
                print("Selected first cart item")
            else:
                print("First item already selected")

        # Or click "全选" to select all
        select_all_checkbox = page.locator('input[type="checkbox"]').first
        if select_all_checkbox.count() > 0:
            if not select_all_checkbox.is_checked():
                select_all_checkbox.click()
                page.wait_for_timeout(500)
                print("Clicked select all")

        page.screenshot(path=f'{screenshots_dir}/08_cart_selected.png')

        # Step 5: Checkout
        print("=" * 50)
        print("Step 5: Checkout")
        print("=" * 50)

        # Find checkout button
        checkout_btn = page.locator('button').filter(has_text="去结算").first
        if checkout_btn.count() > 0:
            is_disabled = checkout_btn.is_disabled()
            print(f"Checkout button disabled: {is_disabled}")

            if not is_disabled:
                checkout_btn.click()
                page.wait_for_load_state('networkidle')
                page.wait_for_timeout(1000)
                page.screenshot(path=f'{screenshots_dir}/09_checkout_page.png')
                print(f"Checkout URL: {page.url}")

                # Step 6: Complete Order
                print("=" * 50)
                print("Step 6: Complete Order")
                print("=" * 50)

                # Check if submit button exists and is enabled
                submit_btn = page.locator('button').filter(has_text="提交订单").first
                if submit_btn.count() > 0:
                    is_disabled = submit_btn.is_disabled()
                    print(f"Submit button disabled: {is_disabled}")

                    if is_disabled:
                        # Check for missing address
                        page.screenshot(path=f'{screenshots_dir}/09b_checkout_no_address.png')
                        # Check if there's an add address option
                        add_addr = page.locator('text=添加收货地址')
                        if add_addr.count() > 0:
                            print("No address - clicking add address")
                            add_addr.click()
                            page.wait_for_timeout(2000)
                            page.screenshot(path=f'{screenshots_dir}/09c_add_address.png')

                            # Fill address form
                            inputs = page.locator('input').all()
                            if len(inputs) >= 3:
                                inputs[0].fill('测试用户')
                                inputs[1].fill('13800138001')
                                # Fill address fields
                                page.wait_for_timeout(500)

                            # Save address
                            save_btn = page.locator('button:has-text("保存"), button:has-text("确定")').first
                            if save_btn.count() > 0:
                                save_btn.click()
                                page.wait_for_timeout(2000)
                                page.screenshot(path=f'{screenshots_dir}/09d_address_saved.png')
                    else:
                        submit_btn.click()
                        page.wait_for_load_state('networkidle')
                        page.wait_for_timeout(2000)
                        page.screenshot(path=f'{screenshots_dir}/10_after_order.png')
                        print(f"After order URL: {page.url}")

                        if '/order' in page.url or '/payment' in page.url:
                            print("ORDER SUCCESS!")
                        else:
                            print(f"Order status unclear - URL: {page.url}")
                else:
                    print("Submit button not found on checkout page")
            else:
                print("Checkout button is disabled - items may not be selected properly")
                page.screenshot(path=f'{screenshots_dir}/09b_checkout_disabled.png')
        else:
            print("Checkout button not found")

        # Step 7: View Orders
        print("=" * 50)
        print("Step 7: View Orders")
        print("=" * 50)

        page.goto('http://localhost:3000/orders')
        page.wait_for_load_state('networkidle')
        page.screenshot(path=f'{screenshots_dir}/11_orders_page.png')

        # Check for orders
        content = page.content()
        if "暂无订单" in content or "没有订单" in content:
            print("No orders found on page")
        else:
            # Count order items
            order_elements = page.locator('[class*="order"]').all()
            print(f"Found {len(order_elements)} order-related elements")
            print("Orders page loaded successfully")

        # Final summary
        print("=" * 50)
        print("TEST SUMMARY")
        print("=" * 50)
        print(f"Screenshots saved to: {screenshots_dir}")
        print("Test completed")

        browser.close()
        return True

if __name__ == '__main__':
    success = test_purchase_flow()
    sys.exit(0 if success else 1)