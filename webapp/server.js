const express = require('express');
const path = require('path');
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

app.get('/chat', (req, res) => {
  const username = req.query.username || '游客';
  res.send(getChatHTML(username));
});

// 提供静态文件用于下载（txt / json）
app.get('/download/:filename', (req, res) => {
  const filename = req.params.filename;
  // 防止目录穿越
  if (filename.includes('..') || filename.includes('/')) {
    return res.status(400).send('Bad filename');
  }

  if (filename.endsWith('.txt')) {
    const content =
      `聊天记录导出 (TXT)\n` +
      `导出时间: ${new Date().toLocaleString('zh-CN')}\n` +
      `----------------------------\n` +
      `[10:00] 用户: 你好\n` +
      `[10:00] 助手: 你好！有什么可以帮助你的吗？\n` +
      `[10:01] 用户: 帮我生成一段测试文本\n` +
      `[10:01] 助手: 这是一段用于测试下载功能的文本内容。\n` +
      `----------------------------\n` +
      `文件下载自 AndroidWebPageInput 测试应用。\n`;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(content);
  }

  if (filename.endsWith('.json')) {
    const data = {
      app: 'AndroidWebPageInput',
      exportedAt: new Date().toISOString(),
      messages: [
        { role: 'user', time: '10:00', text: '你好' },
        { role: 'assistant', time: '10:00', text: '你好！有什么可以帮助你的吗？' },
        { role: 'user', time: '10:01', text: '帮我生成一段测试文本' },
        { role: 'assistant', time: '10:01', text: '这是一段用于测试下载功能的文本内容。' },
      ],
    };
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(JSON.stringify(data, null, 2));
  }

  res.status(404).send('Not found');
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
          ${isLogin
            ? `setTimeout(() => { window.location.href = '/chat?username=' + encodeURIComponent(username); }, 800);`
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

function getChatHTML(username) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>聊天 - TestApp</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      height: 100%;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #ededed;
      color: #1a1a1a;
      -webkit-text-size-adjust: 100%;
      touch-action: manipulation;
    }
    .app {
      display: flex;
      flex-direction: column;
      height: 100vh;
      max-width: 720px;
      margin: 0 auto;
      background: #ededed;
    }
    .topbar {
      flex: 0 0 auto;
      background: #ededed;
      border-bottom: 1px solid #d6d6d6;
      padding: 12px 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .topbar .title {
      font-size: 17px;
      font-weight: 600;
      color: #1a1a1a;
    }
    .topbar .user {
      font-size: 13px;
      color: #888;
    }
    .messages {
      flex: 1 1 auto;
      overflow-y: auto;
      padding: 14px 12px;
      -webkit-overflow-scrolling: touch;
    }
    .msg-row {
      display: flex;
      margin-bottom: 12px;
      align-items: flex-start;
    }
    .msg-row.me { justify-content: flex-end; }
    .msg-row.bot { justify-content: flex-start; }
    .avatar {
      width: 36px;
      height: 36px;
      border-radius: 6px;
      flex: 0 0 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 14px;
      font-weight: 600;
    }
    .msg-row.me .avatar { background: #07c160; margin-left: 8px; order: 2; }
    .msg-row.bot .avatar { background: #4f46e5; margin-right: 8px; }
    .bubble {
      max-width: 75%;
      padding: 10px 12px;
      border-radius: 4px;
      font-size: 15px;
      line-height: 1.45;
      word-break: break-word;
      white-space: pre-wrap;
      position: relative;
    }
    .msg-row.me .bubble {
      background: #95ec69;
      color: #1a1a1a;
    }
    .msg-row.me .bubble::after {
      content: '';
      position: absolute;
      right: -6px;
      top: 12px;
      width: 0;
      height: 0;
      border-top: 6px solid transparent;
      border-bottom: 6px solid transparent;
      border-left: 6px solid #95ec69;
    }
    .msg-row.bot .bubble {
      background: #ffffff;
      color: #1a1a1a;
    }
    .msg-row.bot .bubble::after {
      content: '';
      position: absolute;
      left: -6px;
      top: 12px;
      width: 0;
      height: 0;
      border-top: 6px solid transparent;
      border-bottom: 6px solid transparent;
      border-right: 6px solid #ffffff;
    }
    .bubble .meta {
      display: block;
      font-size: 11px;
      color: #b2b2b2;
      margin-top: 4px;
    }
    .inputbar {
      flex: 0 0 auto;
      background: #f7f7f7;
      border-top: 1px solid #d6d6d6;
      padding: 8px 8px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .inputbar input {
      flex: 1 1 auto;
      min-width: 0;
      padding: 9px 12px;
      border: 1px solid #d6d6d6;
      border-radius: 6px;
      font-size: 15px;
      background: white;
      outline: none;
      -webkit-appearance: none;
      appearance: none;
    }
    .inputbar input:focus { border-color: #07c160; }
    .icon-btn {
      flex: 0 0 auto;
      width: 38px;
      height: 38px;
      border-radius: 6px;
      border: none;
      background: #ffffff;
      color: #555;
      font-size: 18px;
      cursor: pointer;
    }
    .icon-btn:active { background: #e9e9e9; }
    .send-btn {
      background: #07c160;
      color: white;
    }
    .send-btn:active { background: #06ad56; }
    .toolbar {
      flex: 0 0 auto;
      background: #f7f7f7;
      border-top: 1px solid #e0e0e0;
      padding: 10px 12px;
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .dl-btn {
      flex: 1 1 auto;
      min-width: 140px;
      padding: 10px 12px;
      border-radius: 6px;
      border: 1px solid #07c160;
      background: white;
      color: #07c160;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
    }
    .dl-btn:active { background: #e9f8ef; }
    .dl-btn.primary {
      background: #07c160;
      color: white;
    }
    .dl-btn.primary:active { background: #06ad56; }
    #status {
      flex: 0 0 auto;
      text-align: center;
      font-size: 12px;
      color: #888;
      padding: 6px 10px;
      background: #f7f7f7;
      border-top: 1px solid #e0e0e0;
      min-height: 26px;
    }
  </style>
</head>
<body>
  <div class="app">
    <div class="topbar">
      <div class="title">小智同学</div>
      <div class="user">${escapeHtml(username)}</div>
    </div>

    <div class="messages" id="messages">
      <div class="msg-row bot">
        <div class="avatar">AI</div>
        <div class="bubble">你好，我是小智同学。👋<span class="meta">10:00</span></div>
      </div>
      <div class="msg-row me">
        <div class="avatar">我</div>
        <div class="bubble">帮我把这次对话导出成文件吧<span class="meta">10:01</span></div>
      </div>
      <div class="msg-row bot">
        <div class="avatar">AI</div>
        <div class="bubble">好的，请点击下方下载按钮，支持导出为 .txt 或 .json 格式。<span class="meta">10:01</span></div>
      </div>
    </div>

    <div class="toolbar">
      <button class="dl-btn primary" data-format="txt">⬇ 下载为 .txt</button>
      <button class="dl-btn" data-format="json">⬇ 下载为 .json</button>
    </div>

    <div class="inputbar">
      <button class="icon-btn" id="emojiBtn" title="表情">😊</button>
      <input id="msgInput" type="text" placeholder="输入消息…" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" />
      <button class="icon-btn send-btn" id="sendBtn" title="发送">➤</button>
    </div>

    <div id="status">就绪</div>
  </div>

  <script>
    const statusEl = document.getElementById('status');
    function setStatus(text) {
      statusEl.textContent = text;
    }

    function showBubble(text, who) {
      const messages = document.getElementById('messages');
      const row = document.createElement('div');
      row.className = 'msg-row ' + (who === 'me' ? 'me' : 'bot');
      const avatar = document.createElement('div');
      avatar.className = 'avatar';
      avatar.textContent = who === 'me' ? '我' : 'AI';
      const bubble = document.createElement('div');
      bubble.className = 'bubble';
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      bubble.innerHTML = escapeHtml(text) + '<span class="meta">' + hh + ':' + mm + '</span>';
      row.appendChild(avatar);
      row.appendChild(bubble);
      messages.appendChild(row);
      messages.scrollTop = messages.scrollHeight;
    }

    function escapeHtml(s) {
      return String(s).replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
      }[c]));
    }

    // 发送消息（仅本地 UI 回显）
    document.getElementById('sendBtn').addEventListener('click', () => {
      const input = document.getElementById('msgInput');
      const text = input.value.trim();
      if (!text) return;
      showBubble(text, 'me');
      input.value = '';
      setTimeout(() => showBubble('已收到你的消息：' + text, 'bot'), 400);
    });

    document.getElementById('msgInput').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') document.getElementById('sendBtn').click();
    });

    document.getElementById('emojiBtn').addEventListener('click', () => {
      const input = document.getElementById('msgInput');
      input.value += '🙂';
      input.focus();
    });

    // 下载：优先使用 a[download]，兼容性更好；其次用 fetch+blob 备用
    async function downloadFile(format) {
      const url = '/download/chat.' + format;
      const filename = 'chat-' + Date.now() + '.' + format;
      setStatus('开始下载：' + filename);

      // 方式 1：标准 a[download] —— Android WebView 会回调 onDownloadStart
      try {
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;  // 关键：download 属性会触发 WebView 下载
        a.rel = 'noopener';
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => document.body.removeChild(a), 0);
        setStatus('已发起下载：' + filename + '（请在系统通知中查看）');
        return;
      } catch (err) {
        console.warn('a[download] failed, fallback to fetch+blob', err);
      }

      // 方式 2：fetch + blob + a[download] 兜底
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
        setStatus('已通过 blob 方式下载：' + filename);
      } catch (err) {
        setStatus('下载失败：' + err.message);
        alert('下载失败：' + err.message);
      }
    }

    document.querySelectorAll('.dl-btn').forEach(btn => {
      btn.addEventListener('click', () => downloadFile(btn.dataset.format));
    });
  </script>
</body>
</html>`;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Web server running on http://0.0.0.0:${PORT}`);
});
