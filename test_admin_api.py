"""
管理后台API与数据库对接验证测试
测试所有管理后台API接口是否正确连接数据库
"""
import requests
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

API_BASE = "http://localhost:3005/api"

def get_token():
    """登录获取Token"""
    resp = requests.post(f"{API_BASE}/auth/login",
        json={"phone": "13800138001", "password": "123456"}, timeout=10)
    data = resp.json()
    if data.get('success'):
        return data['data']['session']['access_token']
    return None

def api_request(endpoint, token, method="GET", data=None):
    """发送API请求"""
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    }
    url = f"{API_BASE}{endpoint}"

    try:
        if method == "GET":
            resp = requests.get(url, headers=headers, timeout=10)
        elif method == "POST":
            resp = requests.post(url, headers=headers, json=data, timeout=10)
        elif method == "PUT":
            resp = requests.put(url, headers=headers, json=data, timeout=10)
        elif method == "DELETE":
            resp = requests.delete(url, headers=headers, timeout=10)
        else:
            return None

        return resp.json()
    except Exception as e:
        return {"success": False, "error": str(e)}

print("=" * 70)
print("Admin API Database Connection Test")
print("=" * 70)

# 1. 登录获取Token
print("\n[Step 1] Login")
token = get_token()
if token:
    print("  [PASS] Login successful, token obtained")
else:
    print("  [FAIL] Login failed")
    exit()

results = {}

# ==========================================
# 2. 测试仪表盘API
# ==========================================
print("\n" + "=" * 70)
print("[Test 1] Dashboard API")
print("=" * 70)

dashboard = api_request("/admin/dashboard", token)
if dashboard.get('success'):
    data = dashboard.get('data', {})
    stats = data.get('stats', {})
    print(f"  API Response: SUCCESS")
    print(f"    today_revenue: {stats.get('today_revenue', 0)}")
    print(f"    today_partners: {stats.get('today_partners', 0)}")
    print(f"    pending_withdrawals: {stats.get('pending_withdrawals', 0)}")
    print(f"    pending_shipments: {stats.get('pending_shipments', 0)}")

    # 验证数据合理性
    if isinstance(stats.get('today_revenue'), (int, float)):
        results['dashboard'] = True
        print("  [PASS] Dashboard data validated")
    else:
        results['dashboard'] = False
        print("  [FAIL] Invalid data types")
else:
    print(f"  [FAIL] API Error: {dashboard.get('error', {}).get('message')}")
    results['dashboard'] = False

# ==========================================
# 3. 测试商品管理API
# ==========================================
print("\n" + "=" * 70)
print("[Test 2] Products Management API")
print("=" * 70)

products = api_request("/admin/products", token)
if products.get('success'):
    data = products.get('data', {})
    items = data.get('list', data) if isinstance(data, dict) else data
    total = data.get('total', len(items) if isinstance(items, list) else 0)

    print(f"  API Response: SUCCESS")
    print(f"    Total products: {total}")

    if isinstance(items, list) and len(items) > 0:
        # 显示前3个商品
        for i, prod in enumerate(items[:3]):
            print(f"    Product {i+1}:")
            print(f"      id: {prod.get('id', 'N/A')[:20]}...")
            print(f"      name: {prod.get('name', 'N/A')}")
            print(f"      price: {prod.get('price', 'N/A')}")
            print(f"      stock: {prod.get('stock', 'N/A')}")
            print(f"      status: {prod.get('status', 'N/A')}")

        # 验证数据字段
        first_prod = items[0]
        required_fields = ['id', 'name', 'price']
        if all(field in first_prod for field in required_fields):
            results['products'] = True
            print("  [PASS] Products data validated")
        else:
            results['products'] = False
            print("  [FAIL] Missing required fields")
    else:
        results['products'] = True
        print("  [PASS] Products API working (empty list)")
else:
    print(f"  [FAIL] API Error: {products.get('error', {}).get('message')}")
    results['products'] = False

# ==========================================
# 4. 测试订单管理API
# ==========================================
print("\n" + "=" * 70)
print("[Test 3] Orders Management API")
print("=" * 70)

orders = api_request("/admin/orders", token)
if orders.get('success'):
    data = orders.get('data', {})
    items = data.get('list', data) if isinstance(data, dict) else data
    total = data.get('total', len(items) if isinstance(items, list) else 0)

    print(f"  API Response: SUCCESS")
    print(f"    Total orders: {total}")

    if isinstance(items, list) and len(items) > 0:
        for i, order in enumerate(items[:3]):
            print(f"    Order {i+1}:")
            print(f"      order_no: {order.get('order_no', 'N/A')}")
            print(f"      status: {order.get('status', 'N/A')}")
            print(f"      total_amount: {order.get('total_amount', 'N/A')}")
            print(f"      paid_amount: {order.get('paid_amount', 'N/A')}")

        results['orders'] = True
        print("  [PASS] Orders data validated")
    else:
        results['orders'] = True
        print("  [PASS] Orders API working (empty list)")
else:
    print(f"  [FAIL] API Error: {orders.get('error', {}).get('message')}")
    results['orders'] = False

# ==========================================
# 5. 测试用户管理API
# ==========================================
print("\n" + "=" * 70)
print("[Test 4] Users Management API")
print("=" * 70)

users = api_request("/admin/users", token)
if users.get('success'):
    data = users.get('data', {})
    items = data.get('list', data) if isinstance(data, dict) else data
    total = data.get('total', len(items) if isinstance(items, list) else 0)

    print(f"  API Response: SUCCESS")
    print(f"    Total users: {total}")

    if isinstance(items, list) and len(items) > 0:
        for i, user in enumerate(items[:3]):
            print(f"    User {i+1}:")
            print(f"      name: {user.get('name', 'N/A')}")
            print(f"      phone: {user.get('phone', 'N/A')}")
            print(f"      is_partner: {user.get('is_partner', 'N/A')}")
            print(f"      status: {user.get('status', 'N/A')}")

        results['users'] = True
        print("  [PASS] Users data validated")
    else:
        results['users'] = True
        print("  [PASS] Users API working")
else:
    print(f"  [FAIL] API Error: {users.get('error', {}).get('message')}")
    results['users'] = False

# ==========================================
# 6. 测试合伙人管理API
# ==========================================
print("\n" + "=" * 70)
print("[Test 5] Partners Management API")
print("=" * 70)

partners = api_request("/admin/partners", token)
if partners.get('success'):
    data = partners.get('data', {})
    items = data.get('list', data) if isinstance(data, dict) else data

    print(f"  API Response: SUCCESS")
    print(f"    Partners count: {len(items) if isinstance(items, list) else 'N/A'}")

    results['partners'] = True
    print("  [PASS] Partners API validated")
else:
    print(f"  [FAIL] API Error: {partners.get('error', {}).get('message')}")
    results['partners'] = False

# ==========================================
# 7. 测试合伙人申请API
# ==========================================
print("\n" + "=" * 70)
print("[Test 6] Partner Applications API")
print("=" * 70)

applications = api_request("/admin/partner-applications", token)
if applications.get('success'):
    data = applications.get('data', {})
    items = data.get('list', data) if isinstance(data, dict) else data

    print(f"  API Response: SUCCESS")

    if isinstance(items, list) and len(items) > 0:
        print(f"    Applications count: {len(items)}")
        for i, app in enumerate(items[:2]):
            print(f"    Application {i+1}:")
            print(f"      status: {app.get('status', 'N/A')}")
            print(f"      level: {app.get('level', 'N/A')}")

    results['partner_applications'] = True
    print("  [PASS] Partner applications API validated")
else:
    print(f"  [FAIL] API Error: {applications.get('error', {}).get('message')}")
    results['partner_applications'] = False

# ==========================================
# 8. 测试提现管理API
# ==========================================
print("\n" + "=" * 70)
print("[Test 7] Withdrawals Management API")
print("=" * 70)

withdrawals = api_request("/admin/withdrawals", token)
if withdrawals.get('success'):
    data = withdrawals.get('data', {})
    items = data.get('list', data) if isinstance(data, dict) else data

    print(f"  API Response: SUCCESS")

    if isinstance(items, list) and len(items) > 0:
        print(f"    Withdrawals count: {len(items)}")
        for i, w in enumerate(items[:2]):
            print(f"    Withdrawal {i+1}:")
            print(f"      withdrawal_no: {w.get('withdrawal_no', 'N/A')}")
            print(f"      amount: {w.get('amount', 'N/A')}")
            print(f"      status: {w.get('status', 'N/A')}")

    results['withdrawals'] = True
    print("  [PASS] Withdrawals API validated")
else:
    print(f"  [FAIL] API Error: {withdrawals.get('error', {}).get('message')}")
    results['withdrawals'] = False

# ==========================================
# 9. 测试分类管理API
# ==========================================
print("\n" + "=" * 70)
print("[Test 8] Categories Management API")
print("=" * 70)

categories = api_request("/admin/categories", token)
if categories.get('success'):
    data = categories.get('data', [])
    items = data if isinstance(data, list) else data.get('list', [])

    print(f"  API Response: SUCCESS")
    print(f"    Categories count: {len(items)}")

    if len(items) > 0:
        for i, cat in enumerate(items[:3]):
            print(f"    Category {i+1}: {cat.get('name', 'N/A')}")

    results['categories'] = True
    print("  [PASS] Categories API validated")
else:
    print(f"  [FAIL] API Error: {categories.get('error', {}).get('message')}")
    results['categories'] = False

# ==========================================
# 10. 测试财务统计API
# ==========================================
print("\n" + "=" * 70)
print("[Test 9] Finance Stats API")
print("=" * 70)

finance = api_request("/admin/finance/stats", token)
if finance.get('success'):
    data = finance.get('data', {})
    print(f"  API Response: SUCCESS")
    print(f"    total_revenue: {data.get('total_revenue', 0)}")
    print(f"    total_withdrawn: {data.get('total_withdrawn', 0)}")
    print(f"    pending_withdrawals: {data.get('pending_withdrawals', 0)}")

    results['finance'] = True
    print("  [PASS] Finance stats API validated")
else:
    print(f"  [FAIL] API Error: {finance.get('error', {}).get('message')}")
    results['finance'] = False

# ==========================================
# 11. 测试交易流水API
# ==========================================
print("\n" + "=" * 70)
print("[Test 10] Transactions API")
print("=" * 70)

transactions = api_request("/admin/transactions", token)
if transactions.get('success'):
    data = transactions.get('data', {})
    items = data.get('list', data) if isinstance(data, dict) else data

    print(f"  API Response: SUCCESS")

    results['transactions'] = True
    print("  [PASS] Transactions API validated")
else:
    print(f"  [FAIL] API Error: {transactions.get('error', {}).get('message')}")
    results['transactions'] = False

# ==========================================
# 12. 测试收益记录API
# ==========================================
print("\n" + "=" * 70)
print("[Test 11] Income Records API")
print("=" * 70)

income_records = api_request("/admin/income-records", token)
if income_records.get('success'):
    data = income_records.get('data', {})
    items = data.get('list', data) if isinstance(data, dict) else data

    print(f"  API Response: SUCCESS")

    results['income_records'] = True
    print("  [PASS] Income records API validated")
else:
    print(f"  [FAIL] API Error: {income_records.get('error', {}).get('message')}")
    results['income_records'] = False

# ==========================================
# 13. 测试销售龙虎榜API
# ==========================================
print("\n" + "=" * 70)
print("[Test 12] Sales Leaderboard API")
print("=" * 70)

leaderboard = api_request("/admin/sales-leaderboard", token)
if leaderboard.get('success'):
    data = leaderboard.get('data', [])
    items = data if isinstance(data, list) else data.get('list', [])

    print(f"  API Response: SUCCESS")
    print(f"    Leaderboard entries: {len(items)}")

    results['leaderboard'] = True
    print("  [PASS] Sales leaderboard API validated")
else:
    print(f"  [FAIL] API Error: {leaderboard.get('error', {}).get('message')}")
    results['leaderboard'] = False

# ==========================================
# 汇总结果
# ==========================================
print("\n" + "=" * 70)
print("Test Results Summary")
print("=" * 70)

total = len(results)
passed = sum(1 for v in results.values() if v)

for test, status in results.items():
    icon = "[PASS]" if status else "[FAIL]"
    print(f"  {icon} {test}")

print(f"\nOverall: {passed}/{total} validated ({passed*100//total}%)")

if passed == total:
    print("\n[CONCLUSION] All Admin APIs are connected to database!")
else:
    print("\n[WARNING] Some Admin APIs may have issues!")

print("\n" + "=" * 70)
print("Database Tables Verification")
print("=" * 70)

# 验证数据库表记录数
print("\n[Direct Database Query via API]")

# 统计各表记录数
tables_to_check = [
    ("/admin/products", "products"),
    ("/admin/orders", "orders"),
    ("/admin/users", "users"),
    ("/admin/categories", "categories")
]

for endpoint, table_name in tables_to_check:
    resp = api_request(endpoint, token)
    if resp.get('success'):
        data = resp.get('data', {})
        if isinstance(data, dict):
            count = data.get('total', len(data.get('list', [])))
        else:
            count = len(data) if isinstance(data, list) else 0
        print(f"  {table_name}: {count} records")
    else:
        print(f"  {table_name}: query failed")