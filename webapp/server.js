const express = require('express');
const app = express();
const PORT = 13014;

// In-memory user store for this minimal test
const users = new Map();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.send(getHTML('login'));
});

app.get('/register', (req, res) => {
  res.send(getHTML('register'));
});

app.post('/api/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.json({ success: false, message: '用户名和密码不能为空' });
  }
  if (users.has(username)) {
    return res.json({ success: false, message: '用户名已存在' });
  }
  users.set(username, password);
  res.json({ success: true, message: '注册成功' });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.json({ success: false, message: '用户名和密码不能为空' });
  }
  if (!users.has(username) || users.get(username) !== password) {
    return res.json({ success: false, message: '用户名或密码错误' });
  }
  res.json({ success: true, message: '登录成功', username });
});

function getHTML(page) {
  const isLogin = page === 'login';
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <title>${isLogin ? '登录' : '注册'} - TestApp</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f0f2f5;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 20px rgba(0,0,0,0.1);
      padding: 40px 32px;
      width: 100%;
      max-width: 400px;
    }
    h1 {
      font-size: 24px;
      color: #1a1a1a;
      margin-bottom: 8px;
      text-align: center;
    }
    .subtitle {
      text-align: center;
      color: #666;
      font-size: 14px;
      margin-bottom: 32px;
    }
    .form-group {
      margin-bottom: 20px;
    }
    label {
      display: block;
      font-size: 14px;
      font-weight: 500;
      color: #333;
      margin-bottom: 8px;
    }
    input {
      width: 100%;
      padding: 12px 16px;
      border: 1.5px solid #ddd;
      border-radius: 8px;
      font-size: 16px;
      color: #1a1a1a;
      background: #fafafa;
      outline: none;
      transition: border-color 0.2s;
      -webkit-appearance: none;
      appearance: none;
    }
    input:focus {
      border-color: #4f46e5;
      background: white;
    }
    input::placeholder { color: #aaa; }
    button[type="submit"] {
      width: 100%;
      padding: 13px;
      background: #4f46e5;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      margin-top: 8px;
      transition: background 0.2s;
    }
    button[type="submit"]:active { background: #4338ca; }
    .message {
      margin-top: 16px;
      padding: 12px;
      border-radius: 8px;
      font-size: 14px;
      text-align: center;
      display: none;
    }
    .message.success { background: #d1fae5; color: #065f46; display: block; }
    .message.error { background: #fee2e2; color: #991b1b; display: block; }
    .switch-link {
      text-align: center;
      margin-top: 24px;
      font-size: 14px;
      color: #666;
    }
    .switch-link a {
      color: #4f46e5;
      text-decoration: none;
      font-weight: 500;
    }
    .home-link {
      display: block;
      text-align: center;
      margin-top: 16px;
      font-size: 14px;
      color: #4f46e5;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>${isLogin ? '登录' : '注册'}</h1>
    <p class="subtitle">${isLogin ? '欢迎回来，请登录您的账户' : '创建一个新账户'}</p>
    <form id="mainForm">
      <div class="form-group">
        <label for="username">用户名</label>
        <input
          type="text"
          id="username"
          name="username"
          placeholder="请输入用户名"
          autocomplete="${isLogin ? 'username' : 'new-username'}"
          autocorrect="off"
          autocapitalize="off"
          spellcheck="false"
          required
        />
      </div>
      <div class="form-group">
        <label for="password">密码</label>
        <input
          type="password"
          id="password"
          name="password"
          placeholder="请输入密码"
          autocomplete="${isLogin ? 'current-password' : 'new-password'}"
          required
        />
      </div>
      <button type="submit">${isLogin ? '登录' : '注册'}</button>
      <div id="message" class="message"></div>
    </form>
    <div class="switch-link">
      ${isLogin
        ? '还没有账户？<a href="/register">立即注册</a>'
        : '已有账户？<a href="/">立即登录</a>'}
    </div>
  </div>

  <script>
    document.getElementById('mainForm').addEventListener('submit', async function(e) {
      e.preventDefault();
      const username = document.getElementById('username').value.trim();
      const password = document.getElementById('password').value;
      const msgEl = document.getElementById('message');
      msgEl.className = 'message';
      msgEl.textContent = '';

      if (!username || !password) {
        msgEl.className = 'message error';
        msgEl.textContent = '请填写用户名和密码';
        return;
      }

      try {
        const res = await fetch('/api/${isLogin ? 'login' : 'register'}', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (data.success) {
          msgEl.className = 'message success';
          msgEl.textContent = data.message;
          ${isLogin ? `setTimeout(() => { document.getElementById('mainForm').reset(); }, 1500);` : `setTimeout(() => { window.location.href = '/'; }, 1500);`}
        } else {
          msgEl.className = 'message error';
          msgEl.textContent = data.message;
        }
      } catch(err) {
        msgEl.className = 'message error';
        msgEl.textContent = '网络错误，请重试';
      }
    });
  </script>
</body>
</html>`;
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Web server running on http://0.0.0.0:${PORT}`);
});
