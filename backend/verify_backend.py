"""
Backend Verification Script
Quick test to verify all backend components are working

Usage:
    1. Start the backend server first:
       cd D:\customer-segmentation-engine\backend
       .\venv\Scripts\Activate
       uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
    
    2. In a separate terminal, run:
       python verify_backend.py
"""

import requests
import os
import sys


BASE_URL = "http://127.0.0.1:8000"


def test_endpoint(name, url, method="GET", json_data=None):
    """Test a single endpoint"""
    try:
        if method == "GET":
            response = requests.get(url, timeout=5)
        else:
            response = requests.post(url, json=json_data or {}, timeout=5)

        if response.status_code in [200, 201]:
            print(f"  ✅ {name}: PASS (Status: {response.status_code})")
            return True
        else:
            print(f"  ❌ {name}: FAIL (Status: {response.status_code})")
            return False
    except requests.exceptions.ConnectionError:
        print(f"  ❌ {name}: FAIL (Connection refused - is the server running?)")
        return False
    except requests.exceptions.Timeout:
        print(f"  ❌ {name}: FAIL (Timeout)")
        return False
    except requests.exceptions.RequestException as e:
        print(f"  ❌ {name}: FAIL (Error: {str(e)})")
        return False


def test_file_exists(name, filepath):
    """Test if a file exists"""
    exists = os.path.exists(filepath)
    size = os.path.getsize(filepath) if exists else 0
    if exists:
        print(f"  ✅ {name}: EXISTS ({size:,} bytes)")
    else:
        print(f"  ❌ {name}: MISSING")
    return exists


def main():
    print("\n" + "=" * 60)
    print("🔍 BACKEND VERIFICATION TEST")
    print("=" * 60)

    # ---- Section 1: File checks ----
    print("\n📁 FILE CHECKS:")
    print("-" * 40)

    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)

    file_tests = [
        ("Database (segmentation.db)", os.path.join(script_dir, "segmentation.db")),
        ("Environment (.env)", os.path.join(script_dir, ".env")),
        ("Requirements (requirements.txt)", os.path.join(script_dir, "requirements.txt")),
        ("Main app (app/main.py)", os.path.join(script_dir, "app", "main.py")),
        ("Config (app/config.py)", os.path.join(script_dir, "app", "config.py")),
        ("Customer model", os.path.join(script_dir, "app", "models", "customer.py")),
        ("Customer routes", os.path.join(script_dir, "app", "api", "v1", "routes", "customers.py")),
        ("Segmentation routes", os.path.join(script_dir, "app", "api", "v1", "routes", "segmentation.py")),
        ("KMeans model code", os.path.join(script_dir, "app", "ml", "models", "kmeans_model.py")),
        ("Base model code", os.path.join(script_dir, "app", "ml", "models", "base_model.py")),
        ("Segmentation service", os.path.join(script_dir, "app", "services", "segmentation_service.py")),
        ("Trained model (.pkl)", os.path.join(project_root, "models", "saved", "kmeans_model.pkl")),
        ("Full dataset (CSV)", os.path.join(script_dir, "data", "synthetic", "customers_full.csv")),
        ("Training dataset (CSV)", os.path.join(script_dir, "data", "synthetic", "customers_train.csv")),
        ("Sample dataset (CSV)", os.path.join(script_dir, "data", "synthetic", "customers_sample.csv")),
    ]

    file_passed = 0
    file_failed = 0
    for name, path in file_tests:
        if test_file_exists(name, path):
            file_passed += 1
        else:
            file_failed += 1

    # ---- Section 2: API endpoint checks ----
    print(f"\n🌐 API ENDPOINT CHECKS:")
    print("-" * 40)

    api_tests = [
        ("Root endpoint", f"{BASE_URL}/", "GET"),
        ("Health check", f"{BASE_URL}/health", "GET"),
        ("API Docs (Swagger)", f"{BASE_URL}/api/docs", "GET"),
        ("Customer List", f"{BASE_URL}/api/v1/customers/?limit=5", "GET"),
        ("Customer Stats", f"{BASE_URL}/api/v1/customers/stats/overview", "GET"),
        ("Single Customer", f"{BASE_URL}/api/v1/customers/CUST_000001", "GET"),
        ("Model Info", f"{BASE_URL}/api/v1/segmentation/model-info", "GET"),
        ("Segment Profiles", f"{BASE_URL}/api/v1/segmentation/segment-profiles", "GET"),
    ]

    api_passed = 0
    api_failed = 0
    for name, url, method in api_tests:
        if test_endpoint(name, url, method):
            api_passed += 1
        else:
            api_failed += 1

    # ---- Section 3: Prediction test ----
    print(f"\n🤖 PREDICTION TEST:")
    print("-" * 40)

    prediction_data = {
        "recency_days": 15.0,
        "frequency": 12,
        "monetary_value": 2500.0,
        "avg_order_value": 208.33,
        "total_items_purchased": 35,
        "account_age_days": 730,
        "email_open_rate": 0.65,
        "email_click_rate": 0.22,
    }

    pred_passed = 0
    pred_failed = 0

    try:
        response = requests.post(
            f"{BASE_URL}/api/v1/segmentation/predict",
            json=prediction_data,
            timeout=10,
        )
        if response.status_code == 200:
            result = response.json()
            print(f"  ✅ Single Prediction: PASS")
            print(f"     → Segment ID: {result.get('segment_id')}")
            print(f"     → Segment Name: {result.get('segment_name')}")
            print(f"     → Confidence: {result.get('confidence')}")
            pred_passed += 1
        else:
            print(f"  ❌ Single Prediction: FAIL (Status: {response.status_code})")
            pred_failed += 1
    except requests.exceptions.RequestException as e:
        print(f"  ❌ Single Prediction: FAIL ({str(e)})")
        pred_failed += 1

    # ---- Summary ----
    total_passed = file_passed + api_passed + pred_passed
    total_failed = file_failed + api_failed + pred_failed
    total_tests = total_passed + total_failed

    print("\n" + "=" * 60)
    print(f"📊 RESULTS SUMMARY")
    print("=" * 60)
    print(f"  Files:      {file_passed}/{file_passed + file_failed} passed")
    print(f"  API:        {api_passed}/{api_passed + api_failed} passed")
    print(f"  Prediction: {pred_passed}/{pred_passed + pred_failed} passed")
    print(f"  ─────────────────────────────────")
    print(f"  TOTAL:      {total_passed}/{total_tests} passed")
    print("=" * 60 + "\n")

    if total_failed == 0:
        print("✅ All tests passed! Backend is ready for frontend development.\n")
        return 0
    elif api_failed > 0 and file_failed == 0:
        print("⚠️  Files are OK but API tests failed.")
        print("   Make sure the backend server is running:")
        print("   uvicorn app.main:app --reload --host 127.0.0.1 --port 8000\n")
        return 1
    else:
        print("❌ Some tests failed. Please check the issues above.\n")
        return 1


if __name__ == "__main__":
    sys.exit(main())
