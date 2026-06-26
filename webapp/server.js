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

app.get('/lab', (req, res) => {
  const username = req.query.user || '用户';
  res.send(getLabHTML(username));
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
  res.json({ success: true, message: '登录成功', username, redirect: `/lab?user=${encodeURIComponent(username)}` });
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
          ${isLogin
            ? `setTimeout(() => { window.location.href = data.redirect || '/'; }, 800);`
            : `setTimeout(() => { window.location.href = '/'; }, 1500);`}
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

// ---------------------------------------------------------------------------
// Lab page — black background, multiple inputs, keyboard-flash test
// ---------------------------------------------------------------------------
function getLabHTML(username) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <!--
    viewport: interactive-widget=resizes-content 是 Chrome 108+ 新属性，
    让浏览器在虚拟键盘弹出时收缩 visualViewport 而非 layout viewport，
    可避免 100vh 不更新导致的布局跳动。
    Android WebView 也支持此属性（Chromium 108+）。
  -->
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, interactive-widget=resizes-content">
  <title>键盘闪白测试 - Lab</title>
  <style>
    /*
     * 防闪白关键点 1：
     *   html/body 用 height:100% 而非 100vh。
     *   adjustResize 模式下 window 收缩时，100vh 不会同步缩小，
     *   导致内容溢出后底部露出白色窗口背景 → 闪白。
     *   height:100% 跟随父级，随 window resize 自动收缩，无露底。
     *
     * 防闪白关键点 2：
     *   html/body background 必须设为黑色（与 Android 窗口背景一致）。
     *   Android 端同样把 Window.setBackgroundDrawable 设为黑色。
     *   这样即使有短暂的重绘空隙，也是黑色对黑色，视觉上无闪烁。
     */
    html {
      height: 100%;
      background: #0a0a0a;
    }
    body {
      height: 100%;
      margin: 0;
      padding: 0;
      background: #0a0a0a;
      color: #e0e0e0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      /* 防止滚动条触发额外重排 */
      overflow-x: hidden;
    }

    /* 容器：用 min-height:100% 而非固定 height，允许内容比屏幕高时正常滚动 */
    .page {
      min-height: 100%;
      display: flex;
      flex-direction: column;
      padding: 24px 20px 40px;
      box-sizing: border-box;
    }

    .header {
      margin-bottom: 28px;
    }
    .header h1 {
      font-size: 20px;
      font-weight: 700;
      color: #ffffff;
      margin: 0 0 4px;
    }
    .header p {
      font-size: 13px;
      color: #666;
      margin: 0;
    }

    /* 策略说明卡片 */
    .strategy-card {
      background: #161616;
      border: 1px solid #2a2a2a;
      border-radius: 10px;
      padding: 14px 16px;
      margin-bottom: 28px;
      font-size: 12px;
      color: #888;
      line-height: 1.7;
    }
    .strategy-card strong {
      color: #aaa;
    }
    .tag {
      display: inline-block;
      padding: 1px 7px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      margin-right: 4px;
    }
    .tag-green  { background: #14532d; color: #86efac; }
    .tag-yellow { background: #713f12; color: #fde68a; }

    /* 输入区域 */
    .section-title {
      font-size: 12px;
      font-weight: 600;
      color: #555;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 12px;
    }

    .form-group {
      margin-bottom: 16px;
    }
    label {
      display: block;
      font-size: 13px;
      color: #888;
      margin-bottom: 6px;
    }
    input[type="text"],
    input[type="search"],
    input[type="number"],
    textarea {
      width: 100%;
      box-sizing: border-box;
      padding: 13px 14px;
      background: #161616;
      border: 1.5px solid #2a2a2a;
      border-radius: 8px;
      color: #e0e0e0;
      font-size: 16px;       /* ≥16px 防止 iOS/Android 自动缩放 */
      outline: none;
      transition: border-color 0.2s;
      -webkit-appearance: none;
      appearance: none;
      caret-color: #818cf8;
    }
    input:focus, textarea:focus {
      border-color: #4f46e5;
    }
    input::placeholder, textarea::placeholder { color: #444; }
    textarea {
      resize: none;
      height: 90px;
      line-height: 1.5;
    }

    /* 观察日志 */
    .log-box {
      margin-top: 28px;
      background: #0f0f0f;
      border: 1px solid #222;
      border-radius: 8px;
      padding: 12px 14px;
      font-size: 12px;
      color: #4ade80;
      font-family: 'Courier New', monospace;
      max-height: 160px;
      overflow-y: auto;
      word-break: break-all;
    }
    .log-box .log-title {
      color: #555;
      margin-bottom: 6px;
      font-family: inherit;
    }
    .log-entry { margin: 2px 0; }
    .log-entry.warn { color: #fbbf24; }
    .log-entry.info { color: #60a5fa; }

    .back-link {
      margin-top: 32px;
      text-align: center;
      font-size: 13px;
      color: #555;
    }
    .back-link a {
      color: #6366f1;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <h1>⌨️ 键盘闪白测试</h1>
      <p>欢迎，${username}。点击下方输入框，观察键盘弹出时是否闪白。</p>
    </div>

    <div class="strategy-card">
      <strong>已应用的防闪白策略：</strong><br>
      <span class="tag tag-green">✓</span> Android Window 背景色 = 黑色（最关键）<br>
      <span class="tag tag-green">✓</span> WebView 背景色 = 黑色<br>
      <span class="tag tag-green">✓</span> CSS html/body 用 <code>height:100%</code> 替代 <code>100vh</code><br>
      <span class="tag tag-green">✓</span> Manifest 使用 <code>adjustResize</code>（键盘压缩页面，内容始终可见）<br>
      <span class="tag tag-green">✓</span> 黑色 Window 背景消除 resize 期间的闪白
    </div>

    <div class="section-title">单行输入</div>

    <div class="form-group">
      <label>普通文本</label>
      <input type="text" placeholder="点击此处，观察键盘弹起" autocorrect="off" autocapitalize="off" spellcheck="false" />
    </div>
    <div class="form-group">
      <label>搜索框（带搜索键盘）</label>
      <input type="search" placeholder="搜索内容…" autocorrect="off" autocapitalize="off" />
    </div>
    <div class="form-group">
      <label>数字键盘</label>
      <input type="number" placeholder="0" inputmode="numeric" pattern="[0-9]*" />
    </div>

    <div class="section-title" style="margin-top:8px;">多行输入</div>
    <div class="form-group">
      <label>多行文本（长按可复制）</label>
      <textarea placeholder="在此输入多行内容，也可长按测试复制功能…"></textarea>
    </div>

    <div class="log-box" id="logBox">
      <div class="log-title">// visualViewport 事件日志</div>
    </div>

    <div class="back-link">
      <a href="/">← 返回登录页</a>
    </div>
  </div>

  <script>
    // 监听 visualViewport resize 事件，记录键盘弹出/收起的高度变化
    // 可用于判断键盘是否触发了异常的布局跳动
    const logBox = document.getElementById('logBox');
    let initialHeight = 0;

    function addLog(msg, type) {
      const el = document.createElement('div');
      el.className = 'log-entry' + (type ? ' ' + type : '');
      el.textContent = '[' + new Date().toLocaleTimeString('zh-CN', {hour12:false}) + '] ' + msg;
      logBox.appendChild(el);
      logBox.scrollTop = logBox.scrollHeight;
    }

    if (window.visualViewport) {
      initialHeight = window.visualViewport.height;
      addLog('初始高度: ' + Math.round(initialHeight) + 'px', 'info');

      window.visualViewport.addEventListener('resize', () => {
        const h = Math.round(window.visualViewport.height);
        const diff = Math.round(h - initialHeight);
        if (diff < -50) {
          addLog('键盘弹出 → 可视高度: ' + h + 'px (↓' + Math.abs(diff) + 'px)', 'warn');
        } else if (diff > 50) {
          addLog('键盘收起 → 可视高度: ' + h + 'px (↑' + diff + 'px)', 'info');
        }
      });
    } else {
      addLog('visualViewport API 不可用（旧版 WebView）', 'warn');

      // Fallback: 监听 window resize
      window.addEventListener('resize', () => {
        addLog('window.resize → innerHeight: ' + window.innerHeight + 'px', 'warn');
      });
    }

    // 页面加载完成后记录
    addLog('页面已加载，点击输入框测试', 'info');
  </script>
</body>
</html>`;
}
