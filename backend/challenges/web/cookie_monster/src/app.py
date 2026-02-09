"""Cookie Monster - 쿠키 조작 웹 챌린지.

쿠키의 role 값을 admin으로 변경하면 플래그를 획득할 수 있다.
"""

import os

from flask import Flask, make_response, redirect, render_template_string, request

app = Flask(__name__)

FLAG = os.environ.get("FLAG", open("/flag.txt").read().strip())

USERS = {
    "guest": "guest123",
    "admin": "sup3r_s3cr3t_p4ssw0rd_n0_0ne_kn0ws",
}

LOGIN_PAGE = """
<!DOCTYPE html>
<html>
<head><title>Cookie Monster</title>
<style>
  body { background: #1a1a2e; color: #eee; font-family: monospace;
         display: flex; justify-content: center; align-items: center;
         height: 100vh; margin: 0; }
  .box { background: #16213e; padding: 2rem; border-radius: 8px;
         border: 1px solid #0f3460; width: 300px; }
  input { width: 100%%; padding: 8px; margin: 8px 0; background: #0f3460;
          border: 1px solid #533483; color: #eee; border-radius: 4px;
          box-sizing: border-box; }
  button { width: 100%%; padding: 10px; background: #533483; color: #eee;
           border: none; border-radius: 4px; cursor: pointer;
           font-weight: bold; }
  button:hover { background: #7b2cbf; }
  .error { color: #e74c3c; font-size: 0.9em; }
  h2 { color: #533483; text-align: center; }
</style></head>
<body>
<div class="box">
  <h2>Cookie Monster</h2>
  {% if error %}<p class="error">{{ error }}</p>{% endif %}
  <form method="POST" action="/login">
    <input name="username" placeholder="Username" required>
    <input name="password" type="password" placeholder="Password" required>
    <button type="submit">Login</button>
  </form>
</div>
</body></html>
"""

HOME_PAGE = """
<!DOCTYPE html>
<html>
<head><title>Cookie Monster - Home</title>
<style>
  body { background: #1a1a2e; color: #eee; font-family: monospace;
         display: flex; justify-content: center; align-items: center;
         height: 100vh; margin: 0; }
  .box { background: #16213e; padding: 2rem; border-radius: 8px;
         border: 1px solid #0f3460; width: 400px; text-align: center; }
  h2 { color: #533483; }
  a { color: #533483; }
  .info { background: #0f3460; padding: 1rem; border-radius: 4px;
          margin-top: 1rem; text-align: left; }
</style></head>
<body>
<div class="box">
  <h2>Welcome, {{ username }}!</h2>
  <p>Role: <strong>{{ role }}</strong></p>
  <div class="info">
    <p>You are logged in as a regular user.</p>
    <p>Try accessing <a href="/admin">/admin</a> to get the flag!</p>
  </div>
  <p style="margin-top:1rem"><a href="/logout">Logout</a></p>
</div>
</body></html>
"""

ADMIN_PAGE = """
<!DOCTYPE html>
<html>
<head><title>Cookie Monster - Admin</title>
<style>
  body { background: #1a1a2e; color: #eee; font-family: monospace;
         display: flex; justify-content: center; align-items: center;
         height: 100vh; margin: 0; }
  .box { background: #16213e; padding: 2rem; border-radius: 8px;
         border: 1px solid #0f3460; width: 400px; text-align: center; }
  h2 { color: #533483; }
  .flag { background: #0f3460; padding: 1rem; border-radius: 4px;
          margin-top: 1rem; font-size: 1.2em; color: #2ecc71;
          word-break: break-all; }
</style></head>
<body>
<div class="box">
  <h2>Admin Panel</h2>
  <p>Congratulations! You are admin!</p>
  <div class="flag">{{ flag }}</div>
</div>
</body></html>
"""

DENIED_PAGE = """
<!DOCTYPE html>
<html>
<head><title>Cookie Monster - Access Denied</title>
<style>
  body { background: #1a1a2e; color: #eee; font-family: monospace;
         display: flex; justify-content: center; align-items: center;
         height: 100vh; margin: 0; }
  .box { background: #16213e; padding: 2rem; border-radius: 8px;
         border: 1px solid #0f3460; width: 400px; text-align: center; }
  h2 { color: #e74c3c; }
  a { color: #533483; }
</style></head>
<body>
<div class="box">
  <h2>Access Denied</h2>
  <p>You need admin privileges to access this page.</p>
  <p>Your current role: <strong>{{ role }}</strong></p>
  <p><a href="/">Back to Home</a></p>
</div>
</body></html>
"""


@app.route("/")
def index():
    username = request.cookies.get("username")
    role = request.cookies.get("role")
    if not username:
        return redirect("/login")
    return render_template_string(HOME_PAGE, username=username, role=role)


@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "GET":
        return render_template_string(LOGIN_PAGE, error=None)

    username = request.form.get("username", "")
    password = request.form.get("password", "")

    if username in USERS and USERS[username] == password:
        resp = make_response(redirect("/"))
        resp.set_cookie("username", username)
        resp.set_cookie("role", "user")  # Always set role to 'user'
        return resp

    return render_template_string(LOGIN_PAGE, error="Invalid credentials!")


@app.route("/admin")
def admin():
    username = request.cookies.get("username")
    role = request.cookies.get("role")

    if not username:
        return redirect("/login")

    if role == "admin":
        return render_template_string(ADMIN_PAGE, flag=FLAG)

    return render_template_string(DENIED_PAGE, role=role), 403


@app.route("/logout")
def logout():
    resp = make_response(redirect("/login"))
    resp.delete_cookie("username")
    resp.delete_cookie("role")
    return resp


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
