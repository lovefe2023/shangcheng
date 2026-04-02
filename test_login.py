"""
测试登录功能
1. 验证表单验证（空输入不应提交）
2. 测试登录成功流程
"""

from playwright.sync_api import sync_playwright
import time
import sys

# 解决Windows编码问题
sys.stdout.reconfigure(encoding='utf-8')

def test_login():
    results = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        # 监听console日志
        page.on("console", lambda msg: results.append(f"[Console] {msg.type}: {msg.text}"))

        # 打开登录页面
        print("[Step 1] 打开登录页面")
        page.goto('http://localhost:3000/login')
        page.wait_for_load_state('networkidle')

        # 截图查看页面状态
        page.screenshot(path='/tmp/login_page.png')
        results.append("OK 登录页面加载成功")

        # ===== 测试1: 空输入验证 =====
        print("[Step 2] 测试空输入验证")

        # 不输入任何内容，直接点击登录按钮
        login_button = page.locator('button:has-text("登录")')
        login_button.click()

        # 等待一下看是否有错误提示
        page.wait_for_timeout(1000)
        page.screenshot(path='/tmp/login_empty_submit.png')

        # 检查是否还在登录页面（没有跳转）
        current_url = page.url
        if '/login' in current_url:
            results.append("OK 空输入验证正常 - 未跳转到首页")
        else:
            results.append(f"FAIL 空输入验证失败 - 页面跳转到了: {current_url}")

        # 检查是否有错误提示（toast或alert）
        toast_visible = page.locator('.toast-message, [role="alert"], .error-message').count() > 0
        if toast_visible:
            results.append("OK 有错误提示显示")
        else:
            results.append("WARN 未检测到明显的错误提示元素")

        # ===== 测试2: 手机号格式验证 =====
        print("[Step 3] 测试手机号格式验证")

        phone_input = page.locator('input[type="tel"], input[placeholder*="手机"]')
        password_input = page.locator('input[type="password"], input[placeholder*="密码"]')

        # 输入错误的手机号格式
        phone_input.fill('12345')
        password_input.fill('123456')
        login_button.click()
        page.wait_for_timeout(1000)

        current_url = page.url
        if '/login' in current_url:
            results.append("OK 错误手机号格式验证正常 - 未跳转")
        else:
            results.append(f"FAIL 错误手机号格式验证失败 - 页面跳转到了: {current_url}")

        page.screenshot(path='/tmp/login_invalid_phone.png')

        # ===== 测试3: 正常登录流程 =====
        print("[Step 4] 测试正常登录")

        # 清空输入框
        phone_input.fill('')
        password_input.fill('')
        page.wait_for_timeout(300)

        # 输入正确的账号密码
        phone_input.fill('13800138001')
        password_input.fill('123456')

        page.screenshot(path='/tmp/login_filled.png')
        results.append("OK 已填写正确账号密码")

        # 点击登录
        login_button.click()

        # 等待登录完成
        page.wait_for_timeout(3000)

        # 检查是否跳转到首页
        current_url = page.url
        if current_url == 'http://localhost:3000/' or current_url.endswith('/'):
            results.append("OK 登录成功 - 已跳转到首页")
        elif '/login' in current_url:
            results.append(f"FAIL 登录失败 - 仍在登录页面: {current_url}")
        else:
            results.append(f"WARN 登录后跳转到: {current_url}")

        page.screenshot(path='/tmp/login_result.png')

        # 检查localStorage是否有token
        token = page.evaluate('localStorage.getItem("token")')
        user = page.evaluate('localStorage.getItem("user")')

        if token:
            results.append(f"OK Token已保存: {token[:20]}...")
        else:
            results.append("FAIL Token未保存")

        if user:
            results.append(f"OK User信息已保存")
        else:
            results.append("FAIL User信息未保存")

        browser.close()

    return results

if __name__ == "__main__":
    print("=" * 50)
    print("登录功能测试报告")
    print("=" * 50)

    results = test_login()

    for result in results:
        print(result)

    print("=" * 50)
    print(f"测试完成，共 {len(results)} 项结果")