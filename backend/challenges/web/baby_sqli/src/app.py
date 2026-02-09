"""Baby SQL Injection Challenge.

의도적으로 취약한 로그인 페이지.
SQL Injection으로 관리자 계정을 우회하면 플래그를 획득한다.
"""

import os
import sqlite3

from flask import Flask, render_template_string, request

app = Flask(__name__)

FLAG = open("/flag.txt").read().strip()
DB_PATH = "/tmp/users.db"

LOGIN_HTML = """
<!DOCTYPE html>
<html>
<head>
    <title>Baby SQLi - Login</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Courier New', monospace;
            background: #0a0a0f;
            color: #e0e0e0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
        }
        .container {
            background: #12121a;
            border: 1px solid #2a2a3a;
            border-radius: 8px;
            padding: 2rem;
            width: 360px;
        }
        h1 {
            color: #8b5cf6;
            font-size: 1.2rem;
            margin-bottom: 1.5rem;
            text-align: center;
        }
        label { display: block; margin-bottom: 0.3rem; font-size: 0.9rem; }
        input[type="text"], input[type="password"] {
            width: 100%;
            padding: 0.5rem;
            margin-bottom: 1rem;
            background: #1a1a2e;
            border: 1px solid #2a2a3a;
            border-radius: 4px;
            color: #e0e0e0;
            font-family: inherit;
        }
        button {
            width: 100%;
            padding: 0.6rem;
            background: #8b5cf6;
            color: #fff;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-family: inherit;
            font-weight: bold;
        }
        button:hover { background: #7c3aed; }
        .msg {
            margin-top: 1rem;
            padding: 0.5rem;
            border-radius: 4px;
            font-size: 0.85rem;
            text-align: center;
        }
        .error { background: #2d1215; color: #f87171; border: 1px solid #991b1b; }
        .success { background: #132016; color: #4ade80; border: 1px solid #166534; }
    </style>
</head>
<body>
<div class="container">
    <h1>&#x1f512; Admin Login</h1>
    <form method="POST" action="/login">
        <label>Username</label>
        <input type="text" name="username" autocomplete="off" required>
        <label>Password</label>
        <input type="password" name="password" autocomplete="off" required>
        <button type="submit">Login</button>
    </form>
    {% if msg %}
    <div class="msg {{ msg_class }}">{{ msg }}</div>
    {% endif %}
</div>
</body>
</html>
"""


def init_db() -> None:
    """DB 초기화 및 관리자 계정 삽입."""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute(
        "CREATE TABLE IF NOT EXISTS users "
        "(id INTEGER PRIMARY KEY, username TEXT, password TEXT, role TEXT)"
    )
    c.execute("SELECT COUNT(*) FROM users")
    if c.fetchone()[0] == 0:
        c.execute(
            "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
            ("admin", os.urandom(16).hex(), "admin"),
        )
        c.execute(
            "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
            ("guest", "guest", "user"),
        )
    conn.commit()
    conn.close()


@app.route("/")
def index():
    """로그인 페이지."""
    return render_template_string(LOGIN_HTML)


@app.route("/login", methods=["POST"])
def login():
    """로그인 처리 — 의도적으로 취약한 SQL 쿼리."""
    username = request.form.get("username", "")
    password = request.form.get("password", "")

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    # VULNERABLE: 사용자 입력이 쿼리에 직접 삽입됨
    query = (
        f"SELECT * FROM users WHERE username='{username}' AND password='{password}'"
    )
    try:
        c.execute(query)
        user = c.fetchone()
    except sqlite3.OperationalError:
        conn.close()
        return render_template_string(
            LOGIN_HTML, msg="SQL Error!", msg_class="error"
        )

    conn.close()

    if user and user[3] == "admin":
        return render_template_string(
            LOGIN_HTML,
            msg=f"Welcome, admin! Flag: {FLAG}",
            msg_class="success",
        )
    elif user:
        return render_template_string(
            LOGIN_HTML,
            msg="Logged in, but you are not admin.",
            msg_class="error",
        )
    else:
        return render_template_string(
            LOGIN_HTML,
            msg="Invalid credentials.",
            msg_class="error",
        )


# gunicorn 환경에서도 DB 초기화 보장
init_db()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
