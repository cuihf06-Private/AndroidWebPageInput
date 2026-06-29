const express = require('express');
const app = express();
const PORT = 13014;

// In-memory user store for this minimal test
const users = new Map();

// Track which users are "logged in" (in-memory; just for routing into /chat)
const sessions = new Map();

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
  // Issue a simple session token and set a cookie
  const token = Math.random().toString(36).slice(2) + Date.now().toString(36);
  sessions.set(token, username);
  res.cookie('sid', token, { httpOnly: false, sameSite: 'lax' });
  res.json({ success: true, message: '登录成功', username });
});

// Chat page — only reachable after login
app.get('/chat', (req, res) => {
  const sid = (req.query.sid || '').toString();
  const username = sessions.get(sid);
  if (!username) {
    return res.redirect('/');
  }
  res.send(getChatHTML(username));
});

app.get('/logout', (req, res) => {
  res.redirect('/');
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
          ${isLogin ? `
            // Read sid from the cookie we just received, then go to /chat
            function getCookie(name) {
              const m = document.cookie.match(new RegExp('(^|; )' + name + '=([^;]*)'));
              return m ? decodeURIComponent(m[2]) : null;
            }
            setTimeout(() => {
              const sid = getCookie('sid');
              if (sid) {
                window.location.href = '/chat?sid=' + encodeURIComponent(sid);
              } else {
                window.location.href = '/';
              }
            }, 800);
          ` : `setTimeout(() => { window.location.href = '/'; }, 1500);`}
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

function getChatHTML(username) {
  // Mock chat content. Mix of user / assistant bubbles, all selectable.
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>对话 - TestApp</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }

    /* IMPORTANT — text-selection scoping trick for Android WebView.
       - Default to no selection on chrome.
       - Explicitly re-enable on the bubble leaf and all of its descendants.
       This avoids the historical WebKit quirk where a parent user-select:none
       propagates to children and breaks selection entirely. */
    html, body {
      -webkit-user-select: none;
      user-select: none;
      -webkit-touch-callout: none;
      -webkit-tap-highlight-color: transparent;
    }

    /* The chat-bubble text — must be user-select:text to allow the floating
       selection handles to appear in Android WebView. */
    .bubble, .bubble * {
      -webkit-user-select: text;
      user-select: text;
      -webkit-touch-callout: default;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #ededed;
      min-height: 100vh;
      padding-bottom: 80px;
    }

    .topbar {
      position: sticky;
      top: 0;
      z-index: 10;
      background: #4f46e5;
      color: #fff;
      padding: 14px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 1px 4px rgba(0,0,0,.1);
    }
    .topbar .title { font-size: 16px; font-weight: 600; }
    .topbar .user { font-size: 13px; opacity: .9; }
    .topbar a {
      color: #fff; text-decoration: none; font-size: 13px;
      padding: 4px 10px; border: 1px solid rgba(255,255,255,.5); border-radius: 4px;
    }

    .hint {
      background: #fffbe6;
      color: #6b5900;
      font-size: 13px;
      padding: 10px 14px;
      border-bottom: 1px solid #f1e6a8;
      line-height: 1.5;
    }

    .chat {
      padding: 12px 10px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .row { display: flex; width: 100%; }
    .row.user { justify-content: flex-end; }
    .row.bot  { justify-content: flex-start; }

    .bubble {
      max-width: 78%;
      padding: 10px 13px;
      border-radius: 12px;
      font-size: 15px;
      line-height: 1.55;
      word-break: break-word;
      white-space: pre-wrap;
      box-shadow: 0 1px 1px rgba(0,0,0,.05);
    }
    .row.user .bubble {
      background: #95ec69;
      color: #1a1a1a;
      border-top-right-radius: 4px;
    }
    .row.bot .bubble {
      background: #ffffff;
      color: #1a1a1a;
      border-top-left-radius: 4px;
    }
    .meta {
      font-size: 11px;
      color: #888;
      margin-top: 3px;
      padding: 0 4px;
    }
    .row.user .meta { text-align: right; }
  </style>
</head>
<body>
  <div class="topbar">
    <div class="title">聊天测试</div>
    <div>
      <span class="user">${username}</span>
      &nbsp;
      <a href="/logout">退出</a>
    </div>
  </div>

  <div class="hint">
    测试说明：长按下方任意一条 <b>对话泡泡</b>，在弹出的菜单中点击 <b>“选择文字”</b>。
    理想表现：文字被高亮后，文字两端应出现 <b>带放大镜的拖动柄</b>，可调整选区，并可点击放大镜打开复制等菜单。
  </div>

  <div class="chat">
    <div class="row bot">
      <div>
        <div class="bubble" id="b1">你好，我是测试助手，可以和你聊聊天。请尝试长按这条消息，看看能不能出现“选择文字”以及选区两端的拖动手柄。</div>
        <div class="meta">10:00</div>
      </div>
    </div>

    <div class="row user">
      <div>
        <div class="bubble" id="b2">你好！我现在就在测试这个功能。我用的是华为手机，封装了 WebView 的安卓 APP。</div>
        <div class="meta">10:01</div>
      </div>
    </div>

    <div class="row bot">
      <div>
        <div class="bubble" id="b3">好的。下面我再多发几条消息，方便你测试不同的长度和换行。长按任意一条对话消息，弹出菜单后选择“选择文字”，正常的话你应该能看到选区两端的拖动柄以及顶部的复制 / 分享 / 搜索 等操作按钮。</div>
        <div class="meta">10:01</div>
      </div>
    </div>

    <div class="row bot">
      <div>
        <div class="bubble" id="b4">这是一段比较长的文字：从前有座山，山里有座庙，庙里有个老和尚在讲故事。讲的什么呢？从前有座山，山里有座庙，庙里有个老和尚在讲故事……这个故事可以一直循环下去，纯粹是为了测试长文本在选区出现之后，拖动柄是否仍然能正常工作。</div>
        <div class="meta">10:02</div>
      </div>
    </div>

    <div class="row user">
      <div>
        <div class="bubble" id="b5">收到。我去试试看。</div>
        <div class="meta">10:03</div>
      </div>
    </div>

    <div class="row bot">
      <div>
        <div class="bubble" id="b6">还有一段包含英文、数字、标点的混合文本：Hello, this is a mixed-content bubble — 1234567890 !@#¥%…&*()，用来测试中英文混排时选择手柄是否依然能正常出现并能拖动调整范围。</div>
        <div class="meta">10:04</div>
      </div>
    </div>

    <div class="row user">
      <div>
        <div class="bubble" id="b7">好的，我已经看到了！文字高亮以后两个手柄都出现了，拖动也很顺滑，点击手柄上的小气球还能看到复制等操作。</div>
        <div class="meta">10:05</div>
      </div>
    </div>
  </div>

  <script>
    // Defensive: don't let any ancestor's selectstart handler swallow the event.
    // We attach a no-op listener that does NOT call preventDefault, so chromium
    // can still drive its native selection / startActionMode flow.
    document.addEventListener('selectstart', function(e) {
      // Allow default. (If you ever see selection broken on a child, that means
      // some other code is calling preventDefault — investigate that code, not this one.)
    }, true);

    // Defensive: same for selectionchange — read-only observation.
    document.addEventListener('selectionchange', function() {
      // No-op. We don't need to react here, but having the listener registered
      // is harmless and proves the WebView is firing events as expected.
    });
  </script>
</body>
</html>`;
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Web server running on http://0.0.0.0:${PORT}`);
});
