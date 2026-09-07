from scanner import scan_code

def test_secret_detection():
    result = scan_code('password = "admin123"')
    assert result.summary["total"] >= 1
    assert any(f.vulnerability == "Hardcoded Credential" for f in result.findings)

def test_sql_injection():
    result = scan_code('query = "SELECT * FROM users WHERE id=" + user_id')
    assert any(f.vulnerability == "SQL Injection" for f in result.findings)

def test_eval_detection():
    result = scan_code("eval(user_input)")
    assert any(f.vulnerability == "Dangerous Dynamic Execution" for f in result.findings)

def test_clean_code():
    result = scan_code('print("hello")')
    assert result.summary["total"] == 0
    assert result.score == 100
